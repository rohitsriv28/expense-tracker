import { useEffect, useMemo, useRef, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { FileText, IndianRupee, Receipt, Trash2, X } from "lucide-react";
import type { Expense } from "../services/firebase";
import type { Category } from "../services/categoryService";
import type { GoalBudget } from "../services/budgetService";
import {
  addExpense,
  deleteExpense,
  updateExpense,
} from "../services/expenseService";
import { useAuth } from "../services/authService";
import DatePicker from "./DatePicker";
import { cn } from "../utils/cn";
import { categoryHex, expenseDate, findCategory } from "../utils/dataMappers";
import { getIcon } from "../utils/iconMap";
import { recordExpense, getSuggestedCategory } from "../utils/smartDefaults";
import { formatCurrency } from "../utils/formatters";

interface AddExpenseFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSaved?: (message: string) => void;
  categories?: Category[];
  expense?: Expense | null;
  activeGoals?: GoalBudget[];
  onManageCategories?: () => void;
}

interface ExpenseFormErrors {
  amount?: string;
  category?: string;
  date?: string;
  description?: string;
  submit?: string;
}

function evaluateAmount(input: string): number | null {
  if (!/^[\d+\-*/.() ]+$/.test(input)) return null;
  try {
    const result = Function(`"use strict"; return (${input})`)() as unknown;
    if (typeof result === "number" && Number.isFinite(result) && result >= 0) {
      return Math.round(result * 100) / 100;
    }
  } catch {
    return null;
  }
  return null;
}

function toInputDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isExpression(value: string): boolean {
  return /[+\-*/()]/.test(value);
}

