import { useMemo, useState, useEffect, useRef } from "react";
import { Plus, Target } from "lucide-react";
import type { Budget } from "../../types";
import {
  calculateHealthScore,
  convertLegacyBudget,
  isMonthlyEnvelopeBudget,
  calculateEnvelopeSummary,
  deleteBudget,
} from "../../services/budgetService";
import type { MonthlyEnvelopeBudget } from "../../types";
import type { Expense } from "../../types";
import type { Category } from "../../types";
import MonthlyEnvelopeCard from "./MonthlyEnvelopeCard";
import BudgetFormSheet from "./BudgetFormSheet";
import AllocationSheet from "./AllocationSheet";
import { useAlert } from "../../hooks/useAlert";

interface BudgetManagerProps {
  budgets: Budget[];
  expenses: Expense[];
  categories?: Category[];
  onSaved?: (message: string) => void;
}

function daysLeftInMonth(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, end.getDate() - now.getDate() + 1);
}

export default function BudgetManager({
  budgets,
  expenses,
  categories = [],
  onSaved,
}: BudgetManagerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [allocationPromptBudgetId, setAllocationPromptBudgetId] = useState<
    string | null
  >(null);
  const [allocationSheetBudgetId, setAllocationSheetBudgetId] = useState<
    string | null
  >(null);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { showAlert } = useAlert();

  const normalizedBudgets = useMemo(
    () => budgets.map(convertLegacyBudget),
    [budgets],
  );
  const monthlyBudgets = normalizedBudgets.filter(isMonthlyEnvelopeBudget);

  const hasCheckedRollover = useRef(false);

  useEffect(() => {
    if (hasCheckedRollover.current) return;
    // Wait until budgets are loaded
    if (budgets.length === 0) return;

    hasCheckedRollover.current = true;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check if we have an envelope for this month
    const hasCurrentMonth = monthlyBudgets.some(
      (b) => b.month === currentMonth && b.year === currentYear,
    );

    if (!hasCurrentMonth) {
      // Find the most recent budget
      const pastBudgets = [...monthlyBudgets].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      const latestPast = pastBudgets[0];
      if (latestPast) {
        // Auto-generate for current month
        import("../../services/budgetService").then(({ addBudget }) => {
          addBudget({
            type: "monthly_envelope",
            name: now.toLocaleString("default", {
              month: "long",
              year: "numeric",
            }),
            amount: latestPast.amount,
            month: currentMonth,
            year: currentYear,
            allocations: { ...latestPast.allocations },
          } as Omit<MonthlyEnvelopeBudget, "_id" | "userId">).catch(
            console.error,
          );
        });
      }
    }
  }, [budgets.length, monthlyBudgets]);

  const summaries = useMemo(
    () =>
      monthlyBudgets.map((budget) =>
        calculateEnvelopeSummary(budget, expenses, categories),
      ),
    [expenses, monthlyBudgets, categories],
  );

  const healthScore = calculateHealthScore(summaries);
  const withinCount = summaries.filter(
    (summary) => summary.status !== "exceeded",
  ).length;

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await deleteBudget(id);
      setPendingDeleteId(null);
      onSaved?.("Budget deleted.");
    } catch {
      onSaved?.("Failed to delete budget.");
    }
  };

  const handleSavedBudget = (msg: string, newId?: string) => {
    onSaved?.(msg);
    if (newId) {
      setAllocationPromptBudgetId(newId);
    }
  };

  useEffect(() => {
    if (allocationPromptBudgetId) {
      const promptBudget = monthlyBudgets.find(
        (b) => b._id === allocationPromptBudgetId,
      );
      if (promptBudget) {
        setAllocationPromptBudgetId(null);
        showAlert({
          title: "Budget Created!",
          icon: "target",
          message: (
            <>
              You've set your total spending envelope of{" "}
              <strong>₹{promptBudget.amount.toLocaleString()}</strong> for{" "}
              {promptBudget.name}.
              <br />
              <br />
              Would you like to allocate portions of this budget to specific
              categories now?
            </>
          ),
          primaryAction: {
            label: "Allocate now",
            onClick: () => {
              setAllocationSheetBudgetId(promptBudget._id!);
            },
          },
          secondaryAction: {
            label: "Do this later",
            onClick: () => {},
          },
        });
      }
    }
  }, [allocationPromptBudgetId, monthlyBudgets, showAlert]);

  return (
    <div className="space-y-6 animate-enter">
      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="section-label">Budget Health</p>
            <h2 className="text-2xl">{healthScore}</h2>
          </div>
          <Target className="h-8 w-8" style={{ color: "var(--text-brand)" }} />
        </div>
        <div className="progress-track mb-3 h-3">
          <div
            className={`progress-fill ${healthScore >= 80 ? "progress-safe" : healthScore >= 60 ? "progress-warn" : "progress-danger"}`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          You are within budget in {withinCount} of {summaries.length}{" "}
          categories.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Monthly Budgets</p>
            <h2>Envelopes</h2>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add Budget
          </button>
        </div>

        {summaries.length === 0 ? (
          <div className="empty-state card">
            <Target className="empty-state-icon" />
            <p className="empty-state-title">No monthly envelopes</p>
            <p className="empty-state-desc">
              Set an overall budget limit for the month, and optionally divide
              it into categories.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setSheetOpen(true)}
            >
              Create envelope
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {summaries.map((summary) => (
              <MonthlyEnvelopeCard
                key={summary.budget._id ?? summary.budget.name}
                summary={summary}
                categories={categories}
                expanded={expandedBudgetId === summary.budget._id}
                onToggleExpand={() =>
                  setExpandedBudgetId(
                    expandedBudgetId === summary.budget._id
                      ? null
                      : (summary.budget._id ?? summary.budget.name),
                  )
                }
                pendingDeleteId={pendingDeleteId}
                setPendingDeleteId={setPendingDeleteId}
                onDelete={handleDelete}
                onEditAllocations={(id) => setAllocationSheetBudgetId(id)}
                daysLeftInMonth={daysLeftInMonth()}
              />
            ))}
          </div>
        )}
      </section>

      {sheetOpen && (
        <BudgetFormSheet
          onSaved={handleSavedBudget}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {allocationSheetBudgetId &&
        (() => {
          const sheetBudget = monthlyBudgets.find(
            (b) => b._id === allocationSheetBudgetId,
          );
          if (!sheetBudget) return null;
          return (
            <AllocationSheet
              budget={sheetBudget}
              categories={categories}
              onSaved={onSaved}
              onClose={() => setAllocationSheetBudgetId(null)}
            />
          );
        })()}
    </div>
  );
}
