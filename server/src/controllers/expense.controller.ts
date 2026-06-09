import { Request, Response, NextFunction } from "express";
import Expense from "../models/Expense.model";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    startDate,
    endDate,
    category,
    sortBy = "date",
    sortDir = "desc",
  } = req.query;
  const userId = req.user!._id;

  const filter: Record<string, any> = { userId };
  if (category && category !== "all") filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate as string);
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;
  const sort: Record<string, 1 | -1> = {
    [sortBy as string]: sortDir === "asc" ? 1 : -1,
  };

  const [expenses, total] = await Promise.all([
    Expense.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
    Expense.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      },
    },
  });
});

export const getAllExpenses = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const { startDate, endDate, category } = req.query;

    const filter: Record<string, any> = { userId };
    if (category && category !== "all") filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 }).lean();
    res.json({ success: true, data: expenses });
  },
);

export const createExpense = asyncHandler(
  async (req: Request, res: Response) => {
    const expense = await Expense.create({
      ...req.body,
      userId: req.user!._id,
      editCount: 0,
    });
    res.status(201).json({ success: true, data: expense });
  },
);

export const updateExpense = asyncHandler(
  async (req: Request, res: Response) => {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { ...req.body, $inc: { editCount: 1 } },
      { new: true, runValidators: true },
    );
    if (!expense) throw new AppError("Expense not found", 404);
    res.json({ success: true, data: expense });
  },
);

export const deleteExpense = asyncHandler(
  async (req: Request, res: Response) => {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    });
    if (!expense) throw new AppError("Expense not found", 404);
    res.json({ success: true, message: "Expense deleted" });
  },
);
