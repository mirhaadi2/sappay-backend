import { Router } from "express";
import { loginHandler, registerHandler, meHandler, logoutHandler } from "../users/controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/logout", requireAuth, logoutHandler);
router.get("/me", requireAuth, meHandler);

export default router;
