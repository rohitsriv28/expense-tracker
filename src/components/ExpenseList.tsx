import { useState, useEffect, useCallback } from "react";
import type { Expense } from "../services/firebase";
import { updateExpense } from "../services/expenseService";
import {
  formatDate,
  getStartOfDay,
  getStartOfWeek,
  getStartOfMonth,
  getEndOfPeriod,
  getFilterLabel,
} from "../utils/dateUtils";
import {
  Edit3,
  Save,
  Calendar,
  ReceiptIndianRupee,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Clock,
  Filter,
} from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Calculate total amount for filtered expenses
  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  useEffect(() => {
    filterExpenses();
  }, [expenses, currentFilter]);

  const filterExpenses = useCallback(() => {
    const now = new Date();
    let startDate: Date;

    switch (currentFilter) {
      case "daily":
        startDate = getStartOfDay(now);
        break;
      case "weekly":
        startDate = getStartOfWeek(now);
        break;
      case "monthly":
        startDate = getStartOfMonth(now);
        break;
      default:
        startDate = getStartOfDay(now);
    }

    const endDate = getEndOfPeriod(startDate, currentFilter);

    const filtered = expenses.filter((expense) => {
      const expenseDate = expense.date.toDate();
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Sort by date (newest first) and then by creation time
    filtered.sort((a, b) => {
      // First sort by expense date (newest first)
      const dateDiff = b.date.toMillis() - a.date.toMillis();
      if (dateDiff !== 0) return dateDiff;

      // Then sort by creation time (newest first)
      return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    });

    setFilteredExpenses(filtered);
    setCurrentPage(1);
  }, [currentFilter, expenses]);

  const startEdit = (expense: Expense) => {
    if (expense.editCount >= 2) return;
    setEditingId(expense.id!);
    setEditAmount(expense.amount.toString());
    setEditRemarks(expense.remarks);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditRemarks("");
  };

  const saveEdit = async (id: string) => {
    if (!editAmount || !editRemarks) return;
    setIsLoading(true);

    try {
      await updateExpense(id, {
        amount: parseFloat(editAmount),
        remarks: editRemarks,
        editCount: expenses.find((e) => e.id === id)!.editCount + 1,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white border text-center border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-8 shadow-lg dark:shadow-none transition-colors duration-300">
        <div className="bg-red-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <ReceiptIndianRupee className="w-8 h-8 text-red-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No expenses yet
        </h3>
        <p className="text-gray-500 dark:text-red-300">
          Add your first expense to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <div className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-lg dark:shadow-none transition-colors duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Title and Summary */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 rounded-lg p-2">
                <ReceiptIndianRupee className="w-5 h-5 md:w-6 md:h-6 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {getFilterLabel(currentFilter)} Expenses
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-500 dark:text-red-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                    {filteredExpenses.length}{" "}
                    {filteredExpenses.length === 1 ? "expense" : "expenses"}
                  </span>
                  {filteredExpenses.length > 0 && (
                    <span className="text-sm text-gray-500 dark:text-red-300 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                      Total: ₹{totalAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>

            <div
              className={`${
                showFilters ? "flex" : "hidden"
              } md:flex flex-col md:flex-row items-center gap-2 w-full md:w-auto`}
            >
              <div className="bg-gray-100 dark:bg-white/10 p-1 rounded-xl border border-gray-200 dark:border-white/20 w-full md:w-auto">
                {(["daily", "weekly", "monthly"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setCurrentFilter(filter);
                      setShowFilters(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full md:w-auto ${
                      currentFilter === filter
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-red-300 dark:hover:text-white dark:hover:bg-white/10"
                    }`}
                  >
                    {getFilterLabel(filter)}
                  </button>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 p-1 rounded-xl border border-gray-200 dark:border-white/20 w-full md:w-auto justify-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-white dark:text-white dark:hover:bg-white/10"
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-white min-w-[60px] text-center">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-white dark:text-white dark:hover:bg-white/10"
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-8 text-center">
          <div className="bg-red-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-red-600 dark:text-red-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No expenses for {getFilterLabel(currentFilter).toLowerCase()}
          </h3>
          <p className="text-gray-500 dark:text-red-300">
            Try selecting a different time period
          </p>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-100 border-b border-gray-200 dark:bg-white/10 dark:border-white/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                    Edit Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {paginatedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className={`transition-all duration-150 hover:bg-slate-50 dark:hover:bg-white/5 ${
                      editingId === expense.id
                        ? "bg-indigo-50 border-l-4 border-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-400"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-50 dark:bg-white/10 rounded-lg p-2">
                          <Calendar className="w-4 h-4 text-red-500 dark:text-red-300" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(expense.date.toDate())}
                          </div>
                          {expense.createdAt && (
                            <div className="text-xs text-gray-500 dark:text-red-300">
                              {expense.createdAt
                                .toDate()
                                .toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingId === expense.id ? (
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 p-2 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-semibold bg-white text-gray-900 dark:bg-white/5 dark:text-white"
                          required
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{expense.amount.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {editingId === expense.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            className="w-full p-3 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none bg-white text-gray-900 dark:bg-white/5 dark:text-white"
                            rows={2}
                            placeholder="Enter description..."
                            required
                          />
                          <div className="text-xs text-gray-500 dark:text-purple-300">
                            {editRemarks.length}/200 characters
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 dark:text-white max-w-xs">
                          {expense.remarks}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {expense.editCount >= 2 ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                          <AlertCircle className="w-3 h-3" />
                          <span>No edits left</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            {2 - expense.editCount} edit
                            {2 - expense.editCount !== 1 ? "s" : ""} left
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {editingId === expense.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-white dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(expense.id!)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || !editAmount || !editRemarks}
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {isLoading ? "Saving..." : "Save"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(expense)}
                          disabled={expense.editCount >= 2}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            expense.editCount >= 2
                              ? "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-white/10"
                              : "bg-red-600 text-white hover:bg-red-700 border border-red-500"
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-white/10">
            {paginatedExpenses.map((expense) => (
              <div
                key={expense.id}
                className={`p-4 transition-all duration-150 ${
                  editingId === expense.id
                    ? "bg-indigo-50 border-l-4 border-indigo-500 dark:bg-indigo-500/10 dark:border-indigo-400"
                    : ""
                }`}
              >
                {editingId === expense.id ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 dark:text-purple-300" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(expense.date.toDate())}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        ₹{expense.amount.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-white">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold bg-white text-gray-900 dark:bg-white/5 dark:text-white"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-white">
                        Description
                      </label>
                      <textarea
                        value={editRemarks}
                        onChange={(e) => setEditRemarks(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none bg-white text-gray-900 dark:bg-white/5 dark:text-white"
                        rows={2}
                        placeholder="Enter description..."
                        required
                      />
                      <div className="text-xs text-gray-500 dark:text-purple-300">
                        {editRemarks.length}/200 characters
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-white dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(expense.id!)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !editAmount || !editRemarks}
                      >
                        {isLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-300" />
                        <span className="text-sm text-gray-600 dark:text-white">
                          {formatDate(expense.date.toDate())}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        ₹{expense.amount.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-white mb-3">
                      {expense.remarks}
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        {expense.editCount >= 2 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                            <AlertCircle className="w-3 h-3" />
                            <span>No edits left</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                            <CheckCircle className="w-3 h-3" />
                            <span>
                              {2 - expense.editCount} edit
                              {2 - expense.editCount !== 1 ? "s" : ""} left
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => startEdit(expense)}
                        disabled={expense.editCount >= 2}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          expense.editCount >= 2
                            ? "bg-white/5 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4 md:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-colors ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 dark:text-white dark:bg-white/10 dark:border-none dark:hover:bg-white/20"
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-colors ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 dark:text-white dark:bg-white/10 dark:border-none dark:hover:bg-white/20"
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
