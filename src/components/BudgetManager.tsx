import { useState } from "react";
import type { Budget } from "../services/budgetService";
import { addBudget, deleteBudget } from "../services/budgetService";
import type { Expense } from "../services/firebase";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../services/authService";
import { Plus, Calendar, DollarSign, Trash2, Award, PiggyBank } from "lucide-react";
import { formatDate } from "../utils/dateUtils";

interface BudgetManagerProps {
  budgets: Budget[];
  expenses: Expense[];
}

export default function BudgetManager({ budgets, expenses }: BudgetManagerProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [type, setType] = useState<"month" | "week" | "trip">("month");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleTypeChange = (newType: "month" | "week" | "trip") => {
    setType(newType);
    const today = new Date();
    if (newType === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (newType === "week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(today.setDate(diff)).toISOString().split("T")[0];
      const sunday = new Date(today.setDate(diff + 6)).toISOString().split("T")[0];
      setStartDate(monday);
      setEndDate(sunday);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Budget name is required";
    }
    if (!limit || parseFloat(limit) <= 0) {
      newErrors.limit = "Limit must be greater than 0";
    }
    if (!startDate || !endDate) {
      newErrors.dates = "Start and End dates are required";
    } else if (new Date(startDate) > new Date(endDate)) {
      newErrors.dates = "Start date must be before or equal to End date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      const budgetData = {
        name: name.trim(),
        limit: parseFloat(limit),
        type,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
      };

      await addBudget(budgetData);

      // Reset form
      setName("");
      setLimit("");
      setErrors({});
    } catch (error) {
      console.error("Error adding budget:", error);
      setErrors({ submit: "Failed to add budget. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;
    try {
      await deleteBudget(id);
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  // Helper to compute spent amount within the budget duration
  const getSpentForBudget = (budget: Budget) => {
    const start = budget.startDate.toDate().getTime();
    // end of day for comparison
    const end = new Date(budget.endDate.toDate());
    end.setHours(23, 59, 59, 999);
    const endTime = end.getTime();

    return expenses
      .filter((expense) => {
        const expTime = expense.date.toDate().getTime();
        return expTime >= start && expTime <= endTime;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Set Budget Form */}
      <div className="lg:col-span-1 bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-xl transition-colors duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-600 rounded-xl p-2.5 shadow-lg shadow-purple-500/20">
            <PiggyBank className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Set Budget Limit
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-100 text-sm">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">
              Budget Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. May 2026, Paris Trip, Week 22"
              className="w-full px-4 py-2 border border-gray-200 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 dark:bg-white/5 dark:text-white"
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">
              Budget Limit Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-200 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 dark:bg-white/5 dark:text-white font-semibold text-lg"
              required
            />
            {errors.limit && <p className="text-red-500 text-xs mt-1">{errors.limit}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">
              Budget Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["month", "week", "trip"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border capitalize transition-all ${
                    type === t
                      ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 dark:bg-white/5 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 dark:bg-white/5 dark:text-white"
                required
              />
            </div>
          </div>
          {errors.dates && <p className="text-red-500 text-xs mt-1">{errors.dates}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Plus className="w-5 h-5" /> Set Active Budget
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active Budgets List */}
      <div className="lg:col-span-2 bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-xl transition-colors duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500 rounded-xl p-2.5 shadow-lg shadow-amber-500/20">
            <Award className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Active Budgets & Depletion
          </h2>
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
            <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-purple-300 text-sm">
              No active budgets configured. Set a weekly, monthly, or trip budget to see dynamic expense depletion.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget) => {
              const spent = getSpentForBudget(budget);
              const remaining = Math.max(0, budget.limit - spent);
              const percentage = Math.min(100, (spent / budget.limit) * 100);
              const isOverBudget = spent > budget.limit;

              return (
                <div
                  key={budget.id}
                  className={`border rounded-2xl p-4 md:p-5 relative transition-all duration-300 ${
                    isOverBudget
                      ? "border-red-300 bg-red-500/5"
                      : "border-gray-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                  }`}
                >
                  <button
                    onClick={() => handleDeleteBudget(budget.id!)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                    title="Delete Budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="mb-3">
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 mb-1.5 capitalize">
                      {budget.type}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-6">
                      {budget.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-purple-300 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(budget.startDate.toDate())} - {formatDate(budget.endDate.toDate())}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-white dark:bg-slate-900/50 rounded-xl p-3 border border-gray-100 dark:border-white/10 mb-4">
                    <div>
                      <span className="block text-[10px] text-gray-400 font-semibold">LIMIT</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">₹{budget.limit}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-semibold">SPENT</span>
                      <span className={`text-sm font-bold ${isOverBudget ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                        ₹{spent.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-semibold">REMAINING</span>
                      <span className={`text-sm font-bold ${isOverBudget ? "text-red-600" : "text-green-600 dark:text-green-400"}`}>
                        ₹{remaining.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className={isOverBudget ? "text-red-500" : "text-gray-500 dark:text-purple-300"}>
                        {isOverBudget ? "Over Budget!" : `${percentage.toFixed(0)}% Depleted`}
                      </span>
                      <span className="text-gray-500 dark:text-purple-300">
                        ₹{remaining.toFixed(0)} left
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/10 h-3.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isOverBudget
                            ? "bg-red-600 animate-pulse"
                            : percentage > 85
                            ? "bg-amber-500"
                            : "bg-purple-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
