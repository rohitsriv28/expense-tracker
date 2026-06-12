import { Router } from "express";
import {
  googleAuth,
  refresh,
  logout,
  getMe,
  updateSettings,
  deleteAccount,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/google", authRateLimiter, googleAuth);
router.post("/refresh", authRateLimiter, refresh);
router.post("/logout", authRateLimiter, logout);

router.get("/me", authenticate, getMe);
router.put("/me/settings", authenticate, updateSettings);
router.delete("/me", authenticate, deleteAccount);

export default router;
