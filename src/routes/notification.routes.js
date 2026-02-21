import { Router } from "express";
import { getMyNotifications, markAsRead } from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Must be logged in to see notifications
router.use(verifyJWT);

router.route("/").get(getMyNotifications);
router.route("/:notificationId/read").patch(markAsRead);

export default router;