import mongoose from 'mongoose';
import {
    ORDER_STATUSES,
    ORDER_TYPES,
    PAYMENT_STATUSES,
    PLACED,
    DELIVERY,
    PAYMENT_PENDING
} from '../constants/enum';
const Schema = mongoose.Schema;

// Line items snapshot name/price at order time so later menu edits never
// rewrite the history of an order that was already placed.
const orderItemSchema = new Schema({
    menu_item: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    selected_options: [{
        name: String,
        label: String,
        price_delta: { type: Number, default: 0 },
        _id: false
    }],
    notes: {
        type: String,
        trim: true
    }
}, { _id: false });

const orderSchema = new Schema({
    order_number: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: {
        type: [orderItemSchema],
        validate: [(v) => Array.isArray(v) && v.length > 0, 'order must have at least one item']
    },
    order_type: {
        type: String,
        enum: ORDER_TYPES,
        default: DELIVERY
    },
    status: {
        type: String,
        enum: ORDER_STATUSES,
        default: PLACED,
        index: true
    },
    // Append-only audit of every status change.
    status_history: [{
        status: { type: String, enum: ORDER_STATUSES },
        changed_at: { type: Date, default: Date.now },
        changed_by: { type: Schema.Types.ObjectId },
        _id: false
    }],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    delivery_fee: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    payment_status: {
        type: String,
        enum: PAYMENT_STATUSES,
        default: PAYMENT_PENDING
    },
    payment_reference: {
        type: String,
        trim: true
    },
    delivery_address: {
        label: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String
    },
    table_number: {
        type: String,
        trim: true
    },
    customer_notes: {
        type: String,
        trim: true
    },
    cancellation_reason: {
        type: String,
        trim: true
    },
    placed_at: {
        type: Date,
        default: Date.now
    },
    completed_at: {
        type: Date
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

orderSchema.set('versionKey', false);

export default mongoose.model('Order', orderSchema);
