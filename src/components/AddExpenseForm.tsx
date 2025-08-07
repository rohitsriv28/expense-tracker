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
  Utensils,
  Gamepad2,
  Heart,
  MoreHorizontal,
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Expense</h2>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <Zap className="w-4 h-4 mr-1" />
          {isExpanded ? "Simple Mode" : "Quick Mode"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Quick Categories */}
        {isExpanded && (
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
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
                    className={`p-3 rounded-xl transition-all duration-200 flex flex-col items-center space-y-1 group ${
                      isSelected
                        ? `${category.color} text-white shadow-lg scale-105`
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-xs font-medium truncate">
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-6">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Date Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErrors({ ...errors, date: "" });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    errors.date ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                  required
                />
              </div>
              {errors.date && (
                <p className="text-red-500 text-xs">{errors.date}</p>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Amount
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors({ ...errors, amount: "" });
                  }}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-lg font-semibold ${
                    errors.amount
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  required
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs">{errors.amount}</p>
              )}

              {/* Quick Amount Buttons */}
              {isExpanded && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_AMOUNTS.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => handleQuickAmount(quickAmount)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                    >
                      ₹{quickAmount}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    setErrors({ ...errors, remarks: "" });
                  }}
                  placeholder="What did you spend on?"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    errors.remarks
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  required
                />
              </div>
              {errors.remarks && (
                <p className="text-red-500 text-xs">{errors.remarks}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="submit-btn bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center min-w-[140px] justify-center"
              disabled={!user || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Expense
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
