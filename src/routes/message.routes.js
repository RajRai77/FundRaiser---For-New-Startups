import { Router } from "express";
import { 
    sendMessage, 
    getChatHistory, 
    unlockChatAccess, 
    checkChatAccess,
    getContacts 
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Sidebar & Chat Routes
router.route("/contacts").get(getContacts);
router.route("/history/:otherUserId").get(getChatHistory);

// Messaging & Paywall Routes
router.route("/send").post(sendMessage);
router.route("/access/:founderId").get(checkChatAccess); // Frontend will hit this first!
router.route("/unlock").post(unlockChatAccess);

export default router;