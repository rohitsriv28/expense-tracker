import { useState } from "react";
import { addExpense } from "../services/expenseService";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../services/authService";
import {
  Plus,
  Calendar,
  IndianRupee,
  FileText,
  Zap,
  Coffee,
  Car,
  Home,
  ShoppingBag,
  Gamepad2,
  Heart,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const QUICK_CATEGORIES = [
  { icon: Coffee, label: "Food & Drink", color: "bg-orange-500" },
  { icon: Car, label: "Transport", color: "bg-blue-500" },
  { icon: ShoppingBag, label: "Shopping", color: "bg-purple-500" },
  { icon: Home, label: "Bills", color: "bg-green-500" },
  { icon: Gamepad2, label: "Entertainment", color: "bg-red-500" },
  { icon: Heart, label: "Healthcare", color: "bg-pink-500" },
  { icon: MoreHorizontal, label: "Other", color: "bg-gray-500" },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function AddExpenseForm() {
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (parseFloat(amount) > 1000000) {
      newErrors.amount = "Amount seems too high";
    }

    if (!remarks.trim()) {
      newErrors.remarks = "Description is required";
    } else if (remarks.trim().length < 3) {
      newErrors.remarks = "Description must be at least 3 characters";
    }

    if (!date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      if (selectedDate > today) {
        newErrors.date = "Date cannot be in the future";
      } else if (selectedDate < oneYearAgo) {
        newErrors.date = "Date cannot be more than a year ago";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      const expenseData = {
        amount: parseFloat(amount),
        remarks: selectedCategory ? `${selectedCategory}: ${remarks}` : remarks,
        date: Timestamp.fromDate(new Date(date)),
        editCount: 0,
        category: selectedCategory,
        createdAt: Timestamp.now(),
      };

      await addExpense(expenseData);

      // Reset form
      setAmount("");
      setRemarks("");
      setSelectedCategory("");
      setErrors({});

      // Success animation
      const submitBtn = document.querySelector(".submit-btn");
      submitBtn?.classList.add("animate-pulse");
      setTimeout(() => submitBtn?.classList.remove("animate-pulse"), 1000);
    } catch (error) {
      console.error("Error adding expense:", error);
      setErrors({ submit: "Failed to add expense. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setErrors({ ...errors, amount: "" });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(selectedCategory === category ? "" : category);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-lg md:rounded-xl flex items-center justify-center mr-2 md:mr-3 shadow-lg">
            <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Add New Expense
          </h2>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm font-medium transition-colors p-2 bg-white text-gray-700 hover:bg-slate-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 rounded-lg border border-gray-200 dark:border-white/10"
        >
          <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1" />
          {isExpanded ? "Simple" : "Quick"}
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 md:w-4 md:h-4 ml-1" />
          ) : (
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-1" />
          )}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300"
      >
        {/* Quick Categories */}
        {isExpanded && (
          <div className="p-4 md:p-6 bg-slate-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/20">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white mb-3">
              Quick Categories
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {QUICK_CATEGORIES.map((category, index) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.label;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleCategorySelect(category.label)}
                    className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-200 flex flex-col items-center space-y-1 group ${
                      isSelected
                        ? `${category.color} text-white shadow-lg scale-105`
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-slate-50 hover:border-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:border-white/20"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-xs font-medium truncate hidden md:block">
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 md:p-6">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-100 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Date Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-white">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-red-300" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErrors({ ...errors, date: "" });
                  }}
                  className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white text-gray-900 border-gray-200 dark:bg-white/5 dark:text-white dark:placeholder-red-300 ${
                    errors.date
                      ? "border-red-300 bg-red-50 dark:bg-red-500/20"
                      : "border-gray-200 dark:border-white/20"
                  }`}
                  required
                />
              </div>
              {errors.date && (
                <p className="text-red-500 dark:text-red-300 text-xs">
                  {errors.date}
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-white">
                Amount
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-red-300" />
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors({ ...errors, amount: "" });
                  }}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-lg font-semibold bg-white text-gray-900 border-gray-200 dark:bg-white/5 dark:text-white dark:placeholder-red-300 ${
                    errors.amount
                      ? "border-red-300 bg-red-50 dark:bg-red-500/20"
                      : "border-gray-200 dark:border-white/20"
                  }`}
                  required
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 dark:text-red-300 text-xs">
                  {errors.amount}
                </p>
              )}

              {/* Quick Amount Buttons */}
              {isExpanded && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_AMOUNTS.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => handleQuickAmount(quickAmount)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-red-600 rounded-full transition-colors"
                    >
                      ₹{quickAmount}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-white">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-red-300" />
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    setErrors({ ...errors, remarks: "" });
                  }}
                  placeholder="What did you spend on?"
                  className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white text-gray-900 border-gray-200 dark:bg-white/5 dark:text-white dark:placeholder-red-300 ${
                    errors.remarks
                      ? "border-red-300 bg-red-50 dark:bg-red-500/20"
                      : "border-gray-200 dark:border-white/20"
                  }`}
                  required
                />
              </div>
              {errors.remarks && (
                <p className="text-red-500 dark:text-red-300 text-xs">
                  {errors.remarks}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="submit-btn bg-red-600 text-white py-2 md:py-3 px-6 md:px-8 rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center min-w-[120px] md:min-w-[140px] justify-center"
              disabled={!user || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-sm md:text-base">Adding...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span className="text-sm md:text-base">Add Expense</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
