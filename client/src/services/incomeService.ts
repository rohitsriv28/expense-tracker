import apiClient from "./apiClient";
import type { Income, IncomeSource } from "../types";
import { broadcastDataChange } from "./broadcastSync";

export const getIncomes = async (): Promise<Income[]> => {
  const res = await apiClient.get("/income");
  return res.data.data as Income[];
};

export const addIncome = async (
  income: Omit<Income, "_id" | "createdAt" | "userId">,
): Promise<string> => {
  const res = await apiClient.post("/income", income);
  broadcastDataChange({ type: "INCOME_CREATED" });
  return res.data.data._id;
};

export const updateIncome = async (
  id: string,
  data: Partial<Income>,
): Promise<void> => {
  await apiClient.put(`/income/${id}`, data);
  broadcastDataChange({ type: "INCOME_UPDATED" });
};

export const deleteIncome = async (id: string): Promise<void> => {
  await apiClient.delete(`/income/${id}`);
  broadcastDataChange({ type: "INCOME_DELETED" });
};

export const getIncomeSources = async (): Promise<IncomeSource[]> => {
  const res = await apiClient.get("/income-sources");
  return res.data.data as IncomeSource[];
};

export const addIncomeSource = async (
  source: Omit<IncomeSource, "_id" | "createdAt" | "userId">,
): Promise<string> => {
  const res = await apiClient.post("/income-sources", source);
  return res.data.data._id;
};

export const updateIncomeSource = async (
  id: string,
  data: Partial<IncomeSource>,
): Promise<void> => {
  await apiClient.put(`/income-sources/${id}`, data);
};

export const deleteIncomeSource = async (id: string): Promise<void> => {
  await apiClient.delete(`/income-sources/${id}`);
};
