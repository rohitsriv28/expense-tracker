import { memo, useMemo } from "react";

import { formatCurrency } from "../../utils/formatters";
import { getIcon } from "../../utils/iconMap";

export interface GroupedTransaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  description: string;
  categoryName: string;
  icon?: string;
  color: string;
  date: Date;
  editCount?: number;
  notes?: string;
}

interface GroupedTransactionListProps {
  transactions: GroupedTransaction[];
  emptyTitle?: string;
  emptyDescription?: string;
  onTransactionClick?: (transaction: GroupedTransaction) => void;
}

function groupLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const key = date.toDateString();
  if (key === today.toDateString()) return "Today";
  if (key === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TransactionRow = memo(function TransactionRow({
  transaction,
  onClick,
}: {
  transaction: GroupedTransaction;
  onClick?: (transaction: GroupedTransaction) => void;
}) {
  const Icon = getIcon(transaction.icon);
  const isExpense = transaction.type === "expense";

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        onClick={() => onClick?.(transaction)}
        className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition hover:[background:var(--status-neutral-bg)]"
        style={{
          background: "var(--bg-card)",
        }}
      >
        <span
          className="category-icon-wrap"
          style={{
            background: `${transaction.color}22`,
            color: transaction.color,
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span
            className="block truncate text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {transaction.description}
          </span>
          <span
            className="block truncate text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            {transaction.categoryName} · {timeLabel(transaction.date)}
            {transaction.editCount && transaction.editCount > 0 ? (
              <span className="italic ml-1 opacity-70">(edited)</span>
            ) : null}
          </span>
          {transaction.notes && (
            <span
              className="block truncate text-xs mt-0.5 italic"
              style={{ color: "var(--text-secondary)" }}
            >
              <span className="font-semibold not-italic opacity-70">
                Notes:
              </span>{" "}
              {transaction.notes}
            </span>
          )}
        </span>
        <span
          className={isExpense ? "amount-negative" : "amount-positive"}
          data-financial
        >
          {isExpense ? "-" : "+"}
          {formatCurrency(transaction.amount)}
        </span>
      </button>
    </div>
  );
});

export default function GroupedTransactionList({
  transactions,
  emptyTitle = "No transactions yet",
  emptyDescription = "Add a transaction to start building your financial timeline.",
  onTransactionClick,
}: GroupedTransactionListProps) {
  const grouped = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    return sorted.reduce<
      Array<{ label: string; total: number; items: GroupedTransaction[] }>
    >((groups, transaction) => {
      const label = groupLabel(transaction.date);
      const group = groups.find((item) => item.label === label);
      if (group) {
        group.items.push(transaction);
        if (transaction.type === "expense") group.total += transaction.amount;
      } else {
        groups.push({
          label,
          total: transaction.type === "expense" ? transaction.amount : 0,
          items: [transaction],
        });
      }
      return groups;
    }, []);
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="empty-state card">
        <div className="empty-state-icon rounded-full [background:var(--status-neutral-bg)]" />
        <div>
          <p className="empty-state-title">{emptyTitle}</p>
          <p className="empty-state-desc">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <section
          key={group.label}
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ background: "var(--bg-card-subtle)" }}
          >
            <p className="section-label">{group.label}</p>
            {group.total > 0 && (
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                {formatCurrency(group.total)} spent
              </p>
            )}
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {group.items.map((transaction) => (
              <TransactionRow
                key={`${transaction.type}-${transaction.id}`}
                transaction={transaction}
                onClick={onTransactionClick}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
