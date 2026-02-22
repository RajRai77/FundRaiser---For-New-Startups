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
// --- 4. Check Access (Frontend uses this to show Lock/Unlock Screen) ---
const checkChatAccess = asyncHandler(async (req, res) => {
    const { founderId } = req.params;

    // 1. Founders and Admins always have access to reply
    // 2. Premium Investors always have access
    if (req.user.role !== "investor" || req.user.isPremium) {
        return res.status(200).json(new ApiResponse(200, { hasAccess: true }, "Access Granted"));
    }

    // 3. Regular Investors check
    const hasAccess = await ChatAccess.findOne({
        investorId: req.user._id,
        founderId: founderId
    });

    return res.status(200).json(
        new ApiResponse(200, { hasAccess: !!hasAccess }, "Access Status Checked")
    );
});

// --- 5. Get Contacts List (For the Left Sidebar) ---
const getContacts = asyncHandler(async (req, res) => {
    const messages = await Message.find({
        $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
    }).populate("senderId receiverId", "fullName profileImageUrl role");

    const contactsMap = new Map();
    
    messages.forEach(msg => {
        const otherUser = msg.senderId._id.toString() === req.user._id.toString() 
            ? msg.receiverId 
            : msg.senderId;
            
        if (!contactsMap.has(otherUser._id.toString())) {
            contactsMap.set(otherUser._id.toString(), otherUser);
        }
    });

    return res.status(200).json(
        new ApiResponse(200, Array.from(contactsMap.values()), "Contacts fetched")
    );
});

export { sendMessage, getChatHistory, unlockChatAccess, checkChatAccess,getContacts};