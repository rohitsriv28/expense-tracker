import { useState } from "react";
import { addBudget } from "../../services/budgetService";
import type { RecurringBudget, GoalBudget } from "../../services/budgetService";
import type { Category } from "../../services/categoryService";
import { useAuth } from "../../services/authService";
import DatePicker from "../ui/DatePicker";
import { categoryHex } from "../../utils/dataMappers";
import { getIcon } from "../../utils/iconMap";
import { toLocalISODateString } from "../../utils/dateUtils";

type CreateMode = "selector" | "recurring" | "goal";

interface BudgetFormSheetProps {
  categories: Category[];
  onSaved?: (message: string) => void;
  onClose: () => void;
}

export default function BudgetFormSheet({
  categories,
  onSaved,
  onClose,
}: BudgetFormSheetProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<CreateMode>("selector");
  const [isSaving, setIsSaving] = useState(false);

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
      onClose();
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
      onClose();
      resetForm();
    } catch {
      onSaved?.("Failed to create goal.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="bottom-sheet-backdrop md:flex md:items-center md:justify-center md:p-4"
      onClick={onClose}
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
                  onChange={(event) => setRecurringAmount(event.target.value)}
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
