import { Router } from "express";
import { getPendingPitches, reviewPitch } from "../controllers/admin.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Only ADMIN can access these routes
router.use(verifyJWT, restrictTo("admin"));

router.route("/pending-pitches").get(getPendingPitches);
router.route("/review-pitch/:startupId").patch(reviewPitch);

export default router;