import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import type { Category } from "../../services/categoryService";
import { categoryHex } from "../../utils/dataMappers";

export interface ExpenseFilterValue {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  query?: string;
}

interface ExpenseFiltersProps {
  categories: Category[];
  value: ExpenseFilterValue;
  resultCount: number;
  onChange: (filters: ExpenseFilterValue) => void;
  onClear: () => void;
}

export default function ExpenseFilters({
  categories,
  value,
  resultCount,
  onChange,
  onClear,
}: ExpenseFiltersProps) {
  const [query, setQuery] = useState(value.query ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  }, [onChange, value]);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        onChangeRef.current({ ...valueRef.current, query: query || undefined }),
      300,
    );
    return () => clearTimeout(timer);
  }, [query]);

  const activeCount = useMemo(
    () =>
      [
        value.startDate,
        value.endDate,
        value.category && value.category !== "all",
        value.query,
      ].filter(Boolean).length,
    [value],
  );

  const applyPreset = (preset: "today" | "week" | "month" | "lastMonth") => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    if (preset === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    if (preset === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff);
      end = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + 6,
        23,
        59,
        59,
        999,
      );
    }
    if (preset === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    if (preset === "lastMonth") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }
    onChange({ ...value, startDate: start, endDate: end });
    setIsOpen(false);
  };

  const clearAll = () => {
    setQuery("");
    onClear();
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "var(--text-tertiary)" }}
        />
        <input
          className="input pl-9 pr-10"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search transactions"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {resultCount} matching transactions
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={clearAll}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="scroll-x flex gap-2 pb-1">
        <button
          type="button"
          className="chip"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          More{" "}
          {activeCount > 0 && (
            <span className="badge badge-neutral">{activeCount}</span>
          )}
        </button>
        {["today", "week", "month", "lastMonth"].map((preset) => (
          <button
            key={preset}
            type="button"
            className="chip"
            onClick={() =>
              applyPreset(preset as "today" | "week" | "month" | "lastMonth")
            }
          >
            {preset === "today"
              ? "Today"
              : preset === "week"
                ? "This Week"
                : preset === "month"
                  ? "This Month"
                  : "Last Month"}
          </button>
        ))}
        {categories.slice(0, 6).map((category) => (
          <button
            key={category.id}
            type="button"
            className={`chip ${value.category === category.label ? "chip-active" : ""}`}
            onClick={() =>
              onChange({
                ...value,
                category:
                  value.category === category.label
                    ? undefined
                    : category.label,
              })
            }
          >
            <span
              className="category-dot"
              style={{ background: categoryHex(category) }}
            />
            {category.label}
          </button>
        ))}
      </div>

      {isOpen && (
        <div className="card grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold">From</label>
            <DatePicker
              label=""
              value={value.startDate ?? new Date()}
              onChange={(date) => onChange({ ...value, startDate: date })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">To</label>
            <DatePicker
              label=""
              value={value.endDate ?? new Date()}
              onChange={(date) => onChange({ ...value, endDate: date })}
              min={value.startDate}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Category</label>
            <select
              className="input select"
              value={value.category ?? "all"}
              onChange={(event) =>
                onChange({
                  ...value,
                  category:
                    event.target.value === "all"
                      ? undefined
                      : event.target.value,
                })
              }
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.label}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
