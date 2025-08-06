import { useState } from "react";
import type { Expense } from "../services/firebase";
import { updateExpense } from "../services/expenseService";
import { formatDate } from "../utils/dateUtils";
import {
  Edit3,
  Save,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">
          No expenses yet
        </h3>
        <p className="text-gray-400">Add your first expense to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-6 p-4">
        <Receipt className="w-6 h-6 text-gray-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">Recent Expenses</h2>
        <span className="ml-auto bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
          {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
        </span>
      </div>

      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="m-4 bg-white rounded-xl shadow-md border border-gray-100 p-2 hover:shadow-lg transition-shadow duration-200"
        >
          {editingId === expense.id ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEdit(expense.id!)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      ₹{expense.amount.toFixed(2)}
                    </div>
                    <div className="text-gray-700 font-medium text-lg">
                      {expense.remarks}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(expense.date.toDate())}
                    </div>
                    <div className="flex items-center text-xs">
                      {expense.editCount >= 2 ? (
                        <div className="flex items-center text-red-500">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          <span>Max edits reached</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>{2 - expense.editCount} edits remaining</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-4">
                <button
                  onClick={() => startEdit(expense)}
                  disabled={expense.editCount >= 2}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    expense.editCount >= 2
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
