import { Router } from "express";
import {
  getExpenses,
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expense.controller";
import { authenticate } from "../middleware/authenticate";
import { ownershipGuard } from "../middleware/ownership";
import { validate } from "../middleware/validate";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../validation/expense.validation";
import Expense from "../models/Expense.model";

const router = Router();

router.use(authenticate);

router.get("/", getExpenses);
router.get("/all", getAllExpenses);
router.post("/", validate(createExpenseSchema), createExpense);
router.put(
  "/:id",
  ownershipGuard(Expense),
  validate(updateExpenseSchema),
  updateExpense,
);
router.delete("/:id", ownershipGuard(Expense), deleteExpense);

export default router;
