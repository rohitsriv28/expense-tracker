import { useMemo, useState } from "react";
import { CalendarDays, Plus, Target, Trash2 } from "lucide-react";
import type {
  Budget,
  GoalBudget,
  RecurringBudget,
} from "../../services/budgetService";
import {
  addBudget,
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
import { useAuth } from "../../services/authService";
import DatePicker from "../../components/ui/DatePicker";
import { categoryHex, findCategory } from "../../utils/dataMappers";
import { getIcon } from "../../utils/iconMap";
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
} from "../../utils/formatters";
import { toLocalISODateString } from "../../utils/dateUtils";

interface BudgetManagerProps {
  budgets: Budget[];
  expenses: Expense[];
  categories?: Category[];
  onSaved?: (message: string) => void;
}

type CreateMode = "selector" | "recurring" | "goal";

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
  const { user } = useAuth();
  const [mode, setMode] = useState<CreateMode>("selector");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [recurringAmount, setRecurringAmount] = useState("");
  const [rollover, setRollover] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalEmoji, setGoalEmoji] = useState("🎯");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalStart, setGoalStart] = useState(new Date());
  const [goalEnd, setGoalEnd] = useState(
    new Date(new Date().setDate(new Date().getDate() + 30)),
  );
  const [excludeGoal, setExcludeGoal] = useState(true);

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

  const resetForm = () => {
    setMode("selector");
    setCategoryId("");
    setRecurringAmount("");
    setRollover(false);
    setGoalName("");
    setGoalEmoji("🎯");
    setGoalAmount("");
    setGoalStart(new Date());
    setGoalEnd(new Date(new Date().setDate(new Date().getDate() + 30)));
    setExcludeGoal(true);
  };

  const handleCreateRecurring = async () => {
    const category = categories.find((item) => item.id === categoryId);
    const amount = Number(recurringAmount);
    if (!user || !category || !Number.isFinite(amount) || amount <= 0) return;
    setIsSaving(true);
    try {
      await addBudget({
        type: "recurring",
        name: category.label,
        categoryId: category.label,
        amount,
        period: "monthly",
        rollover,
        rolloverAmount: 0,
      } as Omit<RecurringBudget, "id" | "userId">);
      onSaved?.("Budget created.");
      setSheetOpen(false);
      resetForm();
    } catch {
      onSaved?.("Failed to create budget.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateGoal = async () => {
    const totalAmount = Number(goalAmount);
    if (
      !user ||
      !goalName.trim() ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    )
      return;
    setIsSaving(true);
    try {
      await addBudget({
        type: "goal",
        name: goalName.trim(),
        emoji: goalEmoji,
        totalAmount,
        startDate: toLocalISODateString(goalStart),
        endDate: toLocalISODateString(goalEnd),
        allocations: [],
        excludeFromMonthlyBudgets: excludeGoal,
      } as Omit<GoalBudget, "id" | "userId">);
      onSaved?.("Goal created.");
      setSheetOpen(false);
      resetForm();
    } catch {
      onSaved?.("Failed to create goal.");
    } finally {
      setIsSaving(false);
    }
  };

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
            {summaries.map((summary) => {
              const category = findCategory(
                categories,
                summary.budget.categoryId,
              );
              const Icon = getIcon(category?.icon);
              const color = categoryHex(category);
              const expanded = expandedBudgetId === summary.budget.id;
              return (
                <article
                  key={summary.budget.id ?? summary.budget.name}
                  className="card card-hover"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedBudgetId(
                        expanded
                          ? null
                          : (summary.budget.id ?? summary.budget.name),
                      )
                    }
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
                          <h3 className="truncate text-base">
                            {summary.budget.name}
                          </h3>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {formatCurrency(summary.remaining)} remaining ·{" "}
                            {daysLeftInMonth()} days left
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
                          ↻ {formatCurrency(summary.budget.rolloverAmount)}{" "}
                          rolled over
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
                        <div
                          key={expense.id}
                          className="flex justify-between text-sm"
                        >
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
                    onDelete={handleDelete}
                  />
                </article>
              );
            })}
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
            onClick={() => {
              setSheetOpen(true);
              setMode("goal");
            }}
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
              <article
                key={summary.budget.id ?? summary.budget.name}
                className="card"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{summary.budget.emoji}</span>
                    <div>
                      <h3>{summary.budget.name}</h3>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatShortDate(
                          new Date(`${summary.budget.startDate}T00:00:00`),
                        )}{" "}
                        -{" "}
                        {formatShortDate(
                          new Date(`${summary.budget.endDate}T00:00:00`),
                        )}{" "}
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
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatCurrency(summary.remaining)} remaining · projected to
                  spend {formatCurrency(summary.projectedTotal)}
                </p>
                <DeleteControls
                  id={summary.budget.id}
                  pendingDeleteId={pendingDeleteId}
                  setPendingDeleteId={setPendingDeleteId}
                  onDelete={handleDelete}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      {sheetOpen && (
        <div
          className="bottom-sheet-backdrop md:flex md:items-center md:justify-center md:p-4"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="bottom-sheet md:static md:max-h-[90vh] md:w-full md:max-w-[520px] md:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bottom-sheet-handle md:hidden" />
            <div className="space-y-5 px-5 pb-6 pt-2 md:p-6">
              {mode === "selector" && (
                <>
                  <div>
                    <p className="section-label">Create budget</p>
                    <h2>What do you want to budget for?</h2>
                  </div>
                  <button
                    type="button"
                    className="card w-full text-left"
                    onClick={() => setMode("recurring")}
                  >
                    <p className="font-semibold">Monthly category budget</p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      For regular spending limits.
                    </p>
                  </button>
                  <button
                    type="button"
                    className="card w-full text-left"
                    onClick={() => setMode("goal")}
                  >
                    <p className="font-semibold">Goal or trip budget</p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      For one-time events and envelopes.
                    </p>
                  </button>
                </>
              )}

              {mode === "recurring" && (
                <>
                  <SheetHeader
                    title="Monthly category budget"
                    onBack={() => setMode("selector")}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((category) => {
                      const Icon = getIcon(category.icon);
                      const color = categoryHex(category);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          className={`rounded-xl border-2 p-2 ${categoryId === category.id ? "border-[var(--border-focus)] [background:var(--interactive-primary-subtle)]" : "border-transparent [background:var(--status-neutral-bg)]"}`}
                          onClick={() => setCategoryId(category.id)}
                        >
                          <span
                            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ color, background: `${color}22` }}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="mt-1 block text-xs">
                            {category.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">
                      Limit per month
                    </span>
                    <input
                      className="input input-lg"
                      inputMode="decimal"
                      value={recurringAmount}
                      onChange={(event) =>
                        setRecurringAmount(event.target.value)
                      }
                      placeholder="₹ 0"
                    />
                  </label>
                  <label
                    className="flex items-center justify-between rounded-lg border p-3"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <span>Carry unspent amount to next month</span>
                    <input
                      type="checkbox"
                      checked={rollover}
                      onChange={(event) => setRollover(event.target.checked)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg w-full"
                    disabled={isSaving || !categoryId || !recurringAmount}
                    onClick={handleCreateRecurring}
                  >
                    Create Budget
                  </button>
                </>
              )}

              {mode === "goal" && (
                <>
                  <SheetHeader
                    title="Goal or trip budget"
                    onBack={() => setMode("selector")}
                  />
                  <input
                    className="input input-lg"
                    value={goalName}
                    onChange={(event) => setGoalName(event.target.value)}
                    placeholder="Goa Trip, New Laptop, Wedding Gift..."
                  />
                  <div className="scroll-x flex gap-2">
                    {["🎯", "✈️", "💻", "🏠", "🎁", "🚗", "🎓"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`h-11 w-11 rounded-xl border text-xl ${goalEmoji === emoji ? "border-[var(--border-focus)] [background:var(--interactive-primary-subtle)]" : "border-[var(--border-default)]"}`}
                        onClick={() => setGoalEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input
                    className="input input-lg"
                    inputMode="decimal"
                    value={goalAmount}
                    onChange={(event) => setGoalAmount(event.target.value)}
                    placeholder="Total budget: ₹ 0"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker
                      label="Start date"
                      value={goalStart}
                      onChange={setGoalStart}
                    />
                    <DatePicker
                      label="End date"
                      value={goalEnd}
                      onChange={setGoalEnd}
                      min={goalStart}
                    />
                  </div>
                  <label
                    className="flex items-start justify-between gap-4 rounded-lg border p-3"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <span>
                      <span className="block font-semibold">
                        Exclude from monthly budgets
                      </span>
                      <span
                        className="block text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Goal-tagged expenses will not drain recurring category
                        limits.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={excludeGoal}
                      onChange={(event) => setExcludeGoal(event.target.checked)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg w-full"
                    disabled={isSaving || !goalName || !goalAmount}
                    onClick={handleCreateGoal}
                  >
                    Create Goal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SheetHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="section-label">New budget</p>
        <h2>{title}</h2>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function DeleteControls({
  id,
  pendingDeleteId,
  setPendingDeleteId,
  onDelete,
}: {
  id?: string;
  pendingDeleteId: string | null;
  setPendingDeleteId: (id: string | null) => void;
  onDelete: (id?: string) => void;
}) {
  if (!id) return null;
  return (
    <div
      className="mt-4 border-t pt-3"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {pendingDeleteId === id ? (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>
            Delete this budget?
          </span>
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
            onClick={() => onDelete(id)}
          >
            Delete
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-sm ml-auto"
          style={{ color: "var(--text-expense)" }}
          onClick={() => setPendingDeleteId(id)}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      )}
    </div>
  );
}
