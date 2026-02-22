import { Router } from "express";
import { 
    createPitchBasics, 
    getMyPitches, 
    updatePitch, 
    submitPitch,
    getLiveStartups,  
    getStartupById,
    getStartupInvestors
} from "../controllers/startup.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply verifyJWT to ALL routes
router.use(verifyJWT);

// 1️⃣ STATIC ROUTES FIRST (Put these at the top!)
router.route("/feed/live").get(getLiveStartups);
router.route("/my-pitches").get(restrictTo("founder"), getMyPitches);
router.route("/create-basics").post(restrictTo("founder"), upload.single("logo"), createPitchBasics);

// 2️⃣ DYNAMIC ROUTES LAST (Put anything with /:id at the bottom)
router.route("/:startupId").get(getStartupById);
router.route("/:startupId/update").patch(
    restrictTo("founder"),
    upload.fields([{ name: "pitchDeck", maxCount: 1 }]),
    updatePitch
);
router.route("/:startupId/submit").patch(restrictTo("founder"), submitPitch);
router.route("/:startupId/investors").get(restrictTo("founder"), getStartupInvestors);

export default router;