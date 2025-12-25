import { useEffect, useState, useRef } from "react";
import { useAuth } from "../services/authService";
import type { Expense } from "../services/firebase";
import Header from "../components/Header";
import { getExpenses } from "../services/expenseService";
import AddExpenseForm from "../components/AddExpenseForm";
import InsightsSummary from "../components/InsightsSummary";
import ExpenseList from "../components/ExpenseList";
import SpendingCharts from "../components/SpendingCharts";
import FilterBar from "../components/FilterBar";
import { cleanupOldExpenses } from "../services/dataRetentionService";
import { generateExpensePDF } from "../services/pdfExport";
import {
  Sparkles,
  TrendingUp,
  Clock,
  RefreshCw,
  Plus,
  List,
  FileText,
  Calendar,
} from "lucide-react";
import {
  getStartOfDay,
  getStartOfWeek,
  getStartOfMonth,
  getStartOfYear,
} from "../utils/dateUtils";
import DatePicker from "../components/DatePicker";
import {
  getCategories,
  initializeDefaultCategories,
} from "../services/categoryService";
import type { Category } from "../services/categoryService";
import Footer from "../components/Footer";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Filter State
  const [filters, setFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    category?: string;
  }>({});

  // Refs for smooth scrolling
  const expenseFormRef = useRef<HTMLDivElement>(null);
  const expenseListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    // Run data retention cleanup
    cleanupOldExpenses(user.uid)
      .then((count) => {
        if (count > 0)
          console.log(`[Dashboard] Cleaned up ${count} old expenses`);
      })
      .catch(console.error);

    // Initialize defaults
    initializeDefaultCategories(user.uid);

    // Fetch expenses with filters
    const unsubscribeExpenses = getExpenses(
      user.uid,
      (newExpenses) => {
        setExpenses(newExpenses);
        setIsLoading(false);
        setLastSync(new Date());
      },
      filters
    ); // Pass filters here

    // Fetch categories
    const unsubscribeCategories = getCategories(user.uid, (newCategories) => {
      setCategories(newCategories);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeCategories();
    };
  }, [user, filters]); // Re-run when filters change

  const handleExport = async () => {
    setIsDateModalOpen(true);
  };

  const handleFilterChange = (newFilters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
  }) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
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
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
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
    // Refresh logic handled by re-fetching implicitly, but we can just trigger a mock sync for visual
    setLastSync(new Date());
    setTimeout(() => setIsLoading(false), 800);
  };

  const applyPreset = (
    preset:
      | "today"
      | "yesterday"
      | "week"
      | "month"
      | "lastMonth"
      | "last3Months"
      | "year"
  ) => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (preset) {
      case "today":
        start = getStartOfDay(now);
        break;
      case "yesterday":
        start = new Date(now);
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start = getStartOfWeek(now);
        break;
      case "month":
        start = getStartOfMonth(now);
        break;
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "last3Months":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "year":
        start = getStartOfYear(now);
        break;
      default:
        start = now;
    }

    setDateRange({
      start,
      end,
      preset,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300 flex flex-col">
      <Header onLogout={logout} onExport={handleExport} />

      <div className="relative z-10 container mx-auto px-3 py-6 max-w-7xl flex-grow">
        {/* Welcome Section - Made more compact */}
        <div className="mb-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg shadow-red-500/20">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Welcome back, {user?.displayName?.split(" ")[0] || "User"}!
                  </h1>
                  <div className="flex items-center text-gray-500 dark:text-red-300 text-xs md:text-sm">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span>Last synced: {lastSync.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 text-gray-700 dark:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/20 transition-all duration-300 shadow-lg text-sm md:text-base mr-2"
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
          <div className="flex bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "add"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "text-gray-500 dark:text-red-200 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Expense
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "list"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "text-gray-500 dark:text-red-200 hover:text-gray-900 dark:hover:text-white"
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
          <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-4 md:p-5 shadow-xl dark:shadow-2xl transition-colors duration-300">
            <AddExpenseForm />
          </div>
        </div>

        {/* Filter Bar Integration */}
        <FilterBar
          categories={categories}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        {/* 2. PRIORITY: Expense List immediately below */}
        <div
          ref={expenseListRef}
          className={`mb-6 scroll-mt-20 ${
            activeTab !== "list" ? "hidden md:block" : ""
          }`}
        >
          {/* Charts Section */}
          {!isLoading && expenses.length > 0 && (
            <SpendingCharts expenses={expenses} categories={categories} />
          )}

          <div className="bg-white border text-center border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden transition-colors duration-300">
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
                  className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-3xl p-6 md:p-8 animate-pulse shadow-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 dark:bg-white/20 rounded-2xl"></div>
                    <div className="w-16 h-5 md:w-20 md:h-6 bg-gray-200 dark:bg-white/20 rounded-xl"></div>
                  </div>
                  <div className="w-24 h-7 md:w-32 md:h-10 bg-gray-200 dark:bg-white/20 rounded-xl mb-3"></div>
                  <div className="w-32 h-5 md:w-40 md:h-6 bg-gray-200 dark:bg-white/20 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 3. Spending Analytics Text (Kept as summary) */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Spending Summary
                </h2>
              </div>
              <div className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-2xl dark:shadow-2xl transition-colors duration-300">
                <InsightsSummary expenses={expenses} />
              </div>
            </div>

            {/* Empty State */}
            {expenses.length === 0 && (
              <div className="text-center py-8 md:py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3">
                  No expenses yet
                </h3>
                <p className="text-gray-500 dark:text-red-300 mb-6 max-w-md mx-auto text-xs md:text-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-colors duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-4 md:p-6 shadow-2xl border border-gray-200 dark:border-white/10">
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl mb-6 flex items-start">
              <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-lg mr-3">
                <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Export Expense Report
                </h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Download a detailed PDF summary of your spending for your
                  records.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: "today", label: "Today", icon: Clock },
                { id: "yesterday", label: "Yesterday", icon: Clock },
                { id: "week", label: "This Week", icon: Calendar },
                { id: "month", label: "This Month", icon: Calendar },
                { id: "lastMonth", label: "Last Month", icon: Calendar },
                { id: "last3Months", label: "Last 3 Months", icon: Calendar },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = dateRange.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-red-600 border-red-600 text-white shadow-lg scale-[1.02]"
                        : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        isSelected
                          ? "text-white"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    />
                    <span className="text-xs font-semibold">{p.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 mb-6 pt-4 border-t border-gray-100 dark:border-slate-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(d) =>
                    setDateRange((prev) => ({
                      ...prev,
                      start: d,
                      preset: undefined,
                    }))
                  }
                  max={new Date()}
                />
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(d) =>
                    setDateRange((prev) => ({
                      ...prev,
                      end: d,
                      preset: undefined,
                    }))
                  }
                  max={new Date()}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExport}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
