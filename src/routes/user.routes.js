import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// --- Public Routes (No login required) ---
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// --- Secured Routes (Must be logged in) ---
// We inject verifyJWT middleware before the logout controller runs
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/update-profile").patch(
    verifyJWT, 
    upload.single("avatar"), 
    updateProfile
);

export default router;