import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import Income from "../models/Income.model";
import { AppError } from "../utils/AppError";

export const getIncome = asyncHandler(async (req: Request, res: Response) => {
  const income = await Income.find({ userId: req.user!._id })
    .sort({ date: -1 })
    .limit(1000);
  res.json({ success: true, data: income });
});

export const createIncome = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      amount,
      source,
      date,
      description,
      isRecurring,
      recurringFrequency,
    } = req.body;

    const income = await Income.create({
      userId: req.user!._id,
      amount,
      source,
      date,
      description: description || "",
      isRecurring: isRecurring || false,
      recurringFrequency,
    });

    res.status(201).json({ success: true, data: income });
  },
);

export const updateIncome = asyncHandler(
  async (req: Request, res: Response) => {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!income) {
      throw new AppError("Income not found", 404);
    }

    res.json({ success: true, data: income });
  },
);

export const deleteIncome = asyncHandler(
  async (req: Request, res: Response) => {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!income) {
      throw new AppError("Income not found", 404);
    }

    res.json({ success: true, data: {} });
  },
);
