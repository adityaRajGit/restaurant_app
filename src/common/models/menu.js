import mongoose from 'mongoose';
import { MENU_CATEGORIES, FOOD_TYPES, VEG } from '../constants/enum';
const Schema = mongoose.Schema;

const menuItemSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Rupees, e.g. 649.99 = Rs 649.99.
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        enum: MENU_CATEGORIES,
        required: true,
        index: true
    },
    food_type: {
        type: String,
        enum: FOOD_TYPES,
        required: true,
        default: VEG
    },
    image_url: {
        type: String,
        trim: true
    },
    // Drives the expected-ready time on the chef screen.
    prep_minutes: {
        type: Number,
        min: 0,
        default: 10
    },
    // Flipped off when the kitchen runs out.
    is_available: {
        type: Boolean,
        required: true,
        default: true
    },
    display_order: {
        type: Number,
        default: 0
    },
    is_deleted: {
        type: Boolean,
        required: true,
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

// Serves the customer menu read: live items, grouped by category, in display order.
menuItemSchema.index(
    { is_deleted: 1, is_available: 1, category: 1, display_order: 1 },
    { name: 'customer_menu' }
);

menuItemSchema.index({ name: 'text', description: 'text' });

menuItemSchema.set('versionKey', false);

export default mongoose.model('MenuItem', menuItemSchema);
