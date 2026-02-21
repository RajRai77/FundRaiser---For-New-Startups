import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // 1. Get token from cookies OR authorization header (for mobile apps/Postman)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request. No token found.");
        }

        // 2. Verify the token using our secret key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 3. Find the user in the database
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // 4. Attach the user to the request object so the next function can use it
        req.user = user;
        
        // 5. Move to the next function (the controller)
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
    
});

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user is set by the verifyJWT middleware
        // If the user's role is NOT in the allowed roles array, reject the request
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, `Forbidden: ${req.user.role}s are not allowed to access this route.`);
        }
        
        // If they have the correct role, let them proceed
        next();
    };
};