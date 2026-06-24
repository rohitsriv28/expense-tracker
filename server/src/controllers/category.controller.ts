import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import Category from "../models/Category.model";
import { AppError } from "../utils/AppError";

const mapCategory = (cat: any) => ({
  _id: cat._id,
  userId: cat.userId,
  name: cat.label,
  icon: cat.icon || "circle",
  color: cat.color,
  sortOrder: cat.order || 0,
  isDefault: cat.type === "default",
  createdAt: cat.createdAt,
});

export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await Category.find({ userId: req.user!._id }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json({ success: true, data: categories.map(mapCategory) });
  },
);

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, icon, color } = req.body;

    const category = await Category.create({
      userId: req.user!._id,
      label: name,
      icon,
      color,
      type: "custom", // Force custom type
    });

    res.status(201).json({ success: true, data: mapCategory(category) });
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { isDefault, type, ...bodyData } = req.body;
    const updateData: any = { ...bodyData };
    if (updateData.name) {
      updateData.label = updateData.name;
      delete updateData.name;
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      updateData,
      { new: true, runValidators: true },
    );

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    res.json({ success: true, data: mapCategory(category) });
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const exists = await Category.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!exists) {
      throw new AppError("Category not found", 404);
    }

    if (exists.type === "default") {
      throw new AppError("Cannot delete default category", 403);
    }

    await Category.findByIdAndDelete(exists._id);
    res.json({ success: true, data: {} });
  },
);
