import type { Expense } from "../services/firebase";
import { getCurrentMonth, getWeekRange } from "../utils/dateUtils";
import { Calendar, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

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
    items.reduce((sum, item) => sum + item.amount, 0);

  const calculateAverage = (items: Expense[], days: number) =>
    items.length > 0 ? calculateTotal(items) / days : 0;

  const dailyTotal = calculateTotal(dailyExpenses);
  const weeklyTotal = calculateTotal(weeklyExpenses);
  const monthlyTotal = calculateTotal(monthlyExpenses);
  const dailyAverage = calculateAverage(monthlyExpenses, new Date().getDate());

  const summaryCards = [
    {
      title: "Today",
      amount: dailyTotal,
      count: dailyExpenses.length,
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      textColor: "text-blue-700",
    },
    {
      title: "This Week",
      amount: weeklyTotal,
      count: weeklyExpenses.length,
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
      textColor: "text-green-700",
    },
    {
      title: "This Month",
      amount: monthlyTotal,
      count: monthlyExpenses.length,
      icon: BarChart3,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      textColor: "text-purple-700",
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center mb-6">
        <DollarSign className="w-6 h-6 text-gray-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">
          Spending Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden bg-gradient-to-br ${card.bgGradient} rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className={`text-right ${card.textColor}`}>
                    <p className="text-sm font-medium opacity-80">
                      {card.title}
                    </p>
                    <p className="text-xs opacity-60">
                      {card.count} {card.count === 1 ? "expense" : "expenses"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className={`text-3xl font-bold ${card.textColor}`}>
                    ₹{card.amount.toFixed(2)}
                  </p>

                  {index === 2 && monthlyExpenses.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className={`${card.textColor} opacity-70`}>
                        Daily avg: ₹{dailyAverage.toFixed(2)}
                      </span>
                      <span
                        className={`${card.textColor} opacity-70 bg-white/20 px-2 py-1 rounded-full text-xs`}
                      >
                        {new Date().getDate()} days
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Decorative gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 pointer-events-none`}
              ></div>
            </div>
          );
        })}
      </div>

      {expenses.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-gray-600" />
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">
                {expenses.length}
              </p>
              <p className="text-sm text-gray-600">Total Expenses</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">
                ₹{calculateTotal(expenses).toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">All Time</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">
                ₹
                {expenses.length > 0
                  ? (calculateTotal(expenses) / expenses.length).toFixed(0)
                  : "0"}
              </p>
              <p className="text-sm text-gray-600">Average</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">
                ₹
                {expenses.length > 0
                  ? Math.max(...expenses.map((e) => e.amount)).toFixed(0)
                  : "0"}
              </p>
              <p className="text-sm text-gray-600">Highest</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
