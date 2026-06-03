import { formatCurrency, formatShortDate } from "../../utils/formatters";
import DeleteControls from "./DeleteControls";
import type { GoalBudgetSummary } from "../../services/budgetService";

interface GoalCardProps {
  summary: GoalBudgetSummary;
  pendingDeleteId: string | null;
  setPendingDeleteId: (id: string | null) => void;
  onDelete: (id?: string) => void;
}

export default function GoalCard({
  summary,
  pendingDeleteId,
  setPendingDeleteId,
  onDelete,
}: GoalCardProps) {
  return (
    <article className="card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{summary.budget.emoji}</span>
          <div>
            <h3>{summary.budget.name}</h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {formatShortDate(
                new Date(`${summary.budget.startDate}T00:00:00`),
              )}{" "}
              -{" "}
              {formatShortDate(new Date(`${summary.budget.endDate}T00:00:00`))}{" "}
              · {summary.daysRemaining} days left
            </p>
          </div>
        </div>
      </div>
      <div className="progress-track mb-2">
        <div
          className={`progress-fill ${summary.status === "on-track" ? "progress-safe" : summary.status === "warning" ? "progress-warn" : "progress-danger"}`}
          style={{ width: `${Math.min(100, summary.percentage)}%` }}
        />
      </div>
      <p className="text-sm font-semibold">
        {formatCurrency(summary.totalSpent)} /{" "}
        {formatCurrency(summary.budget.totalAmount)}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
        {formatCurrency(summary.remaining)} remaining · projected to spend{" "}
        {formatCurrency(summary.projectedTotal)}
      </p>
      <DeleteControls
        id={summary.budget.id}
        pendingDeleteId={pendingDeleteId}
        setPendingDeleteId={setPendingDeleteId}
        onDelete={onDelete}
      />
    </article>
  );
}
