import { useMemo, useState } from "react";
import { Trash2, TrendingUp } from "lucide-react";
import type { Income, IncomeSource } from "../../types";
import { deleteIncome } from "../../services/incomeService";
import { incomeDate } from "../../utils/dataMappers";
import { formatCurrency, formatShortDate } from "../../utils/formatters";
import { getIcon } from "../../utils/iconMap";
import { CHART_COLORS } from "../../utils/chartColors";

interface IncomeListProps {
  incomes: Income[];
  sources?: IncomeSource[];
  onDeleted?: (message: string) => void;
}

export default function IncomeList({
  incomes,
  sources = [],
  onDeleted,
}: IncomeListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const totalAmount = incomes.reduce((sum, income) => sum + income.amount, 0);

  const grouped = useMemo(() => {
    const sorted = [...incomes].sort(
      (a, b) => incomeDate(b).getTime() - incomeDate(a).getTime(),
    );
    return sorted.reduce<
      Array<{ label: string; total: number; items: Income[] }>
    >((groups, income) => {
      const date = incomeDate(income);
      const label = date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
      const group = groups.find((item) => item.label === label);
      if (group) {
        group.total += income.amount;
        group.items.push(income);
      } else {
        groups.push({ label, total: income.amount, items: [income] });
      }
      return groups;
    }, []);
  }, [incomes]);

  const bySource = useMemo(() => {
    const totals = new Map<string, number>();
    incomes.forEach((income) =>
      totals.set(
        income.source,
        (totals.get(income.source) || 0) + income.amount,
      ),
    );
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [incomes]);

  const handleDelete = async (id: string) => {
    if (id.startsWith("temp-")) {
      alert("You can delete this item once you are back online.");
      return;
    }
    try {
      await deleteIncome(id);
      setPendingDeleteId(null);
      onDeleted?.("Income deleted.");
    } catch {
      onDeleted?.("Failed to delete income. Please try again.");
    }
  };

  if (incomes.length === 0) {
    return (
      <div className="empty-state card">
        <TrendingUp className="empty-state-icon" />
        <p className="empty-state-title">No income logged yet</p>
        <p className="empty-state-desc">
          Log salary, freelance work, or investment income to see your monthly
          inflow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="stat-card">
          <p className="stat-label">Total income this month</p>
          <p className="stat-value amount-positive">
            {formatCurrency(totalAmount)}
          </p>
          <p className="stat-delta stat-delta-positive">
            {incomes.length} entries logged
          </p>
        </div>
        <div className="card">
          <p className="section-label mb-3">Breakdown by source</p>
          <div className="space-y-3">
            {bySource.map(([source, amount]) => {
              const sourceMeta = sources.find(
                (item) => item.name === source || item._id === source,
              );
              const color = sourceMeta?.color ?? CHART_COLORS.income;
              const percentage =
                totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
              return (
                <div key={source}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{source}</span>
                    <span className="tabular-nums">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${percentage}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {grouped.map((group) => (
        <section key={group.label} className="card card-flush overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "var(--bg-card-subtle)" }}
          >
            <p className="section-label">{group.label}</p>
            <p className="text-xs font-semibold amount-positive">
              {formatCurrency(group.total)}
            </p>
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {group.items.map((income) => {
              const source = sources.find(
                (item) =>
                  item.name === income.source || item._id === income.sourceId,
              );
              const Icon = getIcon(source?.icon ?? "TrendingUp");
              const color = source?.color ?? CHART_COLORS.income;
              return (
                <div
                  key={income._id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3"
                >
                  <div
                    className="category-icon-wrap"
                    style={{ background: `${color}22`, color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div
                    className="min-w-0 border-l-2 pl-3"
                    style={{ borderColor: color }}
                  >
                    <p className="truncate text-sm font-semibold">
                      {income.description || income.source}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {income.source} · {formatShortDate(incomeDate(income))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="amount-positive">
                      {formatCurrency(income.amount)}
                    </p>
                    {pendingDeleteId === income._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => income._id && handleDelete(income._id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon-sm"
                        aria-label={`Delete ${income.source}`}
                        onClick={() => setPendingDeleteId(income._id ?? null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
