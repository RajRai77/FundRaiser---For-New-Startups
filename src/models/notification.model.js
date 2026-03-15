import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true // Jisko notification bhejna hai
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['success', 'warning', 'info', 'error'],
        default: 'info'
    },
    link: {
        type: String // Clicking notification should redirect here
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);