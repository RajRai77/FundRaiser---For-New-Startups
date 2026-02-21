import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

// --- Helper Function ---
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

// --- 1. Register User (Secured for Roles) ---
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if ([fullName, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // 🔒 SECURITY FIX: Prevent Privilege Escalation
    // If someone tries to pass "admin" via the frontend API, we block it.
    if (role === "admin") {
        throw new ApiError(403, "Forbidden: Admin accounts cannot be created via public registration.");
    }

    // Ensure the role is strictly founder or investor (defaults to founder)
    const assignedRole = (role === "investor") ? "investor" : "founder";

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({
        fullName,
        email,
        password,
        role: assignedRole
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, `Successfully registered as ${assignedRole}`)
    );
});

// --- 2. Login User (Role-Aware) ---
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
        httpOnly: true, 
        secure: true,
        sameSite: "strict" // Extra protection against CSRF attacks
    };

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // We send back the user data (which includes user.role). 
    // The React frontend will read 'user.role' and redirect them to the correct dashboard.
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { 
                    user: loggedInUser, 
                    role: loggedInUser.role, // Explicitly surfacing role for frontend ease
                    accessToken, 
                    refreshToken 
                },
                `${loggedInUser.role.charAt(0).toUpperCase() + loggedInUser.role.slice(1)} logged in successfully`
            )
        );
});

// --- 3. Logout User ---
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, 
        { $unset: { refreshToken: 1 } }, 
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, bio } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio) updateData.bio = bio;

    // Handle Cloudinary Avatar Upload
    const avatarLocalPath = req.file?.path; 
    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (avatar && avatar.url) {
            updateData.profileImageUrl = avatar.url;
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
});

export { registerUser, loginUser, logoutUser, updateProfile };