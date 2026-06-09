import { Router } from "express";
import authRoutes from "./auth.routes";
import expenseRoutes from "./expense.routes";
import categoryRoutes from "./category.routes";
import incomeRoutes from "./income.routes";
import incomeSourceRoutes from "./income-source.routes";
import budgetRoutes from "./budget.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/expenses", expenseRoutes);
router.use("/categories", categoryRoutes);
router.use("/income", incomeRoutes);
router.use("/income-sources", incomeSourceRoutes);
router.use("/budgets", budgetRoutes);
router.use("/users", userRoutes);

export default router;
