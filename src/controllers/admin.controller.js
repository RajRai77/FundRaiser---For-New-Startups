import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Startup } from "../models/startup.model.js";

// --- 1. Get All Pending Pitches ---
const getPendingPitches = asyncHandler(async (req, res) => {
    // Admin wants to see all pitches that are waiting for approval
    const pendingPitches = await Startup.find({ status: "pending_approval" })
        .populate("founderId", "fullName email") // Get founder's name and email too
        .sort({ createdAt: 1 });

    return res.status(200).json(
        new ApiResponse(200, pendingPitches, "Pending pitches fetched successfully")
    );
});

// --- 2. Approve or Reject a Pitch ---
const reviewPitch = asyncHandler(async (req, res) => {
    const { startupId } = req.params;
    const { action, adminFeedback } = req.body; // action can be "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
        throw new ApiError(400, "Invalid action. Use 'approve' or 'reject'.");
    }

    const startup = await Startup.findById(startupId);

    if (!startup) {
        throw new ApiError(404, "Startup not found");
    }

    if (startup.status !== "pending_approval") {
        throw new ApiError(400, `This pitch is currently '${startup.status}' and cannot be reviewed.`);
    }

    if (action === "approve") {
        startup.status = "live";
        startup.isVerified = true; // Give them the green verified badge
        
        // Optional: Set a 30-day campaign timer starting from today
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        startup.campaignEndDate = endDate;

        startup.adminFeedback = "Approved and live on feed.";
    } 
    
    if (action === "reject") {
        if (!adminFeedback) {
            throw new ApiError(400, "You must provide adminFeedback when rejecting a pitch.");
        }
        startup.status = "rejected";
        startup.adminFeedback = adminFeedback; // E.g., "Pitch deck is missing financials"
    }

    await startup.save();

    return res.status(200).json(
        new ApiResponse(200, startup, `Pitch successfully ${action}d.`)
    );
});

export { getPendingPitches, reviewPitch };