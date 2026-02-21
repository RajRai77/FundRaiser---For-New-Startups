import Razorpay from "razorpay";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Startup } from "../models/startup.model.js";
import { Investment } from "../models/investment.model.js";

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- STEP 1: Create a Razorpay Order ---
const createInvestmentOrder = asyncHandler(async (req, res) => {
    const { startupId } = req.params;
    const { amount } = req.body; // Amount in Rupees (e.g., 5000)

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Please enter a valid investment amount.");
    }

    // 1. Find the startup and verify it's Live
    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, "Startup not found");
    }
    if (startup.status !== "live") {
        throw new ApiError(400, "This startup is not currently accepting investments.");
    }

    // 2. Calculate dummy equity snapshot
    let equitySnapshot = 0;
    if (startup.valuationCap && startup.valuationCap > 0) {
        equitySnapshot = (amount / startup.valuationCap) * 100;
    }

    // 3. Create a "Pending" investment record in our Database FIRST
    const investment = await Investment.create({
        investorId: req.user._id,
        startupId: startup._id,
        amount: amount,
        equitySnapshot: equitySnapshot,
        status: "pending"
    });

    // 4. Create Order in Razorpay
    const options = {
        amount: amount * 100, // Razorpay strictly takes amounts in smallest unit (paise)
        currency: "INR",
        receipt: `receipt_${investment._id}`, // Links Razorpay to our DB
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
        throw new ApiError(500, "Failed to create Razorpay order");
    }

    // 5. Send Order Details to Frontend
    return res.status(200).json(
        new ApiResponse(200, {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            investmentId: investment._id // Send this so frontend can use it during verification
        }, "Razorpay order created successfully")
    );
});

// --- STEP 2: Verify Payment & Update Database ---
const verifyInvestmentPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, investmentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !investmentId) {
        throw new ApiError(400, "Missing payment verification details");
    }

    // 1. Create the expected signature using your secret key
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    // 2. Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
        // Mark investment as failed if someone tries to forge a payment
        await Investment.findByIdAndUpdate(investmentId, { status: "failed" });
        throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }

    // 3. If authentic, update the Investment record
    const investment = await Investment.findByIdAndUpdate(
        investmentId,
        { 
            status: "completed",
            paymentReferenceId: razorpay_payment_id
        },
        { new: true }
    );

    // 4. Increase the Startup's raised amount!
    await Startup.findByIdAndUpdate(
        investment.startupId,
        { $inc: { raisedAmount: investment.amount } } // MongoDB magic to increment a number
    );

    return res.status(200).json(
        new ApiResponse(200, investment, "Payment verified successfully. Investment completed!")
    );
});

export { createInvestmentOrder, verifyInvestmentPayment };