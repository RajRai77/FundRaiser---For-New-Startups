import mongoose, { Schema } from "mongoose";

const startupSchema = new Schema(
    {
        founderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // --- Step 1: Basics ---
        companyName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        tagline: {
            type: String,
            maxLength: 140,
            trim: true
        },
        logoUrl: {
            type: String, // Cloudinary URL
        },
        websiteUrl: {
            type: String,
            trim: true
        },
        location: {
            type: String,
            trim: true
        },
        foundedYear: {
            type: Number
        },

        // --- Step 2: Pitch Details (Updated to perfectly match Frontend) ---
        description: {
            type: String,
            trim: true
        },
        problemStatement: {
            type: String,
            trim: true
        },
        solution: { // 🔥 Fixed from solutionStatement
            type: String,
            trim: true
        },
        marketTraction: { // 🔥 Added
            type: String,
            trim: true
        },

        // --- Step 3: Financials ---
        fundingGoal: {
            type: Number,
            required: true,
            default: 0
        },
        minTicketSize: {
            type: Number,
            default: 0
        },
        equityOfferedPercentage: {
            type: Number,
            required: true,
            default: 0
        },
        raisedAmount: {
            type: Number,
            default: 0
        },
        valuationCap: {
            type: Number 
        },

        // --- Step 4: Market & Strategy ---
        targetMarket: {
            type: String,
            trim: true
        },
        marketScope: {
            type: String,
            enum: ['local', 'national', 'global'],
            default: 'national'
        },
        goToMarketStrategy: {
            type: String,
            trim: true
        },

        // --- Assets, Tags & Meta ---
        pitchDeckUrl: {
            type: String, // Cloudinary URL for PDF
        },
        pitchVideoUrl: { // 🔥 Fixed from demoVideoUrl
            type: String, 
        },
        category: {
            type: String,
            index: true
        },
        tags: [
            {
                type: String,
                trim: true
            }
        ],

        // --- Dashboard Stats & Admin ---
        status: {
            type: String,
            enum: ['draft', 'pending_approval', 'live', 'funded', 'rejected'],
            default: 'draft',
            index: true
        },
        viewsCount: {
            type: Number,
            default: 0
        },
        adminFeedback: {
            type: String, // Reason for rejection
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        isVerified: {
            type: Boolean,
            default: false 
        },
        campaignEndDate: {
            type: Date 
        }
    },
    {
        timestamps: true
    }
);

export const Startup = mongoose.model("Startup", startupSchema);