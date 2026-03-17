import { Router } from "express";
import {
  loginHandler,
  registerHandler,
  meHandler,
  logoutHandler,
  checkUserExistsHandler,
  initiateRegistrationHandler,
  verifyRegistrationOtpHandler,
  completeRegistrationHandler
} from "../users/controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

// Legacy registration (keep for backward compatibility)
router.post("/register", registerHandler);

// New registration flow
router.post("/check-user", checkUserExistsHandler);
router.post("/initiate-registration", initiateRegistrationHandler);
router.post("/verify-otp", verifyRegistrationOtpHandler);
router.post("/complete-registration", completeRegistrationHandler);

router.post("/login", loginHandler);
router.post("/logout", requireAuth, logoutHandler);
router.get("/me", requireAuth, meHandler);

export default router;
