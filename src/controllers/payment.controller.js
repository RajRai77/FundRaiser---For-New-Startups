import Razorpay from "razorpay";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Startup } from "../models/startup.model.js";
import { Investment } from "../models/investment.model.js"; // 👈 Import new model

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create Order (Same as before)
export const createOrder = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    if (!amount) throw new ApiError(400, "Amount is required");

    const options = {
        amount: Number(amount) * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json(new ApiResponse(200, order, "Order created successfully"));
});

// 2. Verify Payment (UPDATED: Now saves investment history!)
export const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, startupId, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }

    // 1. Update Startup Raised Amount
    const startup = await Startup.findById(startupId);
    if (!startup) throw new ApiError(404, "Startup not found");

    startup.raisedAmount = (startup.raisedAmount || 0) + Number(amount);
    if (startup.raisedAmount >= startup.fundingGoal) {
        startup.status = "funded";
    }
    await startup.save();

    // 2. 🔥 Create Investment Record for the Investor
    const investment = await Investment.create({
        investorId: req.user._id, // Got from verifyJWT
        startupId: startup._id,
        amount: Number(amount),
        razorpayPaymentId: razorpay_payment_id
    });

    return res.status(200).json(
        new ApiResponse(200, investment, "Payment verified and investment recorded!")
    );
});

// 3. Fetch Investor's Portfolio (UPDATED with Founder Details & Metrics)
export const getMyPortfolio = asyncHandler(async (req, res) => {
    const investments = await Investment.find({ investorId: req.user._id })
        .populate({
            path: "startupId",
            select: "companyName logoUrl category tagline fundingGoal equityOfferedPercentage founderId",
            populate: { 
                path: "founderId", 
                select: "fullName email profileImageUrl" // Founder ka email aur naam portfolio tak bhej rahe hain
            }
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, investments, "Portfolio fetched successfully")
    );
});