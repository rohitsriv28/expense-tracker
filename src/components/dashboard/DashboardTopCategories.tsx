import { formatCurrency, formatPercent } from "../../utils/formatters";

interface TopCategory {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon: string;
  percentage: number;
}

interface DashboardTopCategoriesProps {
  topCategories: TopCategory[];
  onViewExpenses: (category?: string) => void;
}

export default function DashboardTopCategories({ topCategories, onViewExpenses }: DashboardTopCategoriesProps) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-label">Top categories</p>
          <h2 className="text-lg">Where money went</h2>
        </div>
      </div>
      {topCategories.length === 0 ? (
        <div className="empty-state p-6">
          <p className="empty-state-title">No spending yet</p>
          <p className="empty-state-desc">
            Add expenses this month to see category patterns.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {topCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onViewExpenses(category.name)}
              className="w-full text-left"
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {category.name}
                </span>
                <span
                  className="tabular-nums text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatCurrency(category.amount)} ·{" "}
                  {formatPercent(category.percentage)}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${category.percentage}%`,
                    background: category.color,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
