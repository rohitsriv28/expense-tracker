import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import Budget from "../models/Budget.model";
import { AppError } from "../utils/AppError";

export const getBudgets = asyncHandler(async (req: Request, res: Response) => {
  const budgets = await Budget.find({ userId: req.user!._id });
  res.json({ success: true, data: budgets });
});

export const createBudget = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, name, amount, month, year, allocations } = req.body;

    if (
      !name ||
      amount === undefined ||
      month === undefined ||
      year === undefined
    ) {
      throw new AppError("Missing required fields for budget", 400);
    }

    const budget = await Budget.create({
      userId: req.user!._id,
      type: type || "monthly_envelope",
      name,
      amount,
      month,
      year,
      allocations: allocations || {},
    });

    res.status(201).json({ success: true, data: budget });
  },
);

export const updateBudget = asyncHandler(
  async (req: Request, res: Response) => {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!budget) {
      throw new AppError("Budget not found", 404);
    }

    res.json({ success: true, data: budget });
  },
);

export const deleteBudget = asyncHandler(
  async (req: Request, res: Response) => {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!budget) {
      throw new AppError("Budget not found", 404);
    }

    res.json({ success: true, data: {} });
  },
);
