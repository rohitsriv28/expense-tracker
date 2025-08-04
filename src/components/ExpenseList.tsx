import { useState } from "react";
import type { Expense } from "../services/firebase";
import { updateExpense } from "../services/expenseService";
import { formatDate } from "../utils/dateUtils";

interface ExpenseListProps {
  expenses: Expense[];
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  const startEdit = (expense: Expense) => {
    if (expense.editCount >= 2) return;
    setEditingId(expense.id!);
    setEditAmount(expense.amount.toString());
    setEditRemarks(expense.remarks);
  };

  const saveEdit = async (id: string) => {
    if (!editAmount || !editRemarks) return;
    await updateExpense(id, {
      amount: parseFloat(editAmount),
      remarks: editRemarks,
      editCount: expenses.find((e) => e.id === id)!.editCount + 1,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="p-3 bg-white rounded-lg shadow flex justify-between items-center"
        >
          {editingId === expense.id ? (
            <div className="flex-1">
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full p-1 mb-2 border rounded"
                required
              />
              <input
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                className="w-full p-1 border rounded"
                required
              />
            </div>
          ) : (
            <div className="flex-1">
              <div className="font-bold">₹{expense.amount.toFixed(2)}</div>
              <div>{expense.remarks}</div>
              <div className="text-sm text-gray-500">
                {formatDate(expense.date.toDate())}
              </div>
              <div className="text-xs text-gray-400">
                Edits: {expense.editCount}/2
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            {editingId === expense.id ? (
              <button
                onClick={() => saveEdit(expense.id!)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => startEdit(expense)}
                disabled={expense.editCount >= 2}
                className={`px-3 py-1 rounded text-sm ${
                  expense.editCount >= 2
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white"
                }`}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
