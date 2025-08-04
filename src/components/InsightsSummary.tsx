import type { Expense } from "../services/firebase";
import { getCurrentMonth, getWeekRange } from "../utils/dateUtils";

interface InsightsSummaryProps {
  expenses: Expense[];
}

export default function InsightsSummary({ expenses }: InsightsSummaryProps) {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  const dailyExpenses = expenses.filter(
    (e) => e.date.toDate().toISOString().split("T")[0] === todayString
  );

  const weeklyExpenses = expenses.filter((e) => {
    const [start, end] = getWeekRange(today);
    const date = e.date.toDate();
    return date >= start && date <= end;
  });

  const monthlyExpenses = expenses.filter(
    (e) => getCurrentMonth(e.date.toDate()) === getCurrentMonth(today)
  );

  const calculateTotal = (items: Expense[]) =>
    items.reduce((sum, item) => sum + item.amount, 0).toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-700">Today</h3>
        <p className="text-2xl font-semibold">
          ₹{calculateTotal(dailyExpenses)}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-700">This Week</h3>
        <p className="text-2xl font-semibold">
          ₹{calculateTotal(weeklyExpenses)}
        </p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-2 text-gray-700">This Month</h3>
        <p className="text-2xl font-semibold">
          ₹{calculateTotal(monthlyExpenses)}
        </p>
      </div>
    </div>
  );
}
