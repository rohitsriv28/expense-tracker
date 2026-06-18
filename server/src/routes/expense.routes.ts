import { Router } from "express";
import {
  getExpenses,
  getAllExpenses,
  createExpense,
  updateExpense,
} from "../controllers/expense.controller";
import { authenticateLean } from "../middleware/authenticate";
import { ownershipGuard } from "../middleware/ownership";
import { validate } from "../middleware/validate";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../validation/expense.validation";
import Expense from "../models/Expense.model";

const router = Router();

router.use(authenticateLean);

router.get("/", getExpenses);
router.get("/all", getAllExpenses);
router.post("/", validate(createExpenseSchema), createExpense);
router.put(
  "/:id",
  ownershipGuard(Expense),
  validate(updateExpenseSchema),
  updateExpense,
);

export default router;
