import { useEffect, useMemo, useRef, useState } from "react";
import { IndianRupee, TrendingUp, X } from "lucide-react";
import { addIncome } from "../../services/incomeService";
import type { IncomeSource } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import DatePicker from "../ui/DatePicker";
import { cn } from "../../utils/cn";
import { getIcon } from "../../utils/iconMap";

interface AddIncomeFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSaved?: (message: string) => void;
  sources?: IncomeSource[];
}

interface IncomeFormErrors {
  amount?: string;
  source?: string;
  description?: string;
  submit?: string;
}

const DEFAULT_INCOME_SOURCES: any[] = [
  { name: "Salary", icon: "Briefcase", color: "#3b82f6" },
  { name: "Freelance", icon: "Code", color: "#8b5cf6" },
  { name: "Business", icon: "Building2", color: "#f59e0b" },
  { name: "Investment", icon: "TrendingUp", color: "#22c55e" },
  { name: "Rental Income", icon: "Home", color: "#14b8a6" },
  { name: "Gift / Other", icon: "Gift", color: "#ec4899" },
];

export default function AddIncomeForm({
  isOpen,
  onClose,
  onSaved,
  sources = [],
}: AddIncomeFormProps) {
  const { user } = useAuth();
  const amountRef = useRef<HTMLInputElement>(null);
  const availableSources = useMemo<IncomeSource[]>(
    () =>
      sources.length > 0
        ? sources
        : DEFAULT_INCOME_SOURCES.map((source: any) => ({
            ...source,
            id: source.name,
            userId: user?._id ?? "default",
            createdAt: new Date().toISOString(),
          })),
    [sources, user?._id],
  );
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<
    "weekly" | "biweekly" | "monthly"
  >("monthly");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<IncomeFormErrors>({});

  useEffect(() => {
    if (!isOpen && isOpen !== undefined) return;
    const timer = setTimeout(() => amountRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!selectedSourceId && availableSources[0]?._id) {
      setSelectedSourceId(availableSources[0]._id);
    }
  }, [availableSources, selectedSourceId]);

  const selectedSource = availableSources.find(
    (source) => source._id === selectedSourceId,
  );

  const validate = (): boolean => {
    const next: IncomeFormErrors = {};
    const parsedAmount = Number(amount);
    if (!selectedSource) next.source = "Choose an income source.";
    if (!amount.trim()) next.amount = "Amount is required.";
    else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0)
      next.amount = "Enter an amount greater than 0.";
    if (description.length > 100)
      next.description = "Description must be 100 characters or fewer.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !validate() || !selectedSource) return;

    setIsSaving(true);
    try {
      const payload = {
        amount: Number(amount),
        source: selectedSource.name,
        sourceId: selectedSource._id,
        description: description.trim() || selectedSource.name,
        date: date.toISOString(),
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      };
      const sanitizedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      ) as typeof payload;
      await addIncome(sanitizedPayload);
      setAmount("");
      setDescription("");
      setIsRecurring(false);
      onSaved?.("Income logged.");
      onClose?.();
    } catch {
      setErrors({ submit: "Unable to save changes. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isOpen === false) return null;

  const form = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Income</p>
          <h2 className="text-xl">Log Income</h2>
        </div>
        {onClose && (
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm"
            aria-label="Close income form"
            onClick={onClose}
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
            Income source
          </label>
          {errors.source && (
            <span className="text-xs" style={{ color: "var(--text-expense)" }}>
              {errors.source}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {availableSources.map((source) => {
            const Icon = getIcon(source.icon);
            const selected = selectedSourceId === source._id;
            return (
              <button
                key={source._id}
                type="button"
                onClick={() => setSelectedSourceId(source._id ?? source.name)}
                className={cn(
                  "flex min-h-24 flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all",
                  selected
                    ? "border-[var(--border-focus)] [background:var(--interactive-primary-subtle)]"
                    : "border-transparent [background:var(--status-neutral-bg)] hover:border-[var(--border-default)]",
                )}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: `${source.color}22`,
                    color: source.color,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className="text-center text-[10px] font-medium leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {source.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

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
            style={{ color: "var(--text-income)" }}
          />
          <input
            ref={amountRef}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="min-w-0 flex-1 bg-transparent text-right text-3xl sm:text-4xl md:text-[2.5rem] font-bold leading-tight tabular-nums outline-none"
            style={{ color: "var(--text-income)" }}
          />
        </div>
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
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Salary, client payment, dividend..."
          maxLength={100}
          className="input"
        />
        {errors.description && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-expense)" }}>
            {errors.description}
          </p>
        )}
      </section>

      <DatePicker label="Date" value={date} onChange={setDate} />

      <section
        className="rounded-lg border p-3"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-card-subtle)",
        }}
      >
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold">
              Mark as recurring
            </span>
            <span
              className="block text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Useful for salary and retainers.
            </span>
          </span>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(event) => setIsRecurring(event.target.checked)}
          />
        </label>
        {isRecurring && (
          <select
            value={recurringFrequency}
            onChange={(event) =>
              setRecurringFrequency(
                event.target.value as typeof recurringFrequency,
              )
            }
            className="input select mt-3"
          >
            <option value="monthly">Every month</option>
            <option value="weekly">Every week</option>
            <option value="biweekly">Every two weeks</option>
          </select>
        )}
      </section>

      <button
        type="submit"
        className="btn btn-primary btn-lg w-full"
        disabled={!user || isSaving}
      >
        {isSaving ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving...
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4" />
            Log Income
          </>
        )}
      </button>
    </form>
  );

  if (isOpen === undefined) {
    return <div className="card">{form}</div>;
  }

  return (
    <div
      className="bottom-sheet-backdrop md:flex md:items-center md:justify-center md:p-4"
      onClick={onClose}
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
