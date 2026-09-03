
import mongoose from 'mongoose';
import { SUPERADMIN, ADMIN, MANAGER } from '../constants/enum';
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [SUPERADMIN, ADMIN, MANAGER],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
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

adminSchema.set('versionKey', false);

export default mongoose.model('Admin', adminSchema);
