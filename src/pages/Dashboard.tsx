import { useEffect, useState } from "react";
import { useAuth } from "../services/authService";
import type { Expense } from "../services/firebase";
import Header from "../components/Header";
import { getExpenses } from "../services/expenseService";
import AddExpenseForm from "../components/AddExpenseForm";
import InsightsSummary from "../components/InsightsSummary";
import ExpenseList from "../components/ExpenseList";
import { generateExpensePDF } from "../services/pdfExport";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getExpenses(user.uid, setExpenses);
    return () => unsubscribe();
  }, [user]);

  const handleExport = async () => {
    try {
      if (expenses.length === 0) {
        alert("No expenses to export");
        return;
      }
      
      const pdfBytes = await generateExpensePDF(expenses);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expenses-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Header onLogout={logout} onExport={handleExport} />

      <div className="my-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Expense Summary
        </h1>
        <InsightsSummary expenses={expenses} />
      </div>

      <AddExpenseForm />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Recent Expenses
        </h2>
        <ExpenseList expenses={expenses} />
      </div>
    </div>
  );
}