export default function AddExpenseForm({
  isOpen,
  onClose,
  onSaved,
  categories = [],
  expense,
  activeGoals = [],
  onManageCategories,
}: AddExpenseFormProps) {
  const { user } = useAuth();
  const amountRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(expense?.id);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen && isOpen !== undefined) return;
    const timer = setTimeout(() => amountRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setDescription(expense.remarks || "");
      setDate(expenseDate(expense));
      setNotes(expense.notes || "");
      setNotesOpen(Boolean(expense.notes));
      const category = findCategory(categories, expense.category);
      setSelectedCategoryId(category?.id ?? expense.category ?? "");
      setSelectedGoalId(expense.goalBudgetId);
    } else {
      setAmount("");
      setDescription("");
      setDate(new Date());
      setNotes("");
      setNotesOpen(false);
      setSelectedCategoryId("");
      setSelectedGoalId(undefined);
      setDeleteConfirm(false);
      setErrors({});
    }
  }, [categories, expense, isOpen]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const evaluatedAmount = useMemo(
    () => (isExpression(amount) ? evaluateAmount(amount) : null),
    [amount],
  );

  const activeGoal = useMemo(() => {
    const day = toInputDate(date);
    return activeGoals.find(
      (goal) => day >= goal.startDate && day <= goal.endDate,
    );
  }, [activeGoals, date]);

  useEffect(() => {
    const suggestion = getSuggestedCategory(description, categories);
    if (suggestion && !selectedCategoryId) setSelectedCategoryId(suggestion.id);
  }, [categories, description, selectedCategoryId]);

  const finalAmount = evaluatedAmount ?? Number(amount);

  const validate = (): boolean => {
    const next: ExpenseFormErrors = {};
    if (!amount.trim()) next.amount = "Amount is required.";
    else if (!Number.isFinite(finalAmount) || finalAmount <= 0)
      next.amount = "Enter an amount greater than 0.";
    else if (String(Math.floor(finalAmount)).length > 10)
      next.amount = "Amount can be at most 10 digits.";

    if (!date) next.date = "Date is required.";
    if (description.length > 100)
      next.description = "Description must be 100 characters or fewer.";
    if (date > new Date())
      next.date = "Future date selected. You can still save it.";

    setErrors(next);
    return !next.amount && !next.description;
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose?.();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !validate()) return;

    setIsSaving(true);
    setErrors({});
    const fallbackDescription =
      description.trim() || selectedCategory?.label || "Expense";
    const payload = {
      amount: finalAmount,
      remarks: fallbackDescription,
      date: Timestamp.fromDate(date),
      editCount: expense?.editCount ?? 0,
      category: selectedCategory?.label || undefined,
      notes: notes.trim() || undefined,
      goalBudgetId: selectedGoalId,
      updatedAt: Timestamp.now(),
      createdAt: expense?.createdAt ?? Timestamp.now(),
    };
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as typeof payload;

    try {
      if (expense?.id) {
        await updateExpense(expense.id, {
          ...sanitizedPayload,
          editCount: (expense.editCount ?? 0) + 1,
        });
        onSaved?.("Expense updated.");
      } else {
        await addExpense(sanitizedPayload);
        recordExpense(
          fallbackDescription,
          selectedCategory?.id ?? "uncategorized",
        );
        onSaved?.("Expense added.");
      }
      onClose?.();
    } catch {
      setErrors({ submit: "Failed to save expense. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!expense?.id) return;
    setIsSaving(true);
    try {
      await deleteExpense(expense.id);
      onSaved?.("Expense deleted.");
      onClose?.();
    } catch {
      setErrors({ submit: "Failed to delete expense. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isOpen === false) return null;

  const form = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Expense</p>
          <h2 className="text-xl">
            {editing ? "Edit Expense" : "Add Expense"}
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            aria-label="Close expense form"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {errors.submit && (
        <div
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--status-expense-border)",
            background: "var(--status-expense-bg)",
            color: "var(--status-expense-text)",
          }}
        >
          {errors.submit}
        </div>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <label
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Category
          </label>
          <div className="flex items-center gap-2">
            {errors.category && (
              <span
                className="text-xs"
                style={{ color: "var(--text-expense)" }}
              >
                {errors.category}
              </span>
            )}
            {onManageCategories && (
              <button
                type="button"
                onClick={onManageCategories}
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--color-primary-500)" }}
              >
                Manage
              </button>
            )}
          </div>
        </div>
        <div
          className={cn(
            "grid grid-cols-4 gap-2 rounded-xl",
            errors.category && "ring-2 ring-[var(--interactive-danger)]",
          )}
        >
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            const color = categoryHex(category);
            const isSelected = selectedCategoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className={cn(
                  "flex min-h-24 flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all",
                  isSelected
                    ? "border-[var(--border-focus)] [background:var(--interactive-primary-subtle)]"
                    : "border-transparent [background:var(--status-neutral-bg)] hover:border-[var(--border-default)]",
                )}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${color}22`, color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className="text-center text-[10px] font-medium leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeGoal && (
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: "var(--status-warning-border)",
            background: "var(--status-warning-bg)",
          }}
        >
          <label
            className="flex items-start gap-3 text-sm"
            style={{ color: "var(--status-warning-text)" }}
          >
            <input
              type="checkbox"
              checked={selectedGoalId === activeGoal.id}
              onChange={(event) =>
                setSelectedGoalId(
                  event.target.checked ? activeGoal.id : undefined,
                )
              }
              className="mt-1"
            />
            <span>
              This looks like it is for {activeGoal.name}. Tag it to that goal?
            </span>
          </label>
        </div>
      )}

      <section>
        <label
          className="mb-2 block text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Amount
        </label>
        <div
          className="flex items-center rounded-xl border px-4 py-2"
          style={{
            borderColor: errors.amount
              ? "var(--interactive-danger)"
              : "var(--border-input)",
            background: "var(--bg-input)",
          }}
        >
          <IndianRupee
            className="h-7 w-7 shrink-0"
            style={{ color: "var(--text-secondary)" }}
          />
          <input
            ref={amountRef}
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setErrors((prev) => ({ ...prev, amount: undefined }));
            }}
            inputMode="decimal"
            placeholder="0.00"
            className="min-w-0 flex-1 bg-transparent text-right text-3xl sm:text-4xl md:text-[2.5rem] font-bold leading-tight tabular-nums outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        {evaluatedAmount !== null && (
          <p
            className="mt-1 text-right text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Result: {formatCurrency(evaluatedAmount)}
          </p>
        )}
        {errors.amount && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-expense)" }}>
            {errors.amount}
          </p>
        )}
      </section>

      <section>
        <label
          className="mb-2 block text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Description
        </label>
        <div className="relative">
          <FileText
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What was this for?"
            maxLength={100}
            className="input pl-9"
          />
        </div>
        {errors.description && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-expense)" }}>
            {errors.description}
          </p>
        )}
      </section>

      <section>
        <label
          className="mb-2 block text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Date
        </label>
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            className="chip"
            onClick={() => setDate(new Date())}
          >
            Today
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setDate(yesterday);
            }}
          >
            Yesterday
          </button>
        </div>
        <DatePicker label="" value={date} onChange={setDate} />
        {errors.date && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-warning)" }}>
            {errors.date}
          </p>
        )}
      </section>

      <section>
        {notesOpen ? (
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => {
              if (!notes.trim()) setNotesOpen(false);
            }}
            rows={3}
            placeholder="Add any details you may want to remember."
            className="input h-auto py-3"
          />
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setNotesOpen(true)}
          >
            Add notes +
          </button>
        )}
      </section>

      <button
        type="submit"
        className="btn btn-primary btn-lg w-full animate-scale-in"
        disabled={!user || isSaving}
      >
        {isSaving ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving...
          </>
        ) : (
          <>
            <Receipt className="h-4 w-4" />
            {editing ? "Save Changes" : "Add Expense"}
          </>
        )}
      </button>

      {editing && (
        <div className="text-center">
          {deleteConfirm ? (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span style={{ color: "var(--text-secondary)" }}>
                Delete this expense?
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--text-expense)" }}
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete expense
            </button>
          )}
        </div>
      )}
    </form>
  );

  if (isOpen === undefined) {
    return <div className="card">{form}</div>;
  }

  return (
    <div
      className="bottom-sheet-backdrop md:flex md:items-center md:justify-center md:p-4"
      onClick={handleClose}
    >
      <div
        className="bottom-sheet md:static md:max-h-[90vh] md:w-full md:max-w-[480px] md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bottom-sheet-handle md:hidden" />
        <div className="px-5 pb-6 pt-2 md:p-6">{form}</div>
      </div>
    </div>
  );
}
