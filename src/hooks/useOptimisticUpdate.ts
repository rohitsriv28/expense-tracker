import { useState } from "react";

export function useOptimisticUpdate<T>() {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);

  const add = async (item: T, saveFn: () => Promise<void>): Promise<void> => {
    setError(null);
    setItems((prev) => [item, ...prev]);
    try {
      await saveFn();
    } catch {
      setItems((prev) => prev.filter((current) => current !== item));
      setError("Failed to save. Please try again.");
    }
  };

  const remove = async (
    item: T,
    deleteFn: () => Promise<void>,
  ): Promise<void> => {
    setError(null);
    setItems((prev) => prev.filter((current) => current !== item));
    try {
      await deleteFn();
    } catch {
      setItems((prev) => [...prev, item]);
      setError("Failed to delete. Restored.");
    }
  };

  return { items, setItems, error, add, remove };
}
