import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import IncomeSource from "../models/IncomeSource.model";
import { AppError } from "../utils/AppError";

export const getIncomeSources = asyncHandler(
  async (req: Request, res: Response) => {
    const sources = await IncomeSource.find({ userId: req.user!._id }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json({ success: true, data: sources });
  },
);

export const createIncomeSource = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, icon, color, frequency, expectedAmount, isDefault } = req.body;

    if (!name || !icon || !color || !frequency) {
      throw new AppError("Missing required fields", 400);
    }

    const source = await IncomeSource.create({
      userId: req.user!._id,
      name,
      icon,
      color,
      frequency,
      expectedAmount,
      isDefault: isDefault || false,
    });

    res.status(201).json({ success: true, data: source });
  },
);

export const updateIncomeSource = asyncHandler(
  async (req: Request, res: Response) => {
    const source = await IncomeSource.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!source) {
      throw new AppError("Income source not found", 404);
    }

    res.json({ success: true, data: source });
  },
);

export const deleteIncomeSource = asyncHandler(
  async (req: Request, res: Response) => {
    const source = await IncomeSource.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
      isDefault: false, // Prevent deleting default sources
    });

    if (!source) {
      throw new AppError("Income source not found or cannot be deleted", 404);
    }

    res.json({ success: true, data: {} });
  },
);
