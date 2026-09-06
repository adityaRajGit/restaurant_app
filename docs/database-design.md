# Dine-In Ordering — System & Database Design

Scope: customer scans a QR at the table, adds food to a cart, places an order.
The order appears on the manager's screen as "Table 23" and on the chef's screen
as a ticket. The chef flips each food item from **in progress** to **done**.
Multiple customers sit at the same table, each ordering on their own phone.

---

## 1. System design, in plain language

### The four screens

| Screen | Who | What it does |
|---|---|---|
| Customer web app | Diner's phone | Opens from QR scan. Browse menu -> cart -> place order -> watch status |
| Chef / KDS screen | Kitchen | A live queue of tickets. Tap an item: in progress -> done |
| Manager screen | Floor manager | Live grid of all tables, every order on each table, running bill |
| Admin | Owner | Menu items, prices, availability, tables, staff |

### The one idea that makes this work: a **table session**

A "table" is a permanent thing (Table 23 exists forever). A **session** is one
group of people sitting at that table for one meal. A session opens when the
first person scans, and closes when the manager marks the table paid.

```
Table 23  --has many over time-->  Session (Fri 8:12pm)  -- closed 9:40pm
                                   Session (Fri 9:55pm)  -- open
```

Everything else hangs off the session:

```
Table 23
  |- Session #A7F3 (open)
       |- Guest "Aditya"  -> own cart -> Order #1042 (paneer tikka, naan)
       |- Guest "Riya"    -> own cart -> Order #1043 (dal, rice)
       |- Guest "Sam"     -> own cart -> Order #1047 (gulab jamun)
       |- running bill = 1042 + 1043 + 1047
```

That is exactly what "multiple customers on one table" means in the data:
**one session, many guests, many orders, one bill.**

### The flow, step by step

1. **QR** — printed once per table. It encodes a fixed URL:
   `https://yourapp.com/t/<qr_token>`. The QR never changes and never contains
   a session id — sessions come and go, the sticker on the table does not.

2. **Scan** — the server looks up the table by `qr_token`, then:
   - if that table already has an **open** session -> join it
   - if not -> create a new session

   The server then creates a **guest** inside the session, asks for a first name
   (optional), and drops a `guest_token` cookie on the phone. No login, no OTP,
   no password. If the same phone re-scans, the cookie puts them back on their
   own cart.

3. **Cart** — every add/remove writes to that guest's cart row. The cart is
   scratch paper: it is not an order and the kitchen never sees it.

4. **Place order** — the cart is *frozen into an order*: the name and price of
   each dish are **copied** into the order. If you change the menu price
   tomorrow, yesterday's bill does not silently change. The cart is then emptied.

5. **Broadcast** — the server pushes the new order over Socket.IO to two rooms:
   `kitchen` (all chef screens) and `manager` (all manager screens), plus
   `session:<id>` so the diners see "order placed". Chefs and managers do not
   poll — the server pushes.

6. **Cook** — chef taps an item: `queued` -> `in_progress` -> `done`. That single
   item's status updates, and the change is broadcast to the same three rooms.
   When every item in an order is `done`, the order rolls up to `ready`.

7. **Serve & close** — the waiter marks the order `served`. The manager taps
   "Close table" when paid -> session `closed`. The next scan on Table 23 starts
   a fresh session with a fresh bill.

### Realtime, concretely

Socket.IO with three room types:

| Room | Joined by | Receives |
|---|---|---|
| `session:<sessionId>` | diners at that table | their table's order status |
| `kitchen` | chef screens | every new order + every item status change |
| `manager` | manager screens | everything above + session open/close |

Rule: **write to MongoDB first, emit second.** The socket is a notification, not
the source of truth. On reconnect the chef screen re-fetches the open queue over
plain REST, so a dropped websocket never loses a ticket.

### Deliberately NOT in this design

