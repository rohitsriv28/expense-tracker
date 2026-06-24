import { Router } from "express";
import {
  getFrequencyMap,
  updateFrequencyMap,
} from "../controllers/user.controller";
import { authenticateLean } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { frequencyMapSchema } from "../validation/user.validation";

const router = Router();

router.use(authenticateLean);

router.get("/me/frequency-map", getFrequencyMap);
router.put(
  "/me/frequency-map",
  validate(frequencyMapSchema),
  updateFrequencyMap,
);

export default router;
