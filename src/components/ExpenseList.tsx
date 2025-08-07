import { useState, useEffect } from "react";
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

  const itemsPerPage = 10;
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

  const filterExpenses = () => {
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
  };

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
      <div className="m-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
        <div className="text-center">
          <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <ReceiptIndianRupee className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            No expenses yet
          </h3>
          <p className="text-gray-500 text-lg">
            Add your first expense to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="m-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Title and Summary */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 rounded-lg p-2">
                <ReceiptIndianRupee className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {getFilterLabel(currentFilter)} Expenses
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {filteredExpenses.length}{" "}
                    {filteredExpenses.length === 1 ? "expense" : "expenses"}
                  </span>
                  {filteredExpenses.length > 0 && (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Total: ₹{totalAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 p-1 rounded-xl border border-gray-200">
              {(["daily", "weekly", "monthly"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCurrentFilter(filter)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentFilter === filter
                      ? "bg-white shadow-sm text-indigo-700 border border-indigo-100"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {getFilterLabel(filter)}
                </button>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700 min-w-[80px] text-center">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="m-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="text-center">
            <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              No expenses for {getFilterLabel(currentFilter).toLowerCase()}
            </h3>
            <p className="text-gray-500 text-lg">
              Try selecting a different time period
            </p>
          </div>
        </div>
      ) : (
        <div className="m-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Edit Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className={`transition-all duration-150 hover:bg-gray-50 ${
                      editingId === expense.id
                        ? "bg-blue-50 border-l-4 border-blue-400"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded-lg p-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(expense.date.toDate())}
                          </div>
                          {expense.createdAt && (
                            <div className="text-xs text-gray-500">
                              {/* Added at{" "} */}
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

                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === expense.id ? (
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold"
                          required
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <div className="text-lg font-bold text-gray-900">
                          ₹{expense.amount.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingId === expense.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                            rows={2}
                            placeholder="Enter description..."
                            required
                          />
                          <div className="text-xs text-gray-500">
                            {editRemarks.length}/200 characters
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-800 max-w-xs">
                          {expense.remarks}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {expense.editCount >= 2 ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>No edits left</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            {2 - expense.editCount} edit
                            {2 - expense.editCount !== 1 ? "s" : ""} left
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {editingId === expense.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(expense.id!)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            expense.editCount >= 2
                              ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 hover:border-blue-300"
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
        </div>
      )}
    </div>
  );
}
