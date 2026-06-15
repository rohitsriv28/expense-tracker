import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  ReceiptIndianRupee,
} from "lucide-react";
import type { Expense } from "../../types";
import type { Category } from "../../types";
import { expenseDate, resolveExpenseVisuals } from "../../utils/dataMappers";
import { formatCurrency } from "../../utils/formatters";
import { useAlert } from "../../contexts/AlertContext";
import GroupedTransactionList, {
  type GroupedTransaction,
} from "./GroupedTransactionList";

const PAGE_TARGET = 20; // target items per page (flexible to keep date groups intact)
const ORPHAN_THRESHOLD = 5; // pull trailing groups into current page if ≤ this many items

interface ExpenseListProps {
  expenses: Expense[];
  categories?: Category[];
  hasMore: boolean;
  onNextPage: () => void;
  onPrevPage?: () => void;
  currentPage: number;
  isFirstPage: boolean;
  onEditExpense?: (expense: Expense) => void;
  onDeleted?: (message: string) => void;
  searchQuery?: string;
}

type SortMode = "newest" | "oldest" | "amountHigh" | "amountLow";

/** Returns a stable date key (YYYY-MM-DD) for grouping. */
function dateKey(expense: Expense): string {
  const d = expenseDate(expense);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Build page boundaries so no date group is split across pages.
 * Returns an array of [startIndex, endIndex) tuples.
 */
function buildDateAwarePages(expenses: Expense[]): Array<[number, number]> {
  if (expenses.length === 0) return [];

  // 1. Identify contiguous date groups as [start, end) ranges
  const groups: Array<[number, number]> = [];
  let groupStart = 0;
  for (let i = 1; i <= expenses.length; i++) {
    if (
      i === expenses.length ||
      dateKey(expenses[i]) !== dateKey(expenses[groupStart])
    ) {
      groups.push([groupStart, i]);
      groupStart = i;
    }
  }

  // 2. Fill pages with whole groups, targeting PAGE_TARGET items
  const pages: Array<[number, number]> = [];
  let pageStart = 0;
  let itemCount = 0;
  let groupIdx = 0;

  while (groupIdx < groups.length) {
    const [gStart, gEnd] = groups[groupIdx];
    const groupSize = gEnd - gStart;

    if (itemCount === 0) {
      // Always include at least one group per page
      itemCount += groupSize;
      groupIdx++;
      continue;
    }

    if (itemCount + groupSize <= PAGE_TARGET) {
      // Fits within target — include it
      itemCount += groupSize;
      groupIdx++;
      continue;
    }

    // Adding this group would exceed target.
    // Check if remaining items (after current page) form a small orphan tail
    const remainingAfterPage = expenses.length - (pageStart + itemCount);
    if (remainingAfterPage <= ORPHAN_THRESHOLD) {
      // Pull everything into this page to avoid a tiny last page
      itemCount = expenses.length - pageStart;
      groupIdx = groups.length;
      continue;
    }

    // Close current page, start a new one
    pages.push([pageStart, pageStart + itemCount]);
    pageStart = pageStart + itemCount;
    itemCount = 0;
    // Don't increment groupIdx — re-evaluate this group for the new page
  }

  // Final page
  if (itemCount > 0) {
    pages.push([pageStart, pageStart + itemCount]);
  }

  return pages;
}

export default function ExpenseList({
  expenses,
  categories = [],
  onEditExpense,
  onDeleted,
  searchQuery = "",
}: ExpenseListProps) {
  const { showAlert } = useAlert();
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the underlying data or filters change
  const filteredExpenses = useMemo(() => {
    setPage(1);
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matching = normalizedQuery
      ? expenses.filter((expense) =>
          `${expense.remarks} ${expense.category ?? ""}`
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : expenses;

    return [...matching].sort((a, b) => {
      if (sortMode === "amountHigh") return b.amount - a.amount;
      if (sortMode === "amountLow") return a.amount - b.amount;
      const diff = expenseDate(a).getTime() - expenseDate(b).getTime();
      return sortMode === "oldest" ? diff : -diff;
    });
  }, [expenses, searchQuery, sortMode]);

  const pages = useMemo(
    () => buildDateAwarePages(filteredExpenses),
    [filteredExpenses],
  );

  const totalPages = Math.max(1, pages.length);
  const safePage = Math.min(page, totalPages);
  const [sliceStart, sliceEnd] = pages[safePage - 1] ?? [0, 0];

  const paginatedExpenses = useMemo(
    () => filteredExpenses.slice(sliceStart, sliceEnd),
    [filteredExpenses, sliceStart, sliceEnd],
  );

  const transactions = useMemo<GroupedTransaction[]>(
    () =>
      paginatedExpenses.map((expense) => {
        const visuals = resolveExpenseVisuals(
          categories,
          expense.category || "",
        );
        return {
          id: expense._id ?? crypto.randomUUID(),
          type: "expense",
          amount: expense.amount,
          description: expense.remarks || "Expense",
          categoryName: visuals.categoryName,
          icon: visuals.icon,
          color: visuals.color,
          date: expenseDate(expense),
          notes: expense.notes,
        };
      }),
    [categories, paginatedExpenses],
  );

  const total = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl">
            <ReceiptIndianRupee
              className="h-6 w-6"
              style={{ color: "var(--text-expense)" }}
            />
            Expenses
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {formatCurrency(total)} · {filteredExpenses.length} transactions
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <ArrowDownUp
            className="h-4 w-4"
            style={{ color: "var(--text-tertiary)" }}
          />
          <select
            className="input select h-9 w-44"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="newest">Date, newest first</option>
            <option value="oldest">Date, oldest first</option>
            <option value="amountHigh">Amount, highest</option>
            <option value="amountLow">Amount, lowest</option>
          </select>
        </label>
      </div>

      <GroupedTransactionList
        transactions={transactions}
        emptyTitle="No expenses found"
        emptyDescription="Try clearing filters or adding a new expense."
        onTransactionClick={(transaction) => {
          if (transaction.id.startsWith("temp-")) {
            showAlert({
              title: "Offline Restricted",
              message:
                "You can edit this item once you are back online and it has synced.",
              icon: "warning",
            });
            return;
          }
          const expense = expenses.find((item) => item._id === transaction.id);
          if (expense) onEditExpense?.(expense);
        }}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: "var(--bg-card)" }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span
            className="text-sm font-medium tabular-nums"
            style={{ color: "var(--text-secondary)" }}
          >
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