Online payments, delivery, coupons, loyalty points, reservations, inventory
depletion, waiter-call buttons, split-bill maths. Each is a clean bolt-on later.
The session is the hook for payments; the order item is the hook for inventory.

---

## 2. Database choice

**MongoDB + Mongoose** — already the project's stack, and the shape fits: an
order is one document read and written as one unit (ticket in, ticket out), and
the embedded item array is exactly what the chef screen renders. No joins on the
hot path.

Two rules applied throughout:

- **Money is an integer in paise.** `24999` = Rs 249.99. Never floats for money.
- **Prices and names are snapshotted** onto orders at placement time.

---

## 3. Collections at a glance

| Collection | Holds | Grows |
|---|---|---|
| `staff` | manager / chef / admin logins | tiny |
| `tables` | physical tables + their QR token | tiny |
| `menu_items` | the menu | small |
| `table_sessions` | one sitting at one table, guests embedded | 1 per party |
| `carts` | scratch cart, one per guest | ephemeral |
| `orders` | placed orders + per-item cook status | the big one |

Relationships:

```
staff (standalone)

tables 1 ---- N table_sessions 1 ---- N orders ---- N items (embedded)
                     |                                   |
                     |- guests[] (embedded)              |- ref menu_items
                          |
                          |- 1 -- 1 carts
```

---

## 4. Schemas

### `src/common/models/staff.js`

```js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Staff = anyone who logs in on a back-of-house screen.
// Diners never appear here; they are anonymous guests inside a table session.
const staffSchema = new Schema({
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true },            // bcrypt hash
    role:          { type: String, enum: ['admin', 'manager', 'chef', 'waiter'], required: true, index: true },
    is_active:     { type: Boolean, default: true },
    last_login_at: { type: Date }
}, { timestamps: true, versionKey: false });

export default mongoose.model('Staff', staffSchema);
```

### `src/common/models/table.js`

```js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// A physical table. Created once, lives forever. The QR sticker encodes
// https://app.com/t/<qr_token> — a token, never the raw table number, so a
// guest cannot guess another table's URL by typing /t/24.
const tableSchema = new Schema({
    number:    { type: String, required: true, unique: true, trim: true },  // "23", "P4"
    label:     { type: String, trim: true },                                // "Patio 4"
    seats:     { type: Number, min: 1, default: 4 },
    qr_token:  { type: String, required: true, unique: true, index: true }, // crypto.randomBytes(16).toString('hex')
    is_active: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });

export default mongoose.model('Table', tableSchema);
```

### `src/common/models/tableSession.js`

```js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// One diner in one sitting. Embedded because a party is small and bounded,
// and a guest has no meaning outside its session.
const guestSchema = new Schema({
    display_name: { type: String, trim: true, default: 'Guest' },
    // Random secret stored in the phone's cookie. Re-scanning returns the diner
    // to their own cart instead of creating a duplicate guest.
    guest_token:  { type: String, required: true },
    joined_at:    { type: Date, default: Date.now }
}, { _id: true });

// One party at one table for one meal. This is the unit the manager sees as
// "Table 23" and the unit the bill is calculated over.
const tableSessionSchema = new Schema({
    table:        { type: Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
    // Denormalised so the manager grid and kitchen ticket can print "Table 23"
    // without a second lookup. Table numbers effectively never change.
    table_number: { type: String, required: true },

    // Short human code shown on screen, e.g. "A7F3" — so staff can say
    // "session A7F3" out loud instead of reading an ObjectId.
    code:         { type: String, required: true, unique: true },

    status:       { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    guests:       { type: [guestSchema], default: [] },

    // Running total across every non-cancelled order in this session, in paise.
    // Recomputed on order place / cancel — cheap, and keeps the manager grid to
    // a single query with no aggregation.
    total_paise:  { type: Number, default: 0, min: 0 },

    opened_at:    { type: Date, default: Date.now },
    closed_at:    { type: Date },
    closed_by:    { type: Schema.Types.ObjectId, ref: 'Staff' }
}, { timestamps: true, versionKey: false });

// Hard guarantee: a table can have at most ONE open session at a time.
// Without this, two people scanning simultaneously create two sessions and the
// table ends up with two separate bills.
tableSessionSchema.index(
    { table: 1 },
    { unique: true, partialFilterExpression: { status: 'open' } }
);

// Manager grid: all open sessions, newest first.
tableSessionSchema.index({ status: 1, opened_at: -1 });

// Look up a returning phone's guest.
tableSessionSchema.index({ 'guests.guest_token': 1 });

export default mongoose.model('TableSession', tableSessionSchema);
```

