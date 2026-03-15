import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";

// 1. Get all notifications for the logged-in user
export const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20); // Get latest 20

    // Count unread
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    return res.status(200).json(
        new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched")
    );
});

// 2. Mark all as read
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );
    return res.status(200).json(new ApiResponse(200, {}, "Marked all as read"));
});

// 3. Mark single notification as read
export const markAsRead = asyncHandler(async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return res.status(200).json(new ApiResponse(200, {}, "Marked as read"));
});