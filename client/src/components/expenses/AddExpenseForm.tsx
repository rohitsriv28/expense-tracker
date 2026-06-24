import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, IndianRupee, Receipt, X } from "lucide-react";
import type { Expense, Category } from "../../types";
import { addExpense, updateExpense } from "../../services/expenseService";
import { useAuth } from "../../hooks/useAuth";
import { useAlert } from "../../hooks/useAlert";
import DatePicker from "../ui/DatePicker";
import { cn } from "../../utils/cn";
import {
  categoryHex,
  expenseDate,
  findCategory,
} from "../../utils/dataMappers";
import { getIcon } from "../../utils/iconMap";
import { recordExpense, getSuggestedCategory } from "../../utils/smartDefaults";
import { formatCurrency } from "../../utils/formatters";
import { evaluateMathExpression } from "../../utils/mathParser";

interface AddExpenseFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSaved?: (message: string) => void;
  categories?: Category[];
  expense?: Expense | null;
  onManageCategories?: () => void;
}

interface ExpenseFormErrors {
  amount?: string;
  category?: string;
  date?: string;
  description?: string;
  submit?: string;
}

const evaluateAmount = evaluateMathExpression;

function isExpression(value: string): boolean {
  return /[+\-*/()]/.test(value);
}

export default function AddExpenseForm({
  isOpen,
  onClose,
  onSaved,
  categories = [],
  expense,
  onManageCategories,
}: AddExpenseFormProps) {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const amountRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(expense?._id);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ExpenseFormErrors>({});

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
      setSelectedCategoryId(category?._id ?? expense.category ?? "");
    } else {
      setAmount("");
      setDescription("");
      setDate(new Date());
      setNotes("");
      setNotesOpen(false);
      setSelectedCategoryId("");
      setErrors({});
    }
  }, [categories, expense, isOpen]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const evaluatedAmount = useMemo(
    () => (isExpression(amount) ? evaluateAmount(amount) : null),
    [amount],
  );

  useEffect(() => {
    const suggestion = getSuggestedCategory(description, categories);
    if (suggestion && !selectedCategoryId)
      setSelectedCategoryId(suggestion._id);
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
      description.trim() || selectedCategory?.name || "Expense";
    const payload = {
      amount: finalAmount,
      remarks: fallbackDescription,
      date: date.toISOString(),
      category: selectedCategory?._id || selectedCategory?.name || undefined,
      notes: notes.trim() || undefined,
    };
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    ) as typeof payload;

    try {
      if (expense?._id) {
        await updateExpense(expense._id, sanitizedPayload);
        onSaved?.("Expense updated.");
      } else {
        await addExpense(sanitizedPayload);
        recordExpense(
          fallbackDescription,
          selectedCategory?._id ?? "uncategorized",
        );
        onSaved?.("Expense added.");
      }
      onClose?.();
    } catch (error: any) {
      if (error.response?.status === 403) {
        showAlert({
          title: "Edit Limit Reached",
          message:
            error.response?.data?.message ||
            "Maximum edit limit (3) reached for this expense.",
          icon: "error",
        });
        onClose?.();
      } else {
        setErrors({ submit: "Unable to save changes. Please try again." });
      }
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
            const isSelected = selectedCategoryId === category._id;
            return (
              <button
                key={category._id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(category._id);
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
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <label
            className="block text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Amount
          </label>
          {editing && (
            <span
              className="text-xs opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              {(expense?.editCount ?? 0) >= 3 ? (
                <span style={{ color: "var(--interactive-danger)" }}>
                  Max edits reached
                </span>
              ) : (
                `${3 - (expense?.editCount ?? 0)} edit${3 - (expense?.editCount ?? 0) === 1 ? "" : "s"} left`
              )}
            </span>
          )}
        </div>
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

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full animate-scale-in"
          disabled={
            !user || isSaving || (editing && (expense?.editCount ?? 0) >= 3)
          }
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
      </div>
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
