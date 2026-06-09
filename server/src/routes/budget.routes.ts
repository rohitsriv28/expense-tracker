import express from "express";
import { authenticate } from "../middleware/authenticate";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../controllers/budget.controller";

const router = express.Router();

router.use(authenticate);

router.route("/").get(getBudgets).post(createBudget);

router.route("/:id").put(updateBudget).delete(deleteBudget);

export default router;
