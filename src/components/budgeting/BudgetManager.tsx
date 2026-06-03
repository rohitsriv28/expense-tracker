import { useMemo, useState } from "react";
import { CalendarDays, Plus, Target } from "lucide-react";
import type { Budget } from "../../services/budgetService";
import {
  calculateBudgetSummary,
  calculateGoalSummary,
  calculateHealthScore,
  convertLegacyBudget,
  deleteBudget,
  isGoalBudget,
  isRecurringBudget,
} from "../../services/budgetService";
import type { Expense } from "../../services/firebase";
import type { Category } from "../../services/categoryService";
import RecurringBudgetCard from "./RecurringBudgetCard";
import GoalCard from "./GoalCard";
import BudgetFormSheet from "./BudgetFormSheet";

interface BudgetManagerProps {
  budgets: Budget[];
  expenses: Expense[];
  categories?: Category[];
  onSaved?: (message: string) => void;
}

function currentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
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
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const normalizedBudgets = useMemo(
    () => budgets.map(convertLegacyBudget),
    [budgets],
  );
  const recurringBudgets = normalizedBudgets.filter(isRecurringBudget);
  const goalBudgets = normalizedBudgets.filter(isGoalBudget);
  const period = useMemo(currentMonthRange, []);

  const summaries = useMemo(
    () =>
      recurringBudgets.map((budget) =>
        calculateBudgetSummary(budget, expenses, period),
      ),
    [expenses, period, recurringBudgets],
  );
  const goalSummaries = useMemo(
    () => goalBudgets.map((budget) => calculateGoalSummary(budget, expenses)),
    [expenses, goalBudgets],
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
            <h2>Recurring limits</h2>
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
            <p className="empty-state-title">No monthly budgets</p>
            <p className="empty-state-desc">
              Set a category limit and CashFlow will track depletion
              automatically.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setSheetOpen(true)}
            >
              Create budget
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {summaries.map((summary) => (
              <RecurringBudgetCard
                key={summary.budget.id ?? summary.budget.name}
                summary={summary}
                categories={categories}
                expanded={expandedBudgetId === summary.budget.id}
                onToggleExpand={() =>
                  setExpandedBudgetId(
                    expandedBudgetId === summary.budget.id
                      ? null
                      : (summary.budget.id ?? summary.budget.name),
                  )
                }
                pendingDeleteId={pendingDeleteId}
                setPendingDeleteId={setPendingDeleteId}
                onDelete={handleDelete}
                daysLeftInMonth={daysLeftInMonth()}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Goals & Trips</p>
            <h2>One-time envelopes</h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add Goal
          </button>
        </div>

        {goalSummaries.length === 0 ? (
          <div className="empty-state card">
            <CalendarDays className="empty-state-icon" />
            <p className="empty-state-title">No goals yet</p>
            <p className="empty-state-desc">
              Create a trip, purchase, or event budget to keep it separate from
              monthly spending.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {goalSummaries.map((summary) => (
              <GoalCard
                key={summary.budget.id ?? summary.budget.name}
                summary={summary}
                pendingDeleteId={pendingDeleteId}
                setPendingDeleteId={setPendingDeleteId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {sheetOpen && (
        <BudgetFormSheet
          categories={categories}
          onSaved={onSaved}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
