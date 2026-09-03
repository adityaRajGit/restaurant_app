import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Automatically delete expired documents
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

// Create compound index for efficient queries
otpSchema.index({ email: 1, otp: 1 });

otpSchema.set('versionKey', false);

export default mongoose.model('Otp', otpSchema);