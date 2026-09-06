import orderHelper from '../../helpers/order.helper';
import menuHelper from '../../helpers/menu.helper';
import userHelper from '../../helpers/user.helper';
import {
    ORDER_STATUS_FLOW,
    CANCELLED,
    DELIVERED,
    DELIVERY,
    PLACED,
} from '../../constants/enum';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../../util/utilHelper';

const TAX_RATE = 0.05;
const DELIVERY_FEE = 40;

function generateOrderNumber() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
    return `ORD-${stamp}${rand}`;
}

function round2(value) {
    return Math.round(value * 100) / 100;
}

/**
 * Prices the order from the menu, never from the client. The request only
 * says which item and how many; every rupee is looked up server-side.
 */
async function buildOrderItems(requestedItems) {
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
        throw "order must contain at least one item";
    }

    const items = [];

    for (const requested of requestedItems) {
        const menuItem = await menuHelper.getObjectById({ id: requested.menu_item });

        if (!menuItem || menuItem.is_deleted) {
            throw `menu item not found: ${requested.menu_item}`;
        }
        if (!menuItem.is_available) {
            throw `${menuItem.name} is currently unavailable`;
        }

        const quantity = Number(requested.quantity) || 1;
        if (quantity < 1) {
            throw `invalid quantity for ${menuItem.name}`;
        }

        items.push({
            menu_item: menuItem._id,
            name: menuItem.name,
            price: round2(menuItem.price),
            quantity,
            selected_options: [],
            notes: requested.notes,
        });
    }

    return items;
}

function priceOrder(items, orderType, discount = 0) {
    const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const delivery_fee = orderType === DELIVERY ? DELIVERY_FEE : 0;
    const tax = round2(subtotal * TAX_RATE);
    const total = round2(Math.max(subtotal + tax + delivery_fee - discount, 0));

    return { subtotal, tax, delivery_fee, discount, total };
}

export async function placeOrderHandler(input) {
    const items = await buildOrderItems(input.items);
    const totals = priceOrder(items, input.order_type, Number(input.discount) || 0);

    const order = await orderHelper.addObject({
        order_number: generateOrderNumber(),
        user: input.user,
        items,
        order_type: input.order_type,
        delivery_address: input.delivery_address,
        table_number: input.table_number,
        customer_notes: input.customer_notes,
        status: PLACED,
        status_history: [{ status: PLACED, changed_at: new Date(), changed_by: input.user }],
        ...totals,
    });

    const user = await userHelper.getObjectById({ id: input.user });
    if (user && user.email) {
        await sendOrderConfirmationEmail(user.email, {
            userName: user.name,
            orderNumber: order.order_number,
            items,
            total: order.total,
        });
    }

    return order;
}

export async function getOrderDetailsHandler(input) {
    return await orderHelper.getObjectById({
        ...input,
        populatedQuery: [{ path: "user", select: "name email phone" }],
    });
}

export async function getOrderListHandler(input) {
    const list = await orderHelper.getAllObjects(input);
    const count = await orderHelper.getAllObjectCount(input);
    return { list, count };
}

export async function getUserOrderListHandler(userId, filters = {}) {
    return await getOrderListHandler({
        ...filters,
        query: { ...(filters.query || {}), user: userId, is_deleted: false },
    });
}

/**
 * Moves an order along its lifecycle, rejecting transitions the flow in
 * constants/enum does not allow (so an order cannot go back to "placed"
 * after being delivered, or skip straight from "placed" to "delivered").
 */
export async function updateOrderStatusHandler(input) {
    const order = await orderHelper.getObjectById({ id: input.objectId });

    if (!order) {
        throw "order not found";
    }

    const allowed = ORDER_STATUS_FLOW[order.status] || [];
    if (!allowed.includes(input.status)) {
        throw `cannot move order from ${order.status} to ${input.status}`;
    }

    const updateObject = {
        status: input.status,
        updated_at: new Date(),
        $push: {
            status_history: {
                status: input.status,
                changed_at: new Date(),
                changed_by: input.changedBy,
            },
        },
    };

    if (input.status === DELIVERED) {
        updateObject.completed_at = new Date();
    }
    if (input.status === CANCELLED) {
        updateObject.cancellation_reason = input.reason || "";
        updateObject.completed_at = new Date();
    }

    await orderHelper.directUpdateObject(input.objectId, updateObject);

    const user = await userHelper.getObjectById({ id: order.user });
    if (user && user.email) {
        await sendOrderStatusEmail(user.email, {
            userName: user.name,
            orderNumber: order.order_number,
            status: input.status,
        });
    }

    return await orderHelper.getObjectById({ id: input.objectId });
}

export async function cancelOrderHandler(input) {
    return await updateOrderStatusHandler({
        objectId: input.objectId,
        status: CANCELLED,
        reason: input.reason,
        changedBy: input.changedBy,
    });
}

export async function updatePaymentStatusHandler(objectId, paymentStatus, paymentReference) {
    return await orderHelper.directUpdateObject(objectId, {
        payment_status: paymentStatus,
        payment_reference: paymentReference,
        updated_at: new Date(),
    });
}

export async function deleteOrderHandler(input) {
    return await orderHelper.directUpdateObject(input, {
        is_deleted: true,
        updated_at: new Date(),
    });
}
