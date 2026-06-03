import { Trash2 } from "lucide-react";

interface DeleteControlsProps {
  id?: string;
  pendingDeleteId: string | null;
  setPendingDeleteId: (id: string | null) => void;
  onDelete: (id?: string) => void;
}

export default function DeleteControls({
  id,
  pendingDeleteId,
  setPendingDeleteId,
  onDelete,
}: DeleteControlsProps) {
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
