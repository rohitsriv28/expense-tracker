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
  Download,
  PlusCircle,
  BarChart3,
  Wallet,
  Calendar,
  ArrowUpRight,
  Activity,
  CreditCard,
  Target,
  Zap,
  Eye,
  X,
} from "lucide-react";
import {
  getStartOfDay,
  getStartOfWeek,
  getStartOfMonth,
  getStartOfYear,
  toLocalISODateString,
} from "../utils/dateUtils";
import DatePicker from "../components/DatePicker";

// // DatePicker Component
// const DatePicker = ({
//   label,
//   value,
//   onChange,
//   max,
// }: {
//   label: string;
//   value: Date;
//   onChange: (date: Date) => void;
//   max?: Date;
// }) => {
//   return (
//     <div className="flex flex-col">
//       <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
//       <input
//         type="date"
//         value={toLocalISODateString(value)}
//         onChange={(e) => {
//           // Parse as local date
//           const [year, month, day] = e.target.value.split("-").map(Number);
//           const newDate = new Date(year, month - 1, day);
//           onChange(newDate);
//         }}
//         max={max ? toLocalISODateString(max) : undefined}
//         className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//       />
//     </div>
//   );
// };

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

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

  // Calculate stats
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length > 0 ? totalAmount / expenses.length : 0;
  const thisMonthExpenses = expenses.filter((e) => {
    const expenseDate = e.date.toDate();
    const now = new Date();
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    );
  });
  const thisMonthTotal = thisMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <Header onLogout={logout} onExport={handleExport} />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section - Left aligned with refresh on right */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            {/* Left side - Welcome Message */}
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent mb-2">
                    Welcome back,
                  </h1>
                  <h2 className="text-3xl lg:text-4xl font-light text-purple-100">
                    {user?.displayName?.split(" ")[0] || "User"}!
                  </h2>
                </div>
              </div>
              <div className="flex items-center text-purple-300">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  Last synced: {lastSync.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Right side - Refresh Button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleRefresh}
                className="flex items-center px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-lg"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Syncing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => scrollToSection(expenseFormRef)}
              className="group flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:-translate-y-1"
            >
              <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Add Expense
            </button>

            <button
              onClick={() => scrollToSection(expenseListRef)}
              className="group flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-1"
            >
              <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              View Expenses
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
                    <div className="w-20 h-6 bg-white/20 rounded-xl"></div>
                  </div>
                  <div className="w-32 h-10 bg-white/20 rounded-xl mb-3"></div>
                  <div className="w-40 h-6 bg-white/20 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 1. Expense Form */}
            <div ref={expenseFormRef} className="mb-8 scroll-mt-20">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
                <div className="flex items-center mb-6">
                  <PlusCircle className="w-6 h-6 text-emerald-400 mr-3" />
                  <h3 className="text-xl md:text-2xl font-bold text-white">
                    Add New Expense
                  </h3>
                </div>
                <AddExpenseForm />
              </div>
            </div>

            {/* 2. Expense List */}
            <div ref={expenseListRef} className="mb-8 scroll-mt-20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">
                    Recent Transactions
                  </h2>
                </div>
                <div className="text-purple-300 text-sm">
                  {expenses.length}{" "}
                  {expenses.length === 1 ? "transaction" : "transactions"}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                <ExpenseList expenses={expenses} />
              </div>
            </div>

            {/* 3. Spending Analytics */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  Spending Analytics
                </h2>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <InsightsSummary expenses={expenses} />
              </div>
            </div>

            {/* 4. Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {" "}
              <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  Rs.{totalAmount.toLocaleString("en-IN")}
                </div>
                <div className="text-purple-300 text-sm">Total Expenses</div>
              </div>
              <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  Rs.{avgExpense.toFixed(0)}
                </div>
                <div className="text-purple-300 text-sm">Average Expense</div>
              </div>
              <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  Rs.{thisMonthTotal.toLocaleString("en-IN")}
                </div>
                <div className="text-purple-300 text-sm">This Month</div>
              </div>
              <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {expenses.length}
                </div>
                <div className="text-purple-300 text-sm">
                  Total Transactions
                </div>
              </div>
            </div>

            {/* 5. Action Center */}
            {expenses.length > 0 && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Action Center
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button
                    onClick={handleExport}
                    className="group flex items-center justify-center px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-2"
                  >
                    <Download className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                    <div className="text-left">
                      <div className="font-semibold">Export PDF</div>
                      <div className="text-sm opacity-80">Download report</div>
                    </div>
                  </button>

                  <div className="flex items-center justify-center px-8 py-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-lg">
                    <Wallet className="w-6 h-6 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Total Spent</div>
                      <div className="text-lg font-bold">
                        Rs.{totalAmount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center px-8 py-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl shadow-lg">
                    <BarChart3 className="w-6 h-6 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Avg. Expense</div>
                      <div className="text-lg font-bold">
                        Rs.{avgExpense.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {expenses.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  No expenses yet
                </h3>
                <p className="text-purple-300 mb-8 max-w-md mx-auto">
                  Start tracking your expenses by adding your first transaction.
                  It's quick and easy!
                </p>
                <button
                  onClick={() => scrollToSection(expenseFormRef)}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:-translate-y-1"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Your First Expense
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Date Range Modal */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Select Date Range</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => applyPreset("today")}
                className={`${
                  dateRange.preset === "today"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } px-4 py-2 rounded-lg`}
              >
                Today
              </button>
              <button
                onClick={() => applyPreset("week")}
                className={`${
                  dateRange.preset === "week"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } px-4 py-2 rounded-lg`}
              >
                This Week
              </button>
              <button
                onClick={() => applyPreset("month")}
                className={`${
                  dateRange.preset === "month"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } px-4 py-2 rounded-lg`}
              >
                This Month
              </button>
              <button
                onClick={() => applyPreset("year")}
                className={`${
                  dateRange.preset === "year"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } px-4 py-2 rounded-lg`}
              >
                This Year
              </button>
            </div>
            <div className="space-y-4 mb-6">
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
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmExport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
