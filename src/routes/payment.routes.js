import { Router } from "express";
import { createOrder, verifyPayment, getMyPortfolio } from "../controllers/payment.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT, restrictTo("investor", "admin")); // Only investors can pay

router.route("/create-order").post(createOrder);
router.route("/verify").post(verifyPayment);
router.route("/portfolio").get(getMyPortfolio); // 👈 NEW ROUTE

export default router;