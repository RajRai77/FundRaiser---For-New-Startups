import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";

// --- 1. Get all notifications for the logged-in user ---
const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 }); // Newest first

    return res.status(200).json(
        new ApiResponse(200, notifications, "Notifications fetched successfully")
    );
});

// --- 2. Mark a notification as read ---
const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: req.user._id },
        { isRead: true },
        { returnDocument: 'after' }
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read")
    );
});

export { getMyNotifications, markAsRead };