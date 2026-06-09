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

const router = Router();

router.post("/google", googleAuth);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.put("/me/settings", authenticate, updateSettings);
router.delete("/me", authenticate, deleteAccount);

export default router;
