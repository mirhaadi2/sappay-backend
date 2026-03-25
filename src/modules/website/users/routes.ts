import { Router } from "express";
import { loginHandler, registerHandler, meHandler } from "./controller";
import { requireAuth } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", requireAuth, meHandler);

export default router;
