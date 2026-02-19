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

        // --- Step 2: Problem & Solution ---
        problemStatement: {
            type: String,
            trim: true
        },
        solutionStatement: {
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
            required: true,
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
            type: Number // Can be calculated in frontend or pre-save hook
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
        demoVideoUrl: {
            type: String, // YouTube/Vimeo Link
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
            default: false // Triggers the green VERIFIED badge
        },
        campaignEndDate: {
            type: Date // For the "24 Days Left" UI
        }
    },
    {
        timestamps: true
    }
);

export const Startup = mongoose.model("Startup", startupSchema);