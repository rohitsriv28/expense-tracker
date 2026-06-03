import { formatCurrency, formatPercent } from "../../utils/formatters";
import { categoryHex, findCategory } from "../../utils/dataMappers";
import { getIcon } from "../../utils/iconMap";
import DeleteControls from "./DeleteControls";
import type { Category } from "../../services/categoryService";
import type { BudgetPeriodSummary } from "../../services/budgetService";

interface RecurringBudgetCardProps {
  summary: BudgetPeriodSummary;
  categories: Category[];
  expanded: boolean;
  onToggleExpand: () => void;
  pendingDeleteId: string | null;
  setPendingDeleteId: (id: string | null) => void;
  onDelete: (id?: string) => void;
  daysLeftInMonth: number;
}

export default function RecurringBudgetCard({
  summary,
  categories,
  expanded,
  onToggleExpand,
  pendingDeleteId,
  setPendingDeleteId,
  onDelete,
  daysLeftInMonth,
}: RecurringBudgetCardProps) {
  const category = findCategory(categories, summary.budget.categoryId);
  const Icon = getIcon(category?.icon);
  const color = categoryHex(category);

  return (
    <article className="card card-hover">
      <button
        type="button"
        className="w-full text-left"
        onClick={onToggleExpand}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="category-icon-wrap"
              style={{ background: `${color}22`, color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base">{summary.budget.name}</h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(summary.remaining)} remaining ·{" "}
                {daysLeftInMonth} days left
              </p>
            </div>
          </div>
          <p className="text-sm font-semibold tabular-nums">
            {formatCurrency(summary.spent)} /{" "}
            {formatCurrency(summary.budget.amount)}
          </p>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${summary.status === "safe" ? "progress-safe" : summary.status === "warning" ? "progress-warn" : "progress-danger"}`}
            style={{
              width: `${Math.min(100, summary.percentage)}%`,
            }}
          />
        </div>
        <div
          className="mt-2 flex items-center justify-between text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>{formatPercent(summary.percentage)}% used</span>
          {summary.budget.rollover && (
            <span>
              ↻ {formatCurrency(summary.budget.rolloverAmount)} rolled over
            </span>
          )}
        </div>
      </button>
      {expanded && (
        <div
          className="mt-4 space-y-2 border-t pt-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {summary.expenses.slice(0, 4).map((expense) => (
            <div key={expense.id} className="flex justify-between text-sm">
              <span className="truncate">{expense.remarks}</span>
              <span className="amount-negative">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
      <DeleteControls
        id={summary.budget.id}
        pendingDeleteId={pendingDeleteId}
        setPendingDeleteId={setPendingDeleteId}
        onDelete={onDelete}
      />
    </article>
  );
}
