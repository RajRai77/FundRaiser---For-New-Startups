import { Router } from "express";
import { toggleSaveIdea, getMySavedIdeas } from "../controllers/bookmark.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Only INVESTORS save ideas in this platform
router.use(verifyJWT, restrictTo("investor"));

// Route to get all saved ideas
router.route("/").get(getMySavedIdeas);

// Route to toggle the heart icon
router.route("/toggle/:startupId").post(toggleSaveIdea);

export default router;