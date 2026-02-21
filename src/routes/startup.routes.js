import { Router } from "express";
import { 
    createPitchBasics, 
    getMyPitches, 
    updatePitch, 
    submitPitch,
    getLiveStartups,  
    getStartupById    
} from "../controllers/startup.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply verifyJWT to ALL routes (you must be logged in to see anything)
router.use(verifyJWT);

// --- Public Dashboard Routes (For both Founders & Investors) ---
router.route("/feed/live").get(getLiveStartups);
router.route("/:startupId").get(getStartupById);

// --- Founder Only Routes ---
router.route("/create-basics").post(restrictTo("founder"), upload.single("logo"), createPitchBasics);
router.route("/my-pitches").get(restrictTo("founder"), getMyPitches);
router.route("/:startupId/update").patch(
    restrictTo("founder"),
    upload.fields([{ name: "pitchDeck", maxCount: 1 }]),
    updatePitch
);
router.route("/:startupId/submit").patch(restrictTo("founder"), submitPitch);

export default router;