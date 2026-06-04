import { useState } from "react";
import { addBudget } from "../../services/budgetService";
import type { MonthlyEnvelopeBudget } from "../../services/budgetService";
import { useAuth } from "../../services/authService";

interface BudgetFormSheetProps {
  onSaved?: (message: string, newBudgetId?: string) => void;
  onClose: () => void;
}

export default function BudgetFormSheet({
  onSaved,
  onClose,
}: BudgetFormSheetProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Envelope state
  const currentMonthName = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const [envelopeName, setEnvelopeName] = useState("");
  const [envelopeAmount, setEnvelopeAmount] = useState("");

  const handleCreateEnvelope = async () => {
    const amount = Number(envelopeAmount);
    if (!user || !Number.isFinite(amount) || amount <= 0) return;
    setIsSaving(true);

    const now = new Date();
    const nameToSave = envelopeName.trim() || currentMonthName;

    try {
      const budgetId = await addBudget({
        type: "monthly_envelope",
        name: nameToSave,
        amount,
        month: now.getMonth(),
        year: now.getFullYear(),
        allocations: {},
      } as Omit<MonthlyEnvelopeBudget, "id" | "userId">);

      onSaved?.("Monthly budget created.", budgetId);
      onClose();
    } catch {
      onSaved?.("Failed to create budget.");
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
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">New budget</p>
              <h2>Monthly envelope</h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Total monthly budget
            </span>
            <input
              className="input input-lg text-2xl font-bold"
              inputMode="decimal"
              value={envelopeAmount}
              onChange={(event) => setEnvelopeAmount(event.target.value)}
              placeholder="₹ 0"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Name (Optional)
            </span>
            <input
              className="input"
              value={envelopeName}
              onChange={(event) => setEnvelopeName(event.target.value)}
              placeholder={currentMonthName}
            />
          </label>

          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            You can optionally allocate this budget across specific categories
            after creation.
          </p>

          <button
            type="button"
            className="btn btn-primary btn-lg w-full mt-4"
            disabled={
              isSaving || !envelopeAmount || Number(envelopeAmount) <= 0
            }
            onClick={handleCreateEnvelope}
          >
            Create Budget
          </button>
        </div>
      </div>
    </div>
  );
}
