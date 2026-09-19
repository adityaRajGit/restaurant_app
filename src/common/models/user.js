import mongoose from 'mongoose';
import { USER_TYPES, CUSTOMER } from '../constants/enum';
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    label: { type: String, trim: true },       // Home, Work, ...
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    is_default: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },

    phone: {
        type: String,
        minlength: 10,
        maxlength: 10,
    },

    password: {
        type: String,
        required: function () {
            return !this.googleId; // Password is required only if no social login ID is present
        },
        trim: true,
    },

    profile_image: {
        type: String
    },

    email_verified: {
        type: Boolean,
        default: false
    },

    addresses: [addressSchema],

    favourite_items: [{
        type: Schema.Types.ObjectId,
        ref: 'MenuItem'
    }],

    type: {
        type: String,
        enum: USER_TYPES,
        default: CUSTOMER,
        index: true
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    googleId: String,
    lastLogin: Date,

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

userSchema.set('versionKey', false);

export default mongoose.model('User', userSchema);
