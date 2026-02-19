import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiverId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        startupContextId: {
            type: Schema.Types.ObjectId,
            ref: "Startup", // Which startup are they discussing?
        },
        content: {
            type: String,
            required: true,
            trim: true
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

export const Message = mongoose.model("Message", messageSchema);