import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { Expense } from "../services/firebase";
import type { Category } from "../services/categoryService";
import {
  aggregateCategoryData,
  aggregateChartData,
  TAILWIND_COLORS,
  type TimeRange,
} from "../utils/analyticsUtils";
import { PieChart as PieIcon, BarChart3, Calendar } from "lucide-react";

interface SpendingChartsProps {
  expenses: Expense[];
  categories: Category[];
}

export default function SpendingCharts({
  expenses,
  categories,
}: SpendingChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  // Filter expenses based on time range BEFORE calculating pie chart data too?
  // The user request was "Last 7 Days graph should be interchangeable...".
  // It implies the Pie Chart might also need to respect this range?
  // Usually Pie Chart is "Expenses by Category" -> for the SAME period?
  // The implementation_plan didn't explicitly say Pie Chart needs this, but it makes sense contextually.
  // "Rework on the SpendingChart... provide the option to select the range of showing data."
  // So likely BOTH charts should reflect the selected range.

  const filteredExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date(today);

    switch (timeRange) {
      case "7d":
        startDate.setDate(today.getDate() - 6);
        break;
      case "1m":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "3m":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(today.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }
    // Reset to start of that day
    startDate.setHours(0, 0, 0, 0);

    return expenses.filter((e) => {
      const d = e.date.toDate();
      return d >= startDate && d <= today;
    });
  }, [expenses, timeRange]);

  const categoryData = useMemo(
    () => aggregateCategoryData(filteredExpenses, categories),
    [filteredExpenses, categories]
  );

  const chartData = useMemo(
    () => aggregateChartData(filteredExpenses, timeRange),
    [filteredExpenses, timeRange]
  );

  const ranges: { value: TimeRange; label: string }[] = [
    { value: "7d", label: "7 Days" },
    { value: "1m", label: "1 Month" },
    { value: "3m", label: "3 Months" },
    { value: "6m", label: "6 Months" },
    { value: "1y", label: "1 Year" },
  ];

  if (expenses.length === 0) return null;

  return (
    <div className="space-y-6 mb-6">
      {/* Time Range Selector */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 shadow-sm transition-colors duration-300">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
          Analytics Period
        </h3>
        <div className="flex p-1 bg-gray-100 dark:bg-black/20 rounded-xl overflow-hidden">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                timeRange === range.value
                  ? "bg-white dark:bg-red-600 text-red-600 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution (Pie) */}
        <div className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-xl dark:shadow-xl transition-colors duration-300 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            Spending by Category
          </h3>
          <div className="h-[300px] w-full mt-auto">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TAILWIND_COLORS[entry.color] || "#9ca3af"}
                        className="stroke-white dark:stroke-slate-800 stroke-2"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      `₹${(value ?? 0).toFixed(2)}`
                    }
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "12px",
                      border: "none",
                      color: "#1f2937",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ color: "#1f2937", fontWeight: 600 }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      color: "#9ca3af",
                      fontSize: "12px",
                      paddingLeft: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-white/40 text-sm">
                No data for this period
              </div>
            )}
          </div>
        </div>

        {/* Spending Trend (Bar) */}
        <div className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-xl dark:shadow-xl transition-colors duration-300 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-600 dark:text-red-400" />
            Spending Trend ({ranges.find((r) => r.value === timeRange)?.label})
          </h3>
          <div className="h-[300px] w-full mt-auto">
            {chartData.length > 0 && chartData.some((d) => d.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickMargin={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    cursor={{
                      fill: "rgba(220, 38, 38, 0.1)",
                      radius: 4,
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "12px",
                      border: "none",
                      color: "#1f2937",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#6b7280", marginBottom: "0.25rem" }}
                    formatter={(value: number | undefined) => [
                      `₹${(value ?? 0).toFixed(2)}`,
                      "Spent",
                    ]}
                  />
                  <Bar
                    dataKey="amount"
                    fill="url(#colorGradient)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          timeRange === "7d" && index === 6
                            ? "#b91c1c" // Highlight today
                            : "#dc2626"
                        }
                        className="opacity-80 hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-white/40 text-sm">
                No expenses for this period
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
