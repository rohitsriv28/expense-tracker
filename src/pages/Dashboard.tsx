import { useEffect, useState, useRef } from "react";
import { useAuth } from "../services/authService";
import type { Expense } from "../services/firebase";
import Header from "../components/Header";
import { getExpenses, getAllExpenses } from "../services/expenseService";
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
  AlertCircle,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  PiggyBank,
  BarChart3,
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
import type { QueryDocumentSnapshot } from "firebase/firestore";
import Footer from "../components/Footer";

// Income and Budget imports
import { getIncomes } from "../services/incomeService";
import type { Income } from "../services/incomeService";
import { getBudgets } from "../services/budgetService";
import type { Budget } from "../services/budgetService";
import AddIncomeForm from "../components/AddIncomeForm";
import IncomeList from "../components/IncomeList";
import BudgetManager from "../components/BudgetManager";
import ReportsSection from "../components/ReportsSection";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
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
  const [activeTab, setActiveTab] = useState<
    "expense" | "income" | "budget" | "list" | "reports"
  >("expense");

  // Filter State
  const [filters, setFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    category?: string;
  }>({});

  // Pagination State
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<
    (QueryDocumentSnapshot | null)[]
  >([]);
  const [queryCursor, setQueryCursor] = useState<QueryDocumentSnapshot | null>(
    null,
  );

  // Unpaginated state for charts
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

  // Error State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    // Reset error on new query
    setErrorMsg(null);

    // Fetch expenses with filters and pagination
    const unsubscribeExpenses = getExpenses(
      user.uid,
      (newExpenses, newLastDoc, newHasMore) => {
        setExpenses(newExpenses);
        setLastDoc(newLastDoc);
        setHasMore(newHasMore);
        setIsLoading(false);
        setLastSync(new Date());
      },
      filters,
      (err) => setErrorMsg(err),
      10,
      queryCursor,
    ); // Pass filters here

    // Fetch categories
    const unsubscribeCategories = getCategories(user.uid, (newCategories) => {
      setCategories(newCategories);
    });

    // Fetch all expenses for charts
    const unsubscribeAllExpenses = getAllExpenses(
      user.uid,
      (newAllExpenses) => {
        setAllExpenses(newAllExpenses);
      },
      filters,
    );

    // Fetch Incomes
    const unsubscribeIncomes = getIncomes(user.uid, (newIncomes) => {
      setIncomes(newIncomes);
    });

    // Fetch Budgets
    const unsubscribeBudgets = getBudgets(user.uid, (newBudgets) => {
      setBudgets(newBudgets);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeCategories();
      unsubscribeAllExpenses();
      unsubscribeIncomes();
      unsubscribeBudgets();
    };
  }, [user, filters, queryCursor]); // Re-run when filters or queryCursor changes

  const handleExport = async () => {
    setIsDateModalOpen(true);
  };

  const handleFilterChange = (newFilters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
  }) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setPageHistory([]);
    setQueryCursor(null);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
    setPageHistory([]);
    setQueryCursor(null);
  };

  const handleNextPage = () => {
    if (hasMore) {
      setPageHistory((prev) => [...prev, queryCursor]);
      setQueryCursor(lastDoc);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newHistory = [...pageHistory];
      const prevCursor = newHistory.pop() || null;
      setPageHistory(newHistory);
      setQueryCursor(prevCursor);
      setCurrentPage((prev) => prev - 1);
    }
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
        },
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
      | "year",
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

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const walletBalance = totalIncome - totalExpenses;

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

        {/* 🌟 PREMIUM STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Income Card */}
          <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-5 shadow-xl flex items-center justify-between transition-all hover:scale-[1.02]">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Total Income
              </p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">
                ₹{totalIncome.toFixed(2)}
              </h3>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-2xl">
              <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-5 shadow-xl flex items-center justify-between transition-all hover:scale-[1.02]">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Total Expenses
              </p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">
                ₹{totalExpenses.toFixed(2)}
              </h3>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-2xl">
              <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-5 shadow-xl flex items-center justify-between transition-all hover:scale-[1.02]">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Remaining Balance
              </p>
              <h3
                className={`text-2xl md:text-3xl font-extrabold mt-1 ${walletBalance >= 0 ? "text-purple-600 dark:text-purple-400" : "text-red-500"}`}
              >
                ₹{walletBalance.toFixed(2)}
              </h3>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-2xl">
              <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* 🌟 TABS FOR ACTION PANELS */}
        <div className="mb-6">
          <div className="flex flex-wrap bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-1.5 gap-1 shadow-md">
            {[
              {
                id: "expense",
                label: "Add Expense",
                icon: Plus,
                activeColor:
                  "bg-red-600 text-white shadow-lg shadow-red-500/20",
              },
              {
                id: "income",
                label: "Add Income",
                icon: ArrowUpRight,
                activeColor:
                  "bg-green-600 text-white shadow-lg shadow-green-500/20",
              },
              {
                id: "budget",
                label: "Set Budget",
                icon: PiggyBank,
                activeColor:
                  "bg-purple-600 text-white shadow-lg shadow-purple-500/20",
              },
              {
                id: "list",
                label: "Expense List & History",
                icon: List,
                activeColor:
                  "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20",
              },
              {
                id: "reports",
                label: "Financial Reports",
                icon: BarChart3,
                activeColor:
                  "bg-amber-500 text-white shadow-lg shadow-amber-500/20",
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isSelected
                      ? tab.activeColor
                      : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 🌟 ACTION PANELS RENDERING */}
        <div className="transition-all duration-300">
          {/* Add Expense Tab */}
          {activeTab === "expense" && (
            <div
              ref={expenseFormRef}
              className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-4 md:p-5 shadow-xl transition-all"
            >
              <AddExpenseForm />
            </div>
          )}

          {/* Add Income Tab */}
          {activeTab === "income" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-4 md:p-5 shadow-xl transition-all">
                <AddIncomeForm />
              </div>
              <IncomeList incomes={incomes} />
            </div>
          )}

          {/* Set Budget Tab */}
          {activeTab === "budget" && (
            <BudgetManager budgets={budgets} expenses={allExpenses} />
          )}

          {/* Financial Reports Tab */}
          {activeTab === "reports" && (
            <ReportsSection expenses={allExpenses} categories={categories} />
          )}

          {/* Expense List Tab */}
          {activeTab === "list" && (
            <div ref={expenseListRef} className="space-y-6">
              <FilterBar
                categories={categories}
                onFilterChange={handleFilterChange}
                onClear={handleClearFilters}
              />

              {errorMsg && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 relative shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                      Error
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      {errorMsg}
                    </p>
                  </div>
                  <button
                    onClick={() => setErrorMsg(null)}
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Charts Section */}
              {!isLoading && allExpenses.length > 0 && (
                <SpendingCharts
                  expenses={allExpenses}
                  categories={categories}
                />
              )}

              <div className="bg-white border text-center border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl shadow-xl overflow-hidden">
                <ExpenseList
                  expenses={expenses}
                  hasMore={hasMore}
                  onNextPage={handleNextPage}
                  onPrevPage={handlePrevPage}
                  currentPage={currentPage}
                  isFirstPage={currentPage === 1}
                />
              </div>

              {/* 3. Spending Analytics Text (Kept as summary) */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    Spending Summary
                  </h2>
                </div>
                <div className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-2xl transition-colors duration-300">
                  <InsightsSummary expenses={allExpenses} />
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
                    Start tracking your expenses by adding your first
                    transaction. It's quick and easy!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
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