### `src/common/models/menuItem.js`

```js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const menuItemSchema = new Schema({
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price_paise: { type: Number, required: true, min: 0 },   // 24999 = Rs 249.99
    category:    { type: String, required: true, trim: true, index: true }, // "Starters"
    food_type:   { type: String, enum: ['veg', 'non_veg', 'egg'], default: 'veg' },
    image_url:   { type: String, trim: true },

    // Drives the chef screen's expected-ready time. Nothing more.
    prep_minutes: { type: Number, min: 0, default: 10 },

    // Flipped off when the kitchen runs out. Hidden from the customer menu.
    is_available: { type: Boolean, default: true, index: true },

    // Manual sort within a category so the owner controls menu order.
    display_order: { type: Number, default: 0 },

    is_deleted:  { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

// The customer menu query: available items, grouped by category, in order.
menuItemSchema.index({ is_deleted: 1, is_available: 1, category: 1, display_order: 1 });

export default mongoose.model('MenuItem', menuItemSchema);
```

### `src/common/models/cart.js`

```js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
    menu_item: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity:  { type: Number, required: true, min: 1 },
    notes:     { type: String, trim: true, maxlength: 200 }   // "less spicy"
}, { _id: false });

// One cart per guest per session. A separate collection, not embedded in the
// session: carts are written on every single tap, and embedding would make
// three people at one table contend on the same document.
// No prices stored here — the cart is priced from the live menu at checkout.
const cartSchema = new Schema({
    session: { type: Schema.Types.ObjectId, ref: 'TableSession', required: true },
    guest:   { type: Schema.Types.ObjectId, required: true },   // _id of session.guests[]
    items:   { type: [cartItemSchema], default: [] }
}, { timestamps: true, versionKey: false });

cartSchema.index({ session: 1, guest: 1 }, { unique: true });

export default mongoose.model('Cart', cartSchema);
```

### `src/common/models/order.js`

```js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// A line on the ticket. This is the thing the chef flips to "done".
// name and unit price are COPIED from the menu at placement time so an
// afternoon price change never rewrites the morning's bills.
const orderItemSchema = new Schema({
    menu_item:        { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name:             { type: String, required: true },
    unit_price_paise: { type: Number, required: true, min: 0 },
    quantity:         { type: Number, required: true, min: 1 },
    line_total_paise: { type: Number, required: true, min: 0 },  // unit_price * quantity
    notes:            { type: String, trim: true },

    status:      { type: String, enum: ['queued', 'in_progress', 'done', 'cancelled'], default: 'queued' },
    started_at:  { type: Date },
    done_at:     { type: Date },
    handled_by:  { type: Schema.Types.ObjectId, ref: 'Staff' }   // which chef
}, { _id: true });   // _id required: the chef screen updates one item by id

const orderSchema = new Schema({
    // Human-readable, shown on the ticket and called out on the floor.
    order_number: { type: String, required: true, unique: true },  // "1042"

    session:      { type: Schema.Types.ObjectId, ref: 'TableSession', required: true, index: true },
    table:        { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    // Denormalised for the kitchen ticket header: "TABLE 23" without a join.
    table_number: { type: String, required: true },

    // Who at the table ordered this — so the waiter knows whose plate it is.
    guest:        { type: Schema.Types.ObjectId, required: true },
    guest_name:   { type: String, trim: true },

    items: {
        type: [orderItemSchema],
        validate: [v => Array.isArray(v) && v.length > 0, 'order must have at least one item']
    },

    // Rolled up from items[]:
    //   any queued       -> placed
    //   any in_progress  -> preparing
    //   all done         -> ready
    //   marked by waiter -> served
    status: {
        type: String,
        enum: ['placed', 'preparing', 'ready', 'served', 'cancelled'],
        default: 'placed',
        index: true
    },

    total_paise: { type: Number, required: true, min: 0 },

    placed_at:     { type: Date, default: Date.now },
    ready_at:      { type: Date },
    served_at:     { type: Date },
    cancelled_at:  { type: Date },
    cancel_reason: { type: String, trim: true }
}, { timestamps: true, versionKey: false });

// The chef screen: live queue, oldest ticket first.
orderSchema.index({ status: 1, placed_at: 1 });

// The manager screen / bill: every order on one table session.
orderSchema.index({ session: 1, placed_at: -1 });

export default mongoose.model('Order', orderSchema);
```

