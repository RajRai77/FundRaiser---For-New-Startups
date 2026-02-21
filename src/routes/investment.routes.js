import { Router } from "express";
import { 
    createInvestmentOrder, 
    verifyInvestmentPayment 
} from "../controllers/investment.controller.js";
import { verifyJWT, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

// Only INVESTORS can put money in!
router.use(verifyJWT, restrictTo("investor"));

// Step 1: Create Order
router.route("/:startupId/order").post(createInvestmentOrder);

// Step 2: Verify Payment
router.route("/verify").post(verifyInvestmentPayment);

export default router;