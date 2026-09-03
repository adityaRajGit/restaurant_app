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
    // Price in the smallest practical unit the restaurant quotes in (rupees).
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
        default: VEG
    },
    images: {
        type: [String],
        default: []
    },
    // Minutes the kitchen typically needs for this item.
    prep_time_minutes: {
        type: Number,
        min: 0,
        default: 15
    },
    spice_level: {
        type: Number,
        min: 0,
        max: 3,
        default: 0
    },
    tags: {
        type: [String],
        default: []
    },
    // Choices a customer makes at order time (size, add-ons, ...).
    options: [{
        name: { type: String, required: true, trim: true },
        choices: [{
            label: { type: String, required: true, trim: true },
            price_delta: { type: Number, default: 0 }
        }],
        required: { type: Boolean, default: false },
        _id: false
    }],
    is_available: {
        type: Boolean,
        default: true,
        index: true
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    display_order: {
        type: Number,
        default: 0
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

menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

menuItemSchema.set('versionKey', false);

export default mongoose.model('MenuItem', menuItemSchema);
