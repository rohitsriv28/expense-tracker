import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  icon: typeof Wallet;
  tone: "neutral" | "income" | "expense" | "brand";
  children?: ReactNode;
}

export default function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone,
  children,
}: StatCardProps) {
  const toneStyles = {
    neutral: {
      color: "var(--text-primary)",
      background: "var(--status-neutral-bg)",
    },
    income: {
      color: "var(--text-income)",
      background: "var(--status-income-bg)",
    },
    expense: {
      color: "var(--text-expense)",
      background: "var(--status-expense-bg)",
    },
    brand: {
      color: "var(--text-brand)",
      background: "var(--interactive-primary-subtle)",
    },
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="stat-label">{label}</p>
          <p
            className="stat-value"
            style={{ color: toneStyles[tone].color }}
            data-financial
          >
            {value}
          </p>
          {delta && (
            <p
              className="stat-delta"
              style={{ color: "var(--text-secondary)" }}
            >
              {delta}
            </p>
          )}
        </div>
        <div className="rounded-lg p-2.5" style={toneStyles[tone]}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </div>
  );
}
