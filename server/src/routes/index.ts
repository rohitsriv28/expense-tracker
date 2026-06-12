import { Router } from "express";
import authRoutes from "./auth.routes";
import expenseRoutes from "./expense.routes";
import categoryRoutes from "./category.routes";
import incomeRoutes from "./income.routes";
import incomeSourceRoutes from "./income-source.routes";
import budgetRoutes from "./budget.routes";
import userRoutes from "./user.routes";

const router = Router();

// Uptime monitor ping route to prevent Render cold-starts
router.get("/ping", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/expenses", expenseRoutes);
router.use("/categories", categoryRoutes);
router.use("/income", incomeRoutes);
router.use("/income-sources", incomeSourceRoutes);
router.use("/budgets", budgetRoutes);
router.use("/users", userRoutes);

export default router;
