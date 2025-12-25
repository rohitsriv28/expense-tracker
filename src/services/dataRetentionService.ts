import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
  doc,
} from "firebase/firestore";
import { db, getExpensePath } from "./firebase";

/**
 * Deletes expenses older than 12 months from the current date.
 * Should be called on app initialization or dashboard load.
 */
export const cleanupOldExpenses = async (userId: string): Promise<number> => {
  if (!userId) return 0;

  try {
    // Calculate cutoff date: strict 1 year ago from now.
    // Logic: "After 12 months, the data should vanish".
    // If today is Dec 22 2025, any expense before Dec 22 2024 is > 1 year old.

    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    // Set to start of that day to be precise? timestamp comparison handles time.
    // using Timestamp for Firestore
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const expensesRef = collection(db, getExpensePath(userId));
    const q = query(expensesRef, where("date", "<", cutoffTimestamp));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0;
    }

    // Batch delete (max 500 ops per batch)
    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((document) => {
      batch.delete(doc(db, getExpensePath(userId, document.id)));
      count++;
    });

    await batch.commit();
    console.log(
      `[DataRetention] Cleaned up ${count} expenses older than`,
      cutoffDate
    );

    return count;
  } catch (error) {
    console.error("[DataRetention] Failed to cleanup old expenses:", error);
    return 0;
  }
};
