import express from "express";
import { authenticateLean } from "../middleware/authenticate";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../controllers/budget.controller";
import { validate } from "../middleware/validate";
import {
  createBudgetSchema,
  updateBudgetSchema,
} from "../validation/budget.validation";

const router = express.Router();

router.use(authenticateLean);

router
  .route("/")
  .get(getBudgets)
  .post(validate(createBudgetSchema), createBudget);

router
  .route("/:id")
  .put(validate(updateBudgetSchema), updateBudget)
  .delete(deleteBudget);

export default router;
