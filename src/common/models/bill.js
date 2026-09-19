import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// A manually rung-up line. Unlike an order item there is no menu_item ref:
// the whole point of a manual bill is that staff can charge for something
// that is not on the menu, so name and price are typed in at the counter.
const billItemSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, { _id: false });

const billSchema = new Schema({
    bill_number: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    customer_name: {
        type: String,
        required: true,
        trim: true
    },
    items: {
        type: [billItemSchema],
        validate: [(v) => Array.isArray(v) && v.length > 0, 'bill must have at least one item']
    },
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
    // Which staff member rang it up, for end-of-shift reconciliation.
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
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

billSchema.set('versionKey', false);

export default mongoose.model('Bill', billSchema);
