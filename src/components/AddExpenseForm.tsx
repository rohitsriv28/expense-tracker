import { useState } from "react";
import { addExpense } from "../services/expenseService";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../services/authService";

export default function AddExpenseForm() {
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !remarks || !user) return;

    try {
      await addExpense({
        amount: parseFloat(amount),
        remarks,
        date: Timestamp.fromDate(new Date(date)),
        editCount: 0,
      });
      setAmount("");
      setRemarks("");
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 p-4 bg-white rounded-lg shadow"
    >
      <div className="grid grid-cols-1 gap-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="p-2 border rounded"
          required
        />
        <input
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Description"
          className="p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          disabled={!user}
        >
          Add Expense
        </button>
      </div>
    </form>
  );
}
