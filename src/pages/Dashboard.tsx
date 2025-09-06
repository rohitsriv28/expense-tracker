import { useEffect, useState, useRef } from "react";
import { useAuth } from "../services/authService";
import type { Expense } from "../services/firebase";
import Header from "../components/Header";
import { getExpenses } from "../services/expenseService";
import AddExpenseForm from "../components/AddExpenseForm";
import InsightsSummary from "../components/InsightsSummary";
import ExpenseList from "../components/ExpenseList";
import { generateExpensePDF } from "../services/pdfExport";
import {
  Sparkles,
  TrendingUp,
  Clock,
  RefreshCw,
  Plus,
  List,
} from "lucide-react";
import {
  getStartOfDay,
  getStartOfWeek,
  getStartOfMonth,
  getStartOfYear,
} from "../utils/dateUtils";
import DatePicker from "../components/DatePicker";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
    preset?: string;
  }>({
    start: new Date(),
    end: new Date(),
  });
  const [activeTab, setActiveTab] = useState<"add" | "list">("add");

  // Refs for smooth scrolling
  const expenseFormRef = useRef<HTMLDivElement>(null);
  const expenseListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const unsubscribe = getExpenses(user.uid, (newExpenses) => {
      setExpenses(newExpenses);
      setIsLoading(false);
      setLastSync(new Date());
    });

    return () => unsubscribe();
  }, [user]);

  const handleExport = async () => {
    setIsDateModalOpen(true);
  };

  const confirmExport = async () => {
    setIsDateModalOpen(false);
    try {
      if (expenses.length === 0) {
        alert("No expenses to export");
        return;
      }

      const pdfBytes = await generateExpensePDF(
        expenses,
        undefined,
        "Expense Report",
        {
          start: dateRange.start,
          end: dateRange.end,
        }
      );
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expenses-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setLastSync(new Date());
    setTimeout(() => setIsLoading(false), 1000);
  };

  const applyPreset = (preset: "today" | "week" | "month" | "year") => {
    const now = new Date();
    let start: Date;

    switch (preset) {
      case "today":
        start = getStartOfDay(now);
        break;
      case "week":
        start = getStartOfWeek(now);
        break;
      case "month":
        start = getStartOfMonth(now);
        break;
      case "year":
        start = getStartOfYear(now);
        break;
      default:
        start = now;
    }

    setDateRange({
      start,
      end: now,
      preset,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <Header onLogout={logout} onExport={handleExport} />

      <div className="relative z-10 container mx-auto px-3 py-6 max-w-7xl">
        {/* Welcome Section - Made more compact */}
        <div className="mb-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                    Welcome back, {user?.displayName?.split(" ")[0] || "User"}!
                  </h1>
                  <div className="flex items-center text-purple-300 text-xs md:text-sm">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span>Last synced: {lastSync.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg text-sm md:text-base"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-3 h-3 md:w-4 md:h-4 mr-1 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              {isLoading ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Mobile tabs for Add/List view */}
        <div className="md:hidden mb-4">
          <div className="flex bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "add"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-purple-200 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Expense
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "list"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-purple-200 hover:text-white"
              }`}
            >
              <List className="w-4 h-4 mr-1" />
              View List
            </button>
          </div>
        </div>

        {/* 1. PRIORITY: Add Expense Form at the top */}
        <div
          ref={expenseFormRef}
          className={`mb-6 scroll-mt-20 ${
            activeTab !== "add" ? "hidden md:block" : ""
          }`}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-5 shadow-2xl">
            <AddExpenseForm />
          </div>
        </div>

        {/* 2. PRIORITY: Expense List immediately below */}
        <div
          ref={expenseListRef}
          className={`mb-6 scroll-mt-20 ${
            activeTab !== "list" ? "hidden md:block" : ""
          }`}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <ExpenseList expenses={expenses} />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-2xl"></div>
                    <div className="w-16 h-5 md:w-20 md:h-6 bg-white/20 rounded-xl"></div>
                  </div>
                  <div className="w-24 h-7 md:w-32 md:h-10 bg-white/20 rounded-xl mb-3"></div>
                  <div className="w-32 h-5 md:w-40 md:h-6 bg-white/20 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 3. Spending Analytics */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-purple-300 mr-2" />
                <h2 className="text-lg md:text-xl font-bold text-white">
                  Spending Analytics
                </h2>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-6 shadow-2xl">
                <InsightsSummary expenses={expenses} />
              </div>
            </div>

            {/* Empty State */}
            {expenses.length === 0 && (
              <div className="text-center py-8 md:py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  No expenses yet
                </h3>
                <p className="text-purple-300 mb-6 max-w-md mx-auto text-xs md:text-sm">
                  Start tracking your expenses by adding your first transaction.
                  It's quick and easy!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Date Range Modal */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-4">
              Select Date Range
            </h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              <button
                onClick={() => applyPreset("today")}
                className={`${
                  dateRange.preset === "today"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } px-3 py-2 text-sm md:text-base rounded-lg`}
              >
                Today
              </button>
              <button
                onClick={() => applyPreset("week")}
                className={`${
                  dateRange.preset === "week"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } px-3 py-2 text-sm md:text-base rounded-lg`}
              >
                This Week
              </button>
              <button
                onClick={() => applyPreset("month")}
                className={`${
                  dateRange.preset === "month"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } px-3 py-2 text-sm md:text-base rounded-lg`}
              >
                This Month
              </button>
              <button
                onClick={() => applyPreset("year")}
                className={`${
                  dateRange.preset === "year"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } px-3 py-2 text-sm md:text-base rounded-lg`}
              >
                This Year
              </button>
            </div>
            <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
              <DatePicker
                label="Start Date"
                value={dateRange.start}
                onChange={(d) =>
                  setDateRange((prev) => ({ ...prev, start: d }))
                }
                max={new Date()}
              />
              <DatePicker
                label="End Date"
                value={dateRange.end}
                onChange={(d) => setDateRange((prev) => ({ ...prev, end: d }))}
                max={new Date()}
              />
            </div>
            <div className="flex justify-end space-x-2 md:space-x-3">
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmExport}
                className="px-3 py-2 text-sm md:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
