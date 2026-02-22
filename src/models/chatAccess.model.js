import mongoose, { Schema } from "mongoose";

const chatAccessSchema = new Schema(
    {
        investorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true // Fast searching
        },
        founderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        paymentReferenceId: {
            type: String, // Razorpay Payment ID save karne ke liye
            required: true
        },
        amountPaid: {
            type: Number,
            default: 50 // Standard minimal fee (e.g., ₹50)
        }
    },
    { timestamps: true }
);

export const ChatAccess = mongoose.model("ChatAccess", chatAccessSchema);