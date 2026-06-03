import { Target } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { categoryHex, findCategory } from "../../utils/dataMappers";
import type { Category } from "../../services/categoryService";
import type { BudgetPeriodSummary } from "../../services/budgetService";

interface DashboardUrgentBudgetsProps {
  urgentBudgets: BudgetPeriodSummary[];
  categories: Category[];
  onViewBudgets: () => void;
  onSetBudget: () => void;
}

export default function DashboardUrgentBudgets({
  urgentBudgets,
  categories,
  onViewBudgets,
  onSetBudget,
}: DashboardUrgentBudgetsProps) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-label">Budget status</p>
          <h2 className="text-lg">Most urgent</h2>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onViewBudgets}
        >
          View all
        </button>
      </div>
      {urgentBudgets.length === 0 ? (
        <div className="empty-state p-6">
          <Target className="empty-state-icon" />
          <p className="empty-state-title">No budgets set</p>
          <p className="empty-state-desc">
            Create category budgets to keep spending intentional.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSetBudget}
          >
            Set up budgets
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {urgentBudgets.map((summary) => {
            const category = findCategory(
              categories,
              summary.budget.categoryId,
            );
            const color = categoryHex(category);
            return (
              <div
                key={summary.budget.id ?? summary.budget.name}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="category-dot"
                      style={{ background: color }}
                    />
                    <p className="truncate text-sm font-semibold">
                      {summary.budget.name}
                    </p>
                  </div>
                  <p
                    className="text-xs tabular-nums"
                    style={{ color: "var(--text-secondary)" }}
                  >
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
