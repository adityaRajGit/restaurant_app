# restaurantapp

Backend for a restaurant app — menu catalogue and ordering — built on the same
Express + Mongoose + Babel scaffolding as `social-media-backend`.

## Stack

- **Express 4** with route modules per domain
- **Mongoose 8** with a shared `BaseHelper` CRUD layer
- **Babel** (`@babel/register` in dev, `babel-cli` build to `dist/` for prod)
- **JWT** auth for users and admins
- **Cloudinary** for image uploads, **Nodemailer** for transactional email
- **Swagger UI** at `/api-docs`
- Deployable to Vercel (`vercel.json`) or any Node host

## Getting started

```bash
npm install
cp .env.example .env      # fill in MONGO_URL, JWT_SECRET, ...
npm start                 # nodemon on http://localhost:8080
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm start` | dev server with nodemon + babel-register |
| `npm run build` | transpile `src/` to `dist/` |
| `npm run start:prod` | run the transpiled build |
| `npm test` | jest |
| `npm run swagger` | regenerate `swagger/swagger-output.json` from the routes |
| `node scripts/seed-staff.js` | seed local manager/staff logins for testing |

## Layout

```
restaurant-app.js            entry point (dev: babel-register, prod: dist/)
src/
  server/
    index.js                 express app, middleware, route mounting, db connect
    config.js                env-backed config
    routes/                  one router per domain
  common/
    models/                  mongoose schemas
    helpers/                 BaseHelper instance per model
    lib/<domain>/            business logic handlers
    util/                    auth, validation, response, email helpers
    constants/               enums and response constants
  util/                      cloudinary, passport
scripts/crud/                generators that scaffold a new CRUD domain
scripts/curl/                curl examples per domain
scripts/seed-staff.js        seeds back-office logins for local testing
```

Every domain follows the same four-file pattern: `models/x.js` →
`helpers/x.helper.js` → `lib/x/xHandler.js` → `routes/x.routes.js`. The
generators in `scripts/crud/` produce that set for a new domain.

## API

All routes are under `/api/v1`. Responses are `{ status, data }`, where `status`
is `"Success"` or `"Error"`.

### Auth — `/api/v1/auth`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/signup` | — | register with name, phone, email, password |
| POST | `/login` | — | email or phone + password |
| GET | `/me` | user | current user from token |
| POST | `/google-auth` | — | sign up or log in with a Google ID token |
| POST | `/google-auth-signin` | — | log in an existing Google account |
| POST | `/forgot-password` | — | email a reset OTP |
| POST | `/reset-password` | — | email + otp + newPassword |
| POST | `/change-password` | user | oldPassword + newPassword |
| POST | `/contact-support` | — | send a support email |

### User — `/api/v1/user`

`GET /profile`, `POST /profile/update` (multipart `profile_image`),
`POST /verify-email/request`, `POST /verify-email`, `POST /address`,
`POST /address/:addressId/remove`, `POST /favourite/:menuItemId`.
Admin-only: `POST /list`, `POST /new`, `GET /:id`, `POST /:id/remove`.

### Menu — `/api/v1/menu`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/list` | — | paginated, filterable item list |
| GET | `/grouped` | — | available items grouped by category (the customer menu) |
| GET | `/:id` | — | one item |
| POST | `/new` | admin | create (multipart, up to 5 `images`) |
| POST | `/:id/update` | admin | update |
| POST | `/:id/availability` | admin | flip `is_available` (86 an item) |
| POST | `/:id/remove` | admin | delete |

### Order — `/api/v1/order`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/new` | user | place an order |
| POST | `/my` | user | the caller's orders |
| GET | `/:id` | token | one order |
| POST | `/:id/cancel` | user | cancel with a reason |
| POST | `/list` | admin | all orders |
| POST | `/:id/status` | admin | advance the order status |
| POST | `/:id/payment` | admin | set payment status |
| POST | `/:id/remove` | admin | soft delete |

Place an order with menu item ids and quantities only — **the server prices the
order from the menu**, so the client cannot dictate a total:

```json
{
  "order_type": "delivery",
  "items": [
    { "menu_item": "<menuItemId>", "quantity": 2,
      "selected_options": [{ "name": "Size", "label": "Large" }] }
  ],
  "delivery_address": { "line1": "12 Park St", "city": "Kolkata", "pincode": "700016" }
}
```

Order status moves along a fixed flow (`ORDER_STATUS_FLOW` in
`src/common/constants/enum.js`):

```
placed → confirmed → preparing → ready → out_for_delivery → delivered
   ↓         ↓           ↓
          cancelled
```

Any transition outside that map is rejected, and every change is appended to
the order's `status_history`.

### Bill — `/api/v1/bill`

Counter billing for walk-ins. Unlike an order, a **manual bill is priced from
the payload** — staff type in the line items, so they can charge for something
that is not on the menu. There is no `menu_item` reference and no customer
account; the bill records only a name.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/manual` | manager/staff | create a manual bill |
| GET | `/:id` | manager/staff | one bill |

```json
{
  "customer_name": "Aditya",
  "discount": 0,
  "items": [
    { "name": "Paneer Butter Masala",  "price": 320, "quantity": 2 },
    { "name": "Extra naan (off-menu)", "price": 40,  "quantity": 3 }
  ]
}
```

Because the prices come from the client, the handler validates hard before
anything reaches the database: `customer_name` must be non-empty, there must be
at least one item, every `price` must be finite and `>= 0`, and every
`quantity` must be a whole number `>= 1`. Totals are `subtotal + tax - discount`,
floored at zero, with the tax rate read from `appConfig.tax_rate` — the same
value orders use, so the two cannot drift.

Curl examples: `scripts/curl/bill/bill.txt`.

### Admin — `/api/v1/admin`

Admin signup/login and management, carried over from the base project. Admin
JWTs are what `protectRoutes.verifyAdmin` checks; roles are `superadmin`,
`Admin`, and `manager`.

Back-office access comes in two flavours. `Admin` documents carry a `role` and
are checked by `protectRoutes.verifyAdmin`. Separately, a `User` document
carries a **`type`** — `customer` (the default), `manager`, or `staff` — checked
by `protectRoutes.verifyUserType(...types)`, which gates the bill routes. The
type is read from the database on every request rather than trusted from the
JWT, so changing someone's type takes effect immediately.

## Notes

- OTPs live in their own collection with a TTL index, so Mongo expires them.
- Order line items snapshot the item name and price at order time, so editing
  the menu later never rewrites the history of an order already placed.
- `JWT_SECRET`, mail, and Cloudinary credentials all come from the environment;
  nothing is hardcoded.
- Manual bills are a separate collection from orders. Hosting them in `Order`
  would have meant relaxing both `user.required` and `items.menu_item.required`,
  weakening the invariants of the order history to store a different concept.
- The CRUD generators in `scripts/crud/` are documented in
  [`docs/code-generators.md`](docs/code-generators.md).