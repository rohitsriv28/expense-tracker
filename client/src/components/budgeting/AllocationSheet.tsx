import { useState, useMemo } from "react";
import { updateBudget } from "../../services/budgetService";
import type { MonthlyEnvelopeBudget } from "../../types";
import type { Category } from "../../types";
import { getIcon } from "../../utils/iconMap";
import { categoryHex } from "../../utils/dataMappers";

interface AllocationSheetProps {
  budget: MonthlyEnvelopeBudget;
  categories: Category[];
  onSaved?: (message: string) => void;
  onClose: () => void;
}

export default function AllocationSheet({
  budget,
  categories,
  onSaved,
  onClose,
}: AllocationSheetProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state with string values to allow empty inputs
  // We use the existing allocations from the budget
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [catId, amt] of Object.entries(budget.allocations || {})) {
      if (amt > 0) initial[catId] = String(amt);
    }
    return initial;
  });

  // Calculate current totals
  const totalAllocated = useMemo(() => {
    return Object.values(inputs).reduce((sum, val) => {
      const num = Number(val);
      return sum + (Number.isFinite(num) ? num : 0);
    }, 0);
  }, [inputs]);

  const remaining = budget.amount - totalAllocated;
  const isOverBudget = remaining < 0;

  const handleInputChange = (categoryId: string, value: string) => {
    // Only allow numbers or empty
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
    setInputs((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleSave = async () => {
    if (isOverBudget) return;
    setIsSaving(true);
    try {
      // Build the allocations record, excluding empty/zero values
      const newAllocations: Record<string, number> = {};
      for (const [catId, val] of Object.entries(inputs)) {
        const num = Number(val);
        if (num > 0) {
          newAllocations[catId] = num;
        }
      }

      await updateBudget(budget._id!, { allocations: newAllocations });
      onSaved?.("Allocations saved.");
      onClose();
    } catch {
      onSaved?.("Failed to save allocations.");
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
        className="bottom-sheet flex flex-col md:static md:max-h-[90vh] md:w-full md:max-w-[520px] md:rounded-2xl"
        style={{ maxHeight: "90vh" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bottom-sheet-handle md:hidden shrink-0" />

        {/* Sticky Header with real-time stats */}
        <div
          className="px-5 pt-2 pb-4 border-b shrink-0 bg-[var(--bg-main)] rounded-t-2xl z-10"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-label">Category allocations</p>
              <h2>{budget.name}</h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="bg-[var(--status-neutral-bg)] p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Total Envelope
              </span>
              <span className="font-bold">
                ₹{budget.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Allocated
              </span>
              <span className="font-bold">
                ₹{totalAllocated.toLocaleString()}
              </span>
            </div>
            <div className="h-px w-full bg-[var(--border-default)] my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">Unallocated</span>
              <span
                className={`font-bold ${isOverBudget ? "text-[var(--status-danger)]" : "text-[var(--status-success)]"}`}
              >
                {remaining >= 0
                  ? `₹${remaining.toLocaleString()}`
                  : `-₹${Math.abs(remaining).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable category list */}
        <div className="overflow-y-auto px-5 py-4 space-y-3 flex-1">
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            const color = categoryHex(category);
            const val = inputs[category._id] || "";
            // Calculate if this specific input is causing the overflow
            const numVal = Number(val);
            const wouldBeRemainingWithoutThis =
              budget.amount - (totalAllocated - numVal);
            const isThisFieldInvalid = numVal > wouldBeRemainingWithoutThis;

            return (
              <div key={category._id} className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ color, background: `${color}22` }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 font-medium">{category.name}</div>
                <div className="relative w-32 shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      ₹
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`input w-full pl-7 ${isThisFieldInvalid ? "border-[var(--status-danger)] text-[var(--status-danger)]" : ""}`}
                    placeholder="0"
                    value={val}
                    onChange={(e) =>
                      handleInputChange(category._id, e.target.value)
                    }
                  />
                  {isThisFieldInvalid && (
                    <div className="absolute -bottom-5 right-0 text-[10px] text-[var(--status-danger)] font-medium">
                      Exceeds limit
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky footer action */}
        <div
          className="px-5 py-4 border-t shrink-0 bg-[var(--bg-main)] rounded-b-2xl"
          style={{ borderColor: "var(--border-default)" }}
        >
          <button
            type="button"
            className="btn btn-primary btn-lg w-full"
            disabled={isSaving || isOverBudget}
            onClick={handleSave}
          >
            {isOverBudget ? "Total exceeds budget" : "Save Allocations"}
          </button>
        </div>
      </div>
    </div>
  );
}
