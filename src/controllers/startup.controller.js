import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Startup } from "../models/startup.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Investment } from "../models/investment.model.js";

// --- 1. Create Pitch (Step 1: Basics) ---
const createPitchBasics = asyncHandler(async (req, res) => {
    // 1. Get exact data that Frontend CreatePitch form is sending
    const { companyName, tagline, category, fundingGoal, equityOffered } = req.body;

    if (!companyName) {
        throw new ApiError(400, "Company Name is required to start a pitch.");
    }

    // 2. Handle the Logo Upload
    let logoUrl = "";
    const logoLocalPath = req.file?.path; 

    if (logoLocalPath) {
        const uploadedLogo = await uploadOnCloudinary(logoLocalPath);
        if (!uploadedLogo) {
            throw new ApiError(500, "Error uploading logo to Cloudinary");
        }
        logoUrl = uploadedLogo.url;
    }

    // 3. Create the Draft in the Database
    const startup = await Startup.create({
        founderId: req.user._id,
        companyName,
        tagline,
        category, // Saved from frontend
        fundingGoal: Number(fundingGoal), // Saved from frontend
        equityOfferedPercentage: Number(equityOffered), // DB requires 'equityOfferedPercentage'
        logoUrl,
        status: "draft"
    });

    return res.status(201).json(
        new ApiResponse(201, startup, "Step 1 completed: Draft pitch created successfully.")
    );
});

// --- 2. Get Founder's Own Pitches (For their Dashboard) ---
const getMyPitches = asyncHandler(async (req, res) => {
    // Find all startups where the founderId matches the logged-in user
    const pitches = await Startup.find({ founderId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, pitches, "Fetched your pitches successfully")
    );
});


// --- 3. Update Pitch (Steps 2, 3, & 4) ---
const updatePitch = asyncHandler(async (req, res) => {
    const { startupId } = req.params;
    
    // 1. Extract ALL fields coming from frontend FormData
    const { description, problemStatement, solution, marketTraction, pitchVideoUrl } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, "Pitch not found");
    }

    // 2. Security Check: Only the founder who created it can edit it
    if (startup.founderId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this pitch");
    }

    // 3. Update the text fields in the database
    if (description) startup.description = description;
    if (problemStatement) startup.problemStatement = problemStatement;
    if (solution) startup.solution = solution;
    if (marketTraction) startup.marketTraction = marketTraction;
    if (pitchVideoUrl) startup.pitchVideoUrl = pitchVideoUrl;

    // 4. Handle Pitch Deck PDF upload (if a new one is provided)
    const pitchDeckLocalPath = req.files?.pitchDeck?.[0]?.path;
    if (pitchDeckLocalPath) {
        // Upload to Cloudinary
        const pitchDeck = await uploadOnCloudinary(pitchDeckLocalPath);
        if (pitchDeck && pitchDeck.url) {
            startup.pitchDeckUrl = pitchDeck.url;
        }
    }

    // 5. Save everything to the database
    await startup.save();

    return res.status(200).json(
        new ApiResponse(200, startup, "Pitch draft saved successfully")
    );
});

// --- 4. Submit Pitch for Review (Step 5) ---
const submitPitch = asyncHandler(async (req, res) => {
    const { startupId } = req.params;

    const startup = await Startup.findOne({ _id: startupId, founderId: req.user._id });
    
    if (!startup) {
        throw new ApiError(404, "Startup pitch not found");
    }

    if (startup.status !== "draft") {
        throw new ApiError(400, `This pitch is already marked as ${startup.status}`);
    }

    // Security & Quality Check: Ensure essential fields aren't empty before submitting
    if (!startup.problemStatement || !startup.fundingGoal || !startup.equityOfferedPercentage) {
        throw new ApiError(400, "Please complete the Problem Statement and Financials before submitting.");
    }

    // Change status so Admin can see it
    startup.status = "pending_approval";
    await startup.save();

    return res.status(200).json(
        new ApiResponse(200, startup, "Pitch submitted successfully! It is now under Admin review.")
    );
});


// --- 5. Get All Live Startups (For the Discover Feed) ---
const getLiveStartups = asyncHandler(async (req, res) => {
    // Get optional search or filter queries from the URL
    // e.g., /api/v1/startups/feed/live?category=Fintech&searchTerm=AI
    const { category, searchTerm } = req.query;
    
    // Base query: We ONLY want investors to see "live" pitches
    let query = { status: "live" };

    // Filter by category if the investor selected one in the dropdown
    if (category) {
        query.category = category;
    }

    // Search by company name or tags if they typed in the search bar
    if (searchTerm) {
        query.$or = [
            { companyName: { $regex: searchTerm, $options: "i" } },
            { tags: { $regex: searchTerm, $options: "i" } }
        ];
    }

    // Fetch from DB, and 'populate' to get the founder's actual name instead of just an ID
    const startups = await Startup.find(query)
        .populate("founderId", "fullName profileImageUrl")
        .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json(
        new ApiResponse(200, startups, "Live startups fetched successfully")
    );
});

// --- 6. Get Single Startup Details (When clicking "View Details") ---
const getStartupById = asyncHandler(async (req, res) => {
    const { startupId } = req.params;

    const startup = await Startup.findById(startupId)
        .populate("founderId", "fullName bio profileImageUrl");

    if (!startup) {
        throw new ApiError(404, "Startup not found");
    }

    // 🔥 Magic Trick: Every time someone fetches this detail page, increase the views count!
    startup.viewsCount += 1;
    await startup.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, startup, "Startup details fetched successfully")
    );
});

// --- 7. Get Startup Investors/Analytics (For Founder Dashboard) ---
const getStartupInvestors = asyncHandler(async (req, res) => {
    const { startupId } = req.params;

    // Verify that the person asking is actually the founder of this startup
    const startup = await Startup.findOne({ _id: startupId, founderId: req.user._id });
    if (!startup) {
        throw new ApiError(403, "You do not have permission to view these analytics.");
    }

    // Fetch all investments for this startup and populate the investor details
    const investments = await Investment.find({ startupId })
        .populate("investorId", "fullName email profileImageUrl")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, { startup, investments }, "Investors fetched successfully")
    );
});


export { 
    createPitchBasics, 
    getMyPitches, 
    updatePitch, 
    submitPitch, 
    getLiveStartups,   
    getStartupById,
    getStartupInvestors
};
