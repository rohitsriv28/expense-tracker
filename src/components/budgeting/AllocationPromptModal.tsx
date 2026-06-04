import type { MonthlyEnvelopeBudget } from "../../services/budgetService";

interface AllocationPromptModalProps {
  budget: MonthlyEnvelopeBudget;
  onAllocateNow: () => void;
  onDoLater: () => void;
}

export default function AllocationPromptModal({
  budget,
  onAllocateNow,
  onDoLater,
}: AllocationPromptModalProps) {
  return (
    <div
      className="bottom-sheet-backdrop md:flex md:items-center md:justify-center md:p-4"
      onClick={onDoLater}
    >
      <div
        className="card max-w-sm w-full mx-auto shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-[var(--interactive-primary-subtle)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-brand)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
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
          </div>
          <h2 className="text-xl font-bold mb-2">Budget Created!</h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            You've set your total spending envelope of{" "}
            <strong>₹{budget.amount.toLocaleString()}</strong> for {budget.name}
            .
            <br />
            <br />
            Would you like to allocate portions of this budget to specific
            categories now?
          </p>

          <div className="flex flex-col gap-3">
            {/* Both options are equally visible per user requirements */}
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={onAllocateNow}
            >
              Allocate now
            </button>
            <button
              type="button"
              className="btn border border-[var(--border-default)] w-full font-semibold"
              onClick={onDoLater}
            >
              Do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
