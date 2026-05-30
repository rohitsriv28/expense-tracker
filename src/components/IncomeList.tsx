import type { Income } from "../services/incomeService";
import { deleteIncome } from "../services/incomeService";
import { formatDate } from "../utils/dateUtils";
import { Calendar, Trash2, TrendingUp, Clock, ReceiptIndianRupee } from "lucide-react";
import { useState } from "react";

interface IncomeListProps {
  incomes: Income[];
}

export default function IncomeList({ incomes }: IncomeListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this income entry?")) return;
    setIsDeleting(id);
    try {
      await deleteIncome(id);
    } catch (error) {
      console.error("Error deleting income:", error);
      alert("Failed to delete income. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const totalAmount = incomes.reduce((sum, income) => sum + income.amount, 0);

  if (incomes.length === 0) {
    return (
      <div className="bg-white border text-center border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-8 shadow-lg dark:shadow-none transition-colors duration-300">
        <div className="bg-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <ReceiptIndianRupee className="w-8 h-8 text-green-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No income logged yet
        </h3>
        <p className="text-gray-500 dark:text-green-300">
          Log your first income source above to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <div className="bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-lg dark:shadow-none transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 rounded-lg p-2">
                <ReceiptIndianRupee className="w-5 h-5 md:w-6 md:h-6 text-green-300" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Income Log
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-500 dark:text-green-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                    {incomes.length} {incomes.length === 1 ? "source" : "sources"}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-green-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                    Total Income: ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-100 border-b border-gray-200 dark:bg-white/10 dark:border-white/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {incomes.map((income) => (
                <tr
                  key={income.id}
                  className="transition-all duration-150 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-50 dark:bg-white/10 rounded-lg p-2">
                        <Calendar className="w-4 h-4 text-green-500 dark:text-green-300" />
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(income.date.toDate())}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {income.source}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₹{income.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(income.id!)}
                      disabled={isDeleting === income.id}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
