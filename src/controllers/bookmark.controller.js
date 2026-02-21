import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SavedIdea } from "../models/savedIdea.model.js";
import { Startup } from "../models/startup.model.js";

// --- 1. Toggle Save/Unsave a Startup ---
const toggleSaveIdea = asyncHandler(async (req, res) => {
    const { startupId } = req.params;

    // Verify the startup actually exists
    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, "Startup not found");
    }

    // Check if the investor has already saved this idea
    const existingBookmark = await SavedIdea.findOne({
        investorId: req.user._id,
        startupId: startupId
    });

    if (existingBookmark) {
        // If it exists, it means they are "un-hearting" it. Delete it.
        await SavedIdea.findByIdAndDelete(existingBookmark._id);
        
        return res.status(200).json(
            new ApiResponse(200, { saved: false }, "Startup removed from saved ideas")
        );
    } else {
        // If it doesn't exist, they are "hearting" it. Create it.
        await SavedIdea.create({
            investorId: req.user._id,
            startupId: startupId
        });

        return res.status(200).json(
            new ApiResponse(200, { saved: true }, "Startup saved successfully")
        );
    }
});

// --- 2. Get All Saved Ideas (For Investor's "My Portfolio / Saved" Tab) ---
const getMySavedIdeas = asyncHandler(async (req, res) => {
    // Find all bookmarks for this user, and populate the startup details
    const savedIdeas = await SavedIdea.find({ investorId: req.user._id })
        .populate({
            path: "startupId",
            select: "companyName tagline logoUrl fundingGoal raisedAmount tags status" // Only fetch what we need for the card UI
        })
        .sort({ createdAt: -1 });

    // Format the response to just send back an array of startups
    const formattedStartups = savedIdeas.map(bookmark => bookmark.startupId);

    return res.status(200).json(
        new ApiResponse(200, formattedStartups, "Saved ideas fetched successfully")
    );
});

export { toggleSaveIdea, getMySavedIdeas };