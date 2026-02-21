import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Startup } from "../models/startup.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// --- 1. Create Pitch (Step 1: Basics) ---
const createPitchBasics = asyncHandler(async (req, res) => {
    // 1. Get data from the frontend form
    const { companyName, tagline, websiteUrl, location, foundedYear } = req.body;

    if (!companyName) {
        throw new ApiError(400, "Company Name is required to start a pitch.");
    }

    // 2. Handle the Logo Upload (Using your Cloudinary utility)
    let logoUrl = "";
    const logoLocalPath = req.file?.path; // Multer will provide this

    if (logoLocalPath) {
        const uploadedLogo = await uploadOnCloudinary(logoLocalPath);
        if (!uploadedLogo) {
            throw new ApiError(500, "Error uploading logo to Cloudinary");
        }
        logoUrl = uploadedLogo.url;
    }

    // 3. Create the Draft in the Database
    // We automatically link the founderId to the user making the request
    const startup = await Startup.create({
        founderId: req.user._id,
        companyName,
        tagline,
        websiteUrl,
        location,
        foundedYear,
        logoUrl,
        status: "draft" // It stays a draft until they finish all 5 steps
    });

    // 4. Send success response
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
    // URL se startupId nikalenge
    const { startupId } = req.params;

    // 1. Find the startup and ensure the logged-in user owns it
    const startup = await Startup.findOne({ _id: startupId, founderId: req.user._id });
    
    if (!startup) {
        throw new ApiError(404, "Startup pitch not found or you are not authorized to edit it");
    }

    // 2. Extract all possible fields for steps 2, 3, and 4
    const {
        problemStatement,
        solutionStatement,
        fundingGoal,
        minTicketSize,
        equityOfferedPercentage,
        targetMarket,
        marketScope,
        goToMarketStrategy,
        demoVideoUrl,
        category,
        tags
    } = req.body;

    // 3. Handle Pitch Deck (PDF) Upload if provided
    let pitchDeckUrl = startup.pitchDeckUrl; // Keep existing by default
    const pitchDeckLocalPath = req.files?.pitchDeck?.[0]?.path; // Multer syntax for fields

    if (pitchDeckLocalPath) {
        const uploadedDeck = await uploadOnCloudinary(pitchDeckLocalPath);
        if (uploadedDeck) {
            pitchDeckUrl = uploadedDeck.url;
        }
    }

    // 4. Update the fields ONLY if the user sent them
    if (problemStatement) startup.problemStatement = problemStatement;
    if (solutionStatement) startup.solutionStatement = solutionStatement;
    if (fundingGoal) startup.fundingGoal = Number(fundingGoal);
    if (minTicketSize) startup.minTicketSize = Number(minTicketSize);
    if (equityOfferedPercentage) startup.equityOfferedPercentage = Number(equityOfferedPercentage);
    if (targetMarket) startup.targetMarket = targetMarket;
    if (marketScope) startup.marketScope = marketScope;
    if (goToMarketStrategy) startup.goToMarketStrategy = goToMarketStrategy;
    if (demoVideoUrl) startup.demoVideoUrl = demoVideoUrl;
    if (category) startup.category = category;
    if (tags) startup.tags = tags; 
    
    startup.pitchDeckUrl = pitchDeckUrl;

    // 5. Automatic Valuation Calculator (If financials are provided)
    if (startup.fundingGoal && startup.equityOfferedPercentage) {
        startup.valuationCap = (startup.fundingGoal / (startup.equityOfferedPercentage / 100));
    }

    // Save changes to Database
    await startup.save();

    return res.status(200).json(
        new ApiResponse(200, startup, "Pitch draft updated successfully!")
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


export { 
    createPitchBasics, 
    getMyPitches, 
    updatePitch, 
    submitPitch, 
    getLiveStartups,   
    getStartupById     
};
