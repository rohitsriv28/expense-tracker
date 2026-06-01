import { useState } from "react";
import { Filter, X, Search } from "lucide-react";
import DatePicker from "./DatePicker";
import type { Category } from "../services/categoryService";

interface FilterBarProps {
  categories: Category[];
  onFilterChange: (filters: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
  }) => void;
  onClear: () => void;
}

export default function FilterBar({
  categories,
  onFilterChange,
  onClear,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleApply = () => {
    onFilterChange({
      startDate,
      endDate,
      category: selectedCategory === "all" ? undefined : selectedCategory,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedCategory("all");
    setStartDate(undefined);
    setEndDate(undefined);
    onClear();
    setIsOpen(false);
  };

  const activeFilters = [
    startDate ? "Date Range" : null,
    selectedCategory !== "all" ? "Category" : null,
  ].filter(Boolean);

  return (
    <div className="mb-6">
      {/* Mobile Toggle & Summary */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center px-4 py-2 rounded-xl border transition-all ${
            isOpen || activeFilters.length > 0
              ? "bg-red-600 text-white border-red-500 shadow-lg"
              : "bg-white text-gray-700 border-gray-200 hover:bg-slate-100 dark:bg-white/10 dark:text-white dark:border-white/20 dark:hover:bg-white/20"
          }`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilters.length > 0 && (
            <span className="ml-2 bg-white/20 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
              {activeFilters.length}
            </span>
          )}
        </button>

        {activeFilters.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-red-300 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-4 bg-white border border-gray-200 dark:bg-white/10 dark:backdrop-blur-xl dark:border-white/20 rounded-2xl p-4 md:p-6 shadow-2xl dark:shadow-2xl animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-white">
                Category
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 text-gray-900 dark:bg-white/5 dark:border-white/20 dark:text-white rounded-xl appearance-none focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option
                    value="all"
                    className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white"
                  >
                    All Categories
                  </option>
                  {categories.map((cat) => (
                    <option
                      key={cat.id}
                      value={cat.label}
                      className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white"
                    >
                      {cat.label}
                    </option>
                  ))}
                </select>
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Date Filters */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-white">
                Start Date
              </label>
              <DatePicker
                label=""
                value={startDate ?? new Date()}
                onChange={(d: Date) => setStartDate(d)}
                max={new Date()}
                placeholder="From..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-white">
                End Date
              </label>
              <DatePicker
                label=""
                value={endDate ?? new Date()}
                onChange={(d: Date) => setEndDate(d)}
                max={new Date()}
                placeholder="To..."
                min={startDate}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
