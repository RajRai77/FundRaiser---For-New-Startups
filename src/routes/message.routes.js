import { Router } from "express";
import { sendMessage, getChatHistory, unlockChatAccess } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// You must be logged in to chat
router.use(verifyJWT);

// Chat Routes
router.route("/send").post(sendMessage);
router.route("/history/:otherUserId").get(getChatHistory);

// Payment Unlock Route
router.route("/unlock").post(unlockChatAccess);

export default router;