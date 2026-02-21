import mongoose, { Schema } from "mongoose";

const chatAccessSchema = new Schema(
    {
        investorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        founderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        paymentReferenceId: {
            type: String // Razorpay payment ID jab woh pay karega
        }
    },
    { timestamps: true }
);

export const ChatAccess = mongoose.model("ChatAccess", chatAccessSchema);