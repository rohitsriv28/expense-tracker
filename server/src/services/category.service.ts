import Category from "../models/Category.model";
import IncomeSource from "../models/IncomeSource.model";
import { Types } from "mongoose";

const DEFAULT_CATEGORIES = [
  {
    label: "Food & Drink",
    color: "bg-orange-600",
    icon: "Coffee",
    type: "default" as const,
  },
  {
    label: "Transport",
    color: "bg-blue-600",
    icon: "Car",
    type: "default" as const,
  },
  {
    label: "Shopping",
    color: "bg-rose-600",
    icon: "ShoppingBag",
    type: "default" as const,
  },
  {
    label: "Bills",
    color: "bg-emerald-600",
    icon: "Home",
    type: "default" as const,
  },
  {
    label: "Entertainment",
    color: "bg-red-600",
    icon: "Gamepad2",
    type: "default" as const,
  },
  {
    label: "Healthcare",
    color: "bg-red-400",
    icon: "Heart",
    type: "default" as const,
  },
  {
    label: "Other",
    color: "bg-slate-500",
    icon: "MoreHorizontal",
    type: "default" as const,
  },
];

const DEFAULT_INCOME_SOURCES = [
  {
    name: "Salary",
    icon: "Briefcase",
    color: "#3b82f6",
    frequency: "monthly" as const,
  },
  {
    name: "Freelance",
    icon: "Code",
    color: "#8b5cf6",
    frequency: "irregular" as const,
  },
  {
    name: "Business",
    icon: "Building2",
    color: "#f59e0b",
    frequency: "monthly" as const,
  },
  {
    name: "Investment",
    icon: "TrendingUp",
    color: "#22c55e",
    frequency: "irregular" as const,
  },
  {
    name: "Rental Income",
    icon: "Home",
    color: "#14b8a6",
    frequency: "monthly" as const,
  },
  {
    name: "Gift / Other",
    icon: "Gift",
    color: "#ec4899",
    frequency: "irregular" as const,
  },
];

export async function seedDefaultCategories(
  userId: Types.ObjectId,
): Promise<void> {
  const existing = await Category.countDocuments({ userId });
  if (existing > 0) return;

  await Category.insertMany(
    DEFAULT_CATEGORIES.map((cat, i) => ({
      ...cat,
      userId,
      isArchived: false,
      order: i,
    })),
  );
}

export async function seedDefaultIncomeSources(
  userId: Types.ObjectId,
): Promise<void> {
  const existing = await IncomeSource.countDocuments({ userId });
  if (existing > 0) return;

  await IncomeSource.insertMany(
    DEFAULT_INCOME_SOURCES.map((src, i) => ({
      ...src,
      userId,
      isDefault: true,
      order: i,
    })),
  );
}

/**
 * Called on first login — seeds both categories and income sources.
 */
export async function initializeNewUser(userId: Types.ObjectId): Promise<void> {
  await Promise.all([
    seedDefaultCategories(userId),
    seedDefaultIncomeSources(userId),
  ]);
}
