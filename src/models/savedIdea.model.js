import mongoose, { Schema } from "mongoose";

const savedIdeaSchema = new Schema(
    {
        investorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        startupId: {
            type: Schema.Types.ObjectId,
            ref: "Startup",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const SavedIdea = mongoose.model("SavedIdea", savedIdeaSchema);