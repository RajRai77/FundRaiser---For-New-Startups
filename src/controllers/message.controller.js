import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { ChatAccess } from "../models/chatAccess.model.js";

// --- 1. Send a Message (With Paywall Check) ---
const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, startupContextId, content } = req.body;

    if (!receiverId || !content) {
        throw new ApiError(400, "Receiver ID and message content are required.");
    }

    // 🛑 THE PAYWALL LOGIC 🛑
    // Agar bhejane wala 'Investor' hai, toh check karo paise diye hain ya nahi
    if (req.user.role === "investor") {
        
        // 1. Check if they have a Premium Subscription
        if (!req.user.isPremium) {
            
            // 2. If not premium, check if they paid the one-time fee for THIS specific founder
            const hasAccess = await ChatAccess.findOne({
                investorId: req.user._id,
                founderId: receiverId
            });

            if (!hasAccess) {
                // Return 402 Payment Required! Frontend will show the "Pay ₹50 to Chat" popup
                throw new ApiError(402, "PAYWALL: You need Premium or a One-Time Unlock to message this founder.");
            }
        }
    }

    // Agar yahan tak code aa gaya, matlab Payment clear hai ya user Founder/Admin hai
    const newMessage = await Message.create({
        senderId: req.user._id,
        receiverId,
        startupContextId,
        content
    });

    return res.status(201).json(
        new ApiResponse(201, newMessage, "Message sent successfully")
    );
});

// --- 2. Get Chat History with a Specific User ---
const getChatHistory = asyncHandler(async (req, res) => {
    const { otherUserId } = req.params;

    // Find all messages where I am sender & they are receiver, OR they are sender & I am receiver
    const messages = await Message.find({
        $or: [
            { senderId: req.user._id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: req.user._id }
        ]
    }).sort({ createdAt: 1 }); // Sort oldest to newest for chat UI

    return res.status(200).json(
        new ApiResponse(200, messages, "Chat history fetched")
    );
});

// --- 3. Mock Unlock Chat Endpoint (For Razorpay Success later) ---
const unlockChatAccess = asyncHandler(async (req, res) => {
    const { founderId, paymentId } = req.body;

    // In a real flow, this runs AFTER Razorpay verification
    await ChatAccess.create({
        investorId: req.user._id,
        founderId: founderId,
        paymentReferenceId: paymentId || "mock_payment_123"
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Chat unlocked successfully! You can now message the founder.")
    );
});

export { sendMessage, getChatHistory, unlockChatAccess };