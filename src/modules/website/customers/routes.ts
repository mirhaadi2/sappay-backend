import { Router } from "express";
import { loginHandler, registerHandler, meHandler, sendOtpHandler, verifyOtpHandler } from "./controller";
import { requireAuth } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/send-otp", sendOtpHandler);
router.post("/verify-otp", verifyOtpHandler);
router.get("/me", requireAuth, meHandler);

export default router;
