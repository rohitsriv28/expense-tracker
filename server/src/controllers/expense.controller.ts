import { Request, Response, NextFunction } from "express";
import Expense, { IExpense } from "../models/Expense.model";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { expenseQuerySchema } from "../validation/expense.validation";

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const query = expenseQuerySchema.parse(req.query);
  const { page, limit, startDate, endDate, category, sortBy, sortDir } = query;
  const userId = req.user!._id;

  const filter: Record<string, any> = { userId };
  if (category && category !== "all") filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortDir === "asc" ? 1 : -1,
  };

  const [expenses, total] = await Promise.all([
    Expense.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Expense.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
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

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .limit(1000)
      .lean();
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
    const current = (req.doc ||
      (await Expense.findOne({
        _id: req.params.id,
        userId: req.user!._id,
      }))) as IExpense | null;

    if (!current) throw new AppError("Expense not found", 404);
    if (current.editCount >= 3)
      throw new AppError("Maximum edit limit reached (3 times).", 403);

    const expense = await Expense.findByIdAndUpdate(
      current._id,
      { ...req.body, $inc: { editCount: 1 } },
      { new: true, runValidators: true },
    );
    res.json({ success: true, data: expense });
  },
);
