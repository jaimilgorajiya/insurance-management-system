import { Router } from "express";
import { createPaymentOrder, verifyPayment, getPayments } from "../controllers/payment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);
router.get("/", getPayments);

export default router;
