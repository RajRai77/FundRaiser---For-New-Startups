import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            // Not required because users might sign up with Google Auth
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true // Allows multiple null values if they use email/password
        },
        role: {
            type: String,
            enum: ['founder', 'investor', 'admin'],
            default: 'founder',
            required: true
        },
        profileImageUrl: {
            type: String, // Cloudinary URL
        },
        bio: {
            type: String,
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        refreshToken: {
            type: String
        },
        isPremium: {
            type: Boolean,
            default: false // Har naya user by default free tier par hoga
        },

        
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function () {
    // If password is not modified or doesn't exist (like in Google Auth), just return
    if(!this.isModified("password") || !this.password) return;

    // Otherwise, hash the password
    this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.isPasswordCorrect = async function(password){
    if(!this.password) return false; // If they signed up with Google, no password exists
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)