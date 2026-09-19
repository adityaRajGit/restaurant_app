import billHelper from '../../helpers/bill.helper';
import appConfig from '../../constants/appConfig.json';

function generateBillNumber() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
    return `BILL-${stamp}${rand}`;
}

function round2(value) {
    return Math.round(value * 100) / 100;
}

/**
 * A manual bill is priced from the payload, not the menu — staff ring up
 * off-menu items at the counter. That makes the request body a trust
 * boundary, so every number is checked here before it reaches the DB.
 */
function validateBillItems(requestedItems) {
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
        throw "bill must contain at least one item";
    }

    return requestedItems.map((requested, index) => {
        const name = typeof requested.name === 'string' ? requested.name.trim() : '';
        if (!name) {
            throw `item ${index + 1} is missing a name`;
        }

        const price = Number(requested.price);
        if (!Number.isFinite(price) || price < 0) {
            throw `invalid price for ${name}`;
        }

        const quantity = requested.quantity === undefined ? 1 : Number(requested.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw `invalid quantity for ${name}`;
        }

        return { name, price: round2(price), quantity };
    });
}

function priceBill(items, discount = 0) {
    const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const tax = round2(subtotal * appConfig.tax_rate);
    const total = round2(Math.max(subtotal + tax - discount, 0));

    return { subtotal, tax, discount: round2(discount), total };
}

export async function createManualBillHandler(input) {
    const customerName = typeof input.customer_name === 'string' ? input.customer_name.trim() : '';
    if (!customerName) {
        throw "customer_name is required";
    }

    const discount = input.discount === undefined ? 0 : Number(input.discount);
    if (!Number.isFinite(discount) || discount < 0) {
        throw "invalid discount";
    }

    const items = validateBillItems(input.items);

    return await billHelper.addObject({
        bill_number: generateBillNumber(),
        customer_name: customerName,
        items,
        created_by: input.created_by,
        ...priceBill(items, discount),
    });
}

export async function getBillDetailsHandler(input) {
    return await billHelper.getObjectById(input);
}
