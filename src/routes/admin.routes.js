import { Router } from "express";
import { getPendingPitches, reviewPitch } from "../controllers/admin.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// 🛡️ Security: Har route ke liye Login aur 'admin' role zaruri hai
router.use(verifyJWT, restrictTo("admin"));

// 🛣️ Admin Routes
router.route("/startups/pending").get(getPendingPitches);
router.route("/startups/:startupId/review").patch(reviewPitch);

export default router;