---

## 5. Why each non-obvious choice

| Choice | Reason |
|---|---|
| `table_sessions` between table and orders | Without it there is no clean answer to "what does Table 23 owe right now" — you would be guessing at time windows |
| Guests embedded in the session | A party is 2-10 people and a guest is meaningless outside its sitting. Embedding keeps the manager's table view to one read |
| Carts in their own collection | Highest write churn in the app. Embedding them in the session would make guests at one table contend on one document |
| Order items embedded, with `_id` | A ticket is read and rendered as one unit. The `_id` lets the chef update exactly one line: match `items._id`, set `items.$.status` |
| Name + price copied onto order items | An order is a financial record. Menu edits must never retroactively change a placed order |
| Partial unique index on open sessions | The race-condition guard: two simultaneous scans cannot split one table into two bills |
| Integer paise | Floats lose money — `0.1 + 0.2 !== 0.3` |
| `qr_token` instead of table number in the URL | Otherwise anyone types `/t/24` and orders onto a stranger's bill |
| No `users` collection for diners | They scan and eat. Forcing signup before the first samosa kills conversion |

---

## 6. Query cheat sheet

```js
// QR scan -> resolve table, join or open a session
const table = await Table.findOne({ qr_token, is_active: true });
let session = await TableSession.findOne({ table: table._id, status: 'open' });
// if none, create — the partial unique index makes a duplicate-key error the
// signal that someone else won the race; catch it and re-read.

// Chef screen: the live queue
Order.find({ status: { $in: ['placed', 'preparing'] } }).sort({ placed_at: 1 });

// Chef taps one item done
Order.updateOne(
    { _id: orderId, 'items._id': itemId },
    { $set: {
        'items.$.status': 'done',
        'items.$.done_at': new Date(),
        'items.$.handled_by': staffId
    } }
);
// then recompute the order's rolled-up status and emit.

// Manager grid: every open table with its running total
TableSession.find({ status: 'open' }).sort({ opened_at: -1 });

// One table's full bill
Order.find({ session: sessionId, status: { $ne: 'cancelled' } }).sort({ placed_at: -1 });
```

---

## 7. Known edge cases and the intended handling

| Case | Handling |
|---|---|
| Party leaves, manager forgets to close; new party scans | Manager closes on payment. Also run a job that auto-closes sessions idle for N hours |
| Diner clears cookies mid-meal | They become a new guest in the same session. Their earlier orders stay on the table's bill, which is what matters |
| Two people scan at the same instant | The partial unique index rejects the second session; catch the duplicate-key error and join the winner |
| Chef screen loses its websocket | On reconnect, re-fetch the queue over REST. Sockets notify; the database is truth |
| Item goes out of stock mid-cart | Re-validate `is_available` at checkout, not at add-to-cart. Reject with which item failed |
