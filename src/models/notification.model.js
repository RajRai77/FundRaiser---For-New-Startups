import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
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
            enum: ['system', 'investment', 'message', 'security'],
            default: 'system'
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export const Notification = mongoose.model("Notification", notificationSchema);