import { useState } from "react";
import { addIncome } from "../services/incomeService";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../services/authService";
import { Plus, Calendar, IndianRupee, FileText } from "lucide-react";

export default function AddIncomeForm() {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!source.trim()) {
      newErrors.source = "Source is required";
    } else if (source.trim().length < 2) {
      newErrors.source = "Source must be at least 2 characters";
    }

    if (!date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setIsLoading(true);
    try {
      const incomeData = {
        amount: parseFloat(amount),
        source: source.trim(),
        date: Timestamp.fromDate(new Date(date)),
      };

      await addIncome(incomeData);

      // Reset form
      setAmount("");
      setSource("");
      setErrors({});
    } catch (error) {
      console.error("Error adding income:", error);
      setErrors({ submit: "Failed to add income. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-lg md:rounded-xl flex items-center justify-center mr-2 md:mr-3 shadow-lg">
            <Plus className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Log New Income
          </h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300"
      >
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
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-green-300" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErrors({ ...errors, date: "" });
                  }}
                  className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-gray-900 border-gray-200 dark:bg-white/5 dark:text-white dark:placeholder-green-300 ${
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
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-green-300" />
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors({ ...errors, amount: "" });
                  }}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-lg font-semibold bg-white text-gray-900 border-gray-200 dark:bg-white/5 dark:text-white dark:placeholder-green-300 ${
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
            </div>

            {/* Source Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-white">
                Source of Income
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 dark:text-green-300" />
                <input
                  type="text"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setErrors({ ...errors, source: "" });
                  }}
                  placeholder="Salary, Freelance, Investment, etc."
                  className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white text-gray-900 border-gray-200 dark:bg-white/5 dark:text-white dark:placeholder-green-300 ${
                    errors.source
                      ? "border-red-300 bg-red-50 dark:bg-red-500/20"
                      : "border-gray-200 dark:border-white/20"
                  }`}
                  required
                />
              </div>
              {errors.source && (
                <p className="text-red-500 dark:text-red-300 text-xs">
                  {errors.source}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="submit-btn bg-green-600 text-white py-2 md:py-3 px-6 md:px-8 rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center min-w-[120px] md:min-w-[140px] justify-center"
              disabled={!user || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-sm md:text-base">Logging...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span className="text-sm md:text-base">Log Income</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
