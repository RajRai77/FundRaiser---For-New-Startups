import mongoose, { Schema } from "mongoose";

const investmentSchema = new Schema(
    {
        investorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        startupId: {
            type: Schema.Types.ObjectId,
            ref: "Startup",
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        equitySnapshot: {
            type: Number, // Captures the exact equity % they bought at that time
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentReferenceId: {
            type: String, // To store Stripe or Razorpay transaction IDs later
        }
    },
    {
        timestamps: true
    }
);

export const Investment = mongoose.model("Investment", investmentSchema);