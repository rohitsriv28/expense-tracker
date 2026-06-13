import apiClient from "./apiClient";
import type { Category } from "../types";
import { broadcastDataChange } from "./broadcastSync";

export const getCategories = async (): Promise<Category[]> => {
  const res = await apiClient.get("/categories");
  return res.data.data as Category[];
};

export const addCategory = async (
  category: Omit<
    Category,
    "_id" | "isDefault" | "createdAt" | "userId" | "sortOrder"
  >,
): Promise<Category> => {
  const res = await apiClient.post("/categories", category);
  broadcastDataChange({ type: "CATEGORY_UPDATED" });
  return res.data.data as Category;
};

export const updateCategory = async (
  categoryId: string,
  data: Partial<Category>,
): Promise<void> => {
  await apiClient.put(`/categories/${categoryId}`, data);
  broadcastDataChange({ type: "CATEGORY_UPDATED" });
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  await apiClient.delete(`/categories/${categoryId}`);
  broadcastDataChange({ type: "CATEGORY_UPDATED" });
};
