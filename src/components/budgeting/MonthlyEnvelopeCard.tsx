import { formatCurrency, formatPercent } from "../../utils/formatters";
import { categoryHex, findCategory } from "../../utils/dataMappers";
import { getIcon } from "../../utils/iconMap";
import DeleteControls from "./DeleteControls";
import type { Category } from "../../services/categoryService";
import type { MonthlyEnvelopeSummary } from "../../services/budgetService";
import { Settings2 } from "lucide-react";

interface MonthlyEnvelopeCardProps {
  summary: MonthlyEnvelopeSummary;
  categories: Category[];
  expanded: boolean;
  onToggleExpand: () => void;
  pendingDeleteId: string | null;
  setPendingDeleteId: (id: string | null) => void;
  onDelete: (id?: string) => void;
  onEditAllocations: (id: string) => void;
  daysLeftInMonth: number;
}

export default function MonthlyEnvelopeCard({
  summary,
  categories,
  expanded,
  onToggleExpand,
  pendingDeleteId,
  setPendingDeleteId,
  onDelete,
  onEditAllocations,
  daysLeftInMonth,
}: MonthlyEnvelopeCardProps) {
  const { budget, unallocated, allocations } = summary;

  return (
    <article className="card">
      <div className="w-full">
        {/* Overall Envelope Status */}
        <div
          className="mb-3 flex items-center justify-between gap-3 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="category-icon-wrap"
              style={{
                background: `var(--interactive-primary-subtle)`,
                color: `var(--text-brand)`,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base">{budget.name}</h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {formatCurrency(summary.remaining)} remaining ·{" "}
                {daysLeftInMonth} days left
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(summary.totalSpent)} /{" "}
              {formatCurrency(budget.amount)}
            </p>
          </div>
        </div>

        <div className="progress-track cursor-pointer" onClick={onToggleExpand}>
          <div
            className={`progress-fill ${summary.status === "safe" ? "progress-safe" : summary.status === "warning" ? "progress-warn" : "progress-danger"}`}
            style={{
              width: `${Math.min(100, summary.percentage)}%`,
            }}
          />
        </div>

        <div
          className="mt-2 flex items-center justify-between text-xs cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
          onClick={onToggleExpand}
        >
          <span>{formatPercent(summary.percentage)}% used</span>
          <span
            className="flex items-center gap-1 hover:text-[var(--text-brand)]"
            onClick={(e) => {
              e.stopPropagation();
              onEditAllocations(budget.id!);
            }}
          >
            <Settings2 className="w-3 h-3" /> Edit allocations
          </span>
        </div>

        {/* Breakdown section */}
        {expanded && (
          <div
            className="mt-5 space-y-4 border-t pt-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h4
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Allocations
            </h4>

            {/* Allocated Categories */}
            {allocations.map((alloc) => {
              const category = findCategory(categories, alloc.categoryId);
              if (!category) return null;
              const Icon = getIcon(category.icon);
              const color = categoryHex(category);

              return (
                <div key={alloc.categoryId} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span style={{ color }}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span>{category.label}</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(alloc.spent)} /{" "}
                      {formatCurrency(alloc.allocated)}
                    </span>
                  </div>
                  <div className="progress-track h-1.5">
                    <div
                      className={`progress-fill ${alloc.status === "safe" ? "progress-safe" : alloc.status === "warning" ? "progress-warn" : "progress-danger"}`}
                      style={{
                        width: `${Math.min(100, alloc.percentage)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Unallocated Pool */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--text-secondary)" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                  </span>
                  <span
                    className="italic"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Unallocated
                  </span>
                </div>
                <span
                  className="font-medium tabular-nums"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatCurrency(unallocated.spent)} /{" "}
                  {formatCurrency(unallocated.amount)}
                </span>
              </div>
              <div className="progress-track h-1.5">
                <div
                  className={`progress-fill ${unallocated.status === "safe" ? "progress-safe" : unallocated.status === "warning" ? "progress-warn" : "progress-danger"}`}
                  style={{
                    width: `${Math.min(100, unallocated.percentage)}%`,
                    backgroundColor: "var(--text-secondary)",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <DeleteControls
          id={budget.id}
          pendingDeleteId={pendingDeleteId}
          setPendingDeleteId={setPendingDeleteId}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}
