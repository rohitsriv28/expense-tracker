import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
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
  TAILWIND_COLORS,
} from "../utils/analyticsUtils";
import {
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

interface ReportsSectionProps {
  expenses: Expense[];
  categories: Category[];
}

type ReportTab = "overview" | "categories" | "trends" | "compare";

export default function ReportsSection({ expenses, categories }: ReportsSectionProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [comparePreset, setComparePreset] = useState<"month" | "week">("month");

  // --- GENERAL SPENDING CALCULATIONS ---
  const totals = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const avg = expenses.length > 0 ? total / expenses.length : 0;
    const highest = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : 0;
    return { total, avg, highest };
  }, [expenses]);

  // --- DAY OF WEEK PEAK CALCULATIONS ---
  const dayOfWeekStats = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const counts = Array(7).fill(0);
    expenses.forEach((e) => {
      const day = e.date.toDate().getDay();
      counts[day] += e.amount;
    });
    const peakIndex = counts.indexOf(Math.max(...counts));
    return {
      peakDay: expenses.length > 0 ? days[peakIndex] : "None",
      peakAmount: counts[peakIndex],
      chartData: days.map((day, idx) => ({ day, amount: counts[idx] })),
    };
  }, [expenses]);

  // --- PERIOD-OVER-PERIOD COMPARISON ---
  const comparisonData = useMemo(() => {
    const today = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (comparePreset === "month") {
      // Current Month
      currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
      currentEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      // Previous Month
      prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      prevEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    } else {
      // Current Week (Mon - Sun)
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      currentStart = new Date(today.setDate(diff));
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + 6);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous Week
      prevStart = new Date(currentStart);
      prevStart.setDate(currentStart.getDate() - 7);
      prevEnd = new Date(currentEnd);
      prevEnd.setDate(currentEnd.getDate() - 7);
    }

    const currentExpenses = expenses.filter((e) => {
      const d = e.date.toDate();
      return d >= currentStart && d <= currentEnd;
    });

    const prevExpenses = expenses.filter((e) => {
      const d = e.date.toDate();
      return d >= prevStart && d <= prevEnd;
    });

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);

    const absoluteDiff = currentTotal - prevTotal;
    const percentageDiff =
      prevTotal > 0 ? (absoluteDiff / prevTotal) * 100 : currentTotal > 0 ? 100 : 0;

    // Category-by-category comparison
    const categoryComparisonMap = new Map<string, { current: number; previous: number }>();
    categories.forEach((c) => {
      categoryComparisonMap.set(c.label, { current: 0, previous: 0 });
    });

    currentExpenses.forEach((e) => {
      const cat = e.category || "Other";
      const val = categoryComparisonMap.get(cat) || { current: 0, previous: 0 };
      categoryComparisonMap.set(cat, { ...val, current: val.current + e.amount });
    });

    prevExpenses.forEach((e) => {
      const cat = e.category || "Other";
      const val = categoryComparisonMap.get(cat) || { current: 0, previous: 0 };
      categoryComparisonMap.set(cat, { ...val, previous: val.previous + e.amount });
    });

    const chartData = Array.from(categoryComparisonMap.entries())
      .map(([category, val]) => ({
        category,
        Current: val.current,
        Previous: val.previous,
      }))
      .filter((d) => d.Current > 0 || d.Previous > 0);

    return {
      currentTotal,
      prevTotal,
      absoluteDiff,
      percentageDiff,
      chartData,
    };
  }, [expenses, categories, comparePreset]);

  // --- GENERAL CATEGORY BREAKDOWN ---
  const categoryData = useMemo(() => aggregateCategoryData(expenses, categories), [expenses, categories]);

  // --- TREND BREAKDOWN (Past 30 Days) ---
  const trendsData = useMemo(() => {
    // Generates aggregate trend data over the past 30 days
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 29); // 30 days inclusive

    const dataMap = new Map<string, number>();
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      dataMap.set(d.toISOString().split("T")[0], 0);
    }

    expenses.forEach((e) => {
      const eDate = e.date.toDate();
      if (eDate >= startDate && eDate <= today) {
        const key = eDate.toISOString().split("T")[0];
        if (dataMap.has(key)) {
          dataMap.set(key, (dataMap.get(key) || 0) + e.amount);
        }
      }
    });

    return Array.from(dataMap.entries()).map(([key, amount]) => {
      const date = new Date(key);
      return {
        date: date.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        amount,
      };
    });
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* 🌟 REPORTS SUB-TAB NAVIGATION */}
      <div className="flex bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-1 shadow-md w-full overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: Clock },
          { id: "categories", label: "Categories", icon: PieIcon },
          { id: "trends", label: "Trends", icon: BarChart3 },
          { id: "compare", label: "Compare Periods", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-gray-500 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 🌟 VIEW CONTENT RENDERING */}
      <div className="transition-all duration-300">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-5 shadow-lg">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Spent</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">₹{totals.total.toFixed(2)}</h3>
              </div>
              <div className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-5 shadow-lg">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Average Expense</span>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{totals.avg.toFixed(2)}</h3>
              </div>
              <div className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-5 shadow-lg">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Peak Transaction</span>
                <h3 className="text-2xl font-black text-rose-500 mt-1">₹{totals.highest.toFixed(2)}</h3>
              </div>
              <div className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-5 shadow-lg">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Peak Spending Day</span>
                <h3 className="text-2xl font-black text-amber-500 mt-1">{dayOfWeekStats.peakDay}</h3>
              </div>
            </div>

            {/* Peak Spending Day Bar Graph */}
            <div className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-5 md:p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Spending by Day of Week
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekStats.chartData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => `₹${val}`} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 2. CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-rose-500" />
                  Category Share
                </h3>
                <div className="h-[220px]">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={TAILWIND_COLORS[entry.color] || "#6b7280"}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">No category data logged</div>
                  )}
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                <span className="block text-[10px] font-bold text-gray-400 tracking-wider">TOP CATEGORY</span>
                <span className="text-lg font-black text-slate-800 dark:text-white block mt-1">
                  {categoryData[0]?.name || "None"}
                </span>
                <span className="text-xs text-gray-500">
                  ₹{(categoryData[0]?.value || 0).toFixed(2)} total spending
                </span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Categories Breakdown
              </h3>
              <div className="space-y-4">
                {categoryData.map((item, idx) => {
                  const percentage = totals.total > 0 ? (item.value / totals.total) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="text-gray-900 dark:text-white">
                          ₹{item.value.toFixed(2)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: TAILWIND_COLORS[item.color] || "#6b7280",
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. TRENDS TAB */}
        {activeTab === "trends" && (
          <div className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-5 md:p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Daily Spending Trend (Past 30 Days)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tickFormatter={(val) => `₹${val}`} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: "#6366f1", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 4. COMPARE TAB */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            {/* Compare Preset Select */}
            <div className="flex justify-between items-center gap-4 bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Comparison Period
              </h3>
              <div className="flex p-0.5 bg-gray-100 dark:bg-black/20 rounded-xl">
                {[
                  { value: "month", label: "Month vs Last Month" },
                  { value: "week", label: "Week vs Last Week" },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setComparePreset(preset.value as any)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      comparePreset === preset.value
                        ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Delta Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 dark:bg-white/5 rounded-2xl p-5 shadow-lg">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Current Period Total</span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">₹{comparisonData.currentTotal.toFixed(2)}</h3>
              </div>
              <div className="bg-white border border-gray-200 dark:bg-white/5 rounded-2xl p-5 shadow-lg">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Previous Period Total</span>
                <h3 className="text-2xl font-black text-gray-500 mt-1">₹{comparisonData.prevTotal.toFixed(2)}</h3>
              </div>
              <div className="bg-white border border-gray-200 dark:bg-white/5 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Spending Change</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <h3 className={`text-2xl font-black ${
                      comparisonData.absoluteDiff <= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"
                    }`}>
                      {comparisonData.absoluteDiff <= 0 ? "" : "+"}₹{comparisonData.absoluteDiff.toFixed(0)}
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      comparisonData.absoluteDiff <= 0 ? "bg-green-100 text-green-700 dark:bg-green-950/20" : "bg-red-100 text-red-700 dark:bg-red-950/20"
                    }`}>
                      {comparisonData.percentageDiff.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-2xl ${
                  comparisonData.absoluteDiff <= 0 ? "bg-green-100 dark:bg-green-950/20" : "bg-red-100 dark:bg-red-950/20"
                }`}>
                  {comparisonData.absoluteDiff <= 0 ? (
                    <ArrowDownRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpRight className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Side-by-side bar graph */}
            <div className="bg-white border border-gray-200 dark:bg-white/5 rounded-2xl p-5 md:p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Category Spending Comparison (Grouped)
              </h3>
              {comparisonData.chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.chartData} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="category" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <YAxis tickFormatter={(val) => `₹${val}`} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="Current" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="Previous" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-gray-400">No matching expense data to compare for these periods.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
