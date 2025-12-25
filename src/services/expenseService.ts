import { db, auth } from "./firebase";
import type { Expense } from "./firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  deleteDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";

export const addExpense = async (expense: Omit<Expense, "userId" | "id">) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // New nested path: expenses/{userId}/userExpenses
  const userExpensesRef = collection(db, "expenses", user.uid, "userExpenses");

  await addDoc(userExpensesRef, {
    ...expense,
    userId: user.uid, // Still include for consistency
  });
};

export const updateExpense = async (id: string, data: Partial<Expense>) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Update using nested path
  const expenseRef = doc(db, "expenses", user.uid, "userExpenses", id);
  await updateDoc(expenseRef, data);
};

export const deleteExpense = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Delete using nested path
  const expenseRef = doc(db, "expenses", user.uid, "userExpenses", id);
  await deleteDoc(expenseRef);
};

export interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  sortBy?: "date" | "amount";
  sortDirection?: "asc" | "desc";
}

export const getExpenses = (
  userId: string,
  callback: (expenses: Expense[]) => void,
  filters?: ExpenseFilters
) => {
  const userExpensesRef = collection(db, "expenses", userId, "userExpenses");
  let q = query(userExpensesRef, orderBy("date", "desc"));

  // Apply filters if provided
  if (filters) {
    const constraints: QueryConstraint[] = [];

    // Category filter
    if (filters.category && filters.category !== "all") {
      constraints.push(where("category", "==", filters.category));
    }

    // Date filters
    // Note: Firestore requires a composite index for inequalities on different fields
    // or sorting on different fields.
    // If filter params are simple, client-side filtering might be okay for small datasets
    // but for "Server-Side" request, we push this to query.
    // However, mixing 'where' (category) and 'orderBy' (date) requires index.

    // Ideally we want to let Firestore handle this.
    // Be aware: 'where' on Date + 'orderBy' on Date works fine.
    // 'where' on Category + 'orderBy' on Date needs Index.

    // Let's implement full server-side logic and let user create index if needed.

    if (filters.startDate) {
      constraints.push(where("date", ">=", filters.startDate));
    }

    if (filters.endDate) {
      // Set end of day for end date to include the whole day
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      constraints.push(where("date", "<=", endOfDay));
    }

    // Apply sorting
    // Default is date desc. If we filter by category, we might need category index?
    // Actually, simple queries don't needed it. Composite might.

    // Re-construct query with constraints
    // Note: If we use 'where' on category, we can still orderBy date if index exists.

    q = query(userExpensesRef, ...constraints, orderBy("date", "desc"));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Expense)
      );
      callback(expenses);
    },
    (error) => {
      console.error("Error fetching expenses:", error);
      // If error is 'failed-precondition' (missing index), notify developer/user path
      if (error.code === "failed-precondition") {
        console.error("Missing Firestore Index. Creating link:", error.message);
        // In a real app we might expose this to UI, here we log it.
        // Fallback to empty or previous data?
      }
      callback([]);
    }
  );
};

// Batch operations helper
export const batchUpdateExpenses = async (
  updates: Array<{ id: string; data: Partial<Expense> }>
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const updatePromises = updates.map(({ id, data }) => updateExpense(id, data));

  await Promise.all(updatePromises);
};

export const exportToPDF = async (expenses: Expense[]) => {
  // Implementation would go here
  console.log("Exporting expenses to PDF", expenses);
};

// Utility function to get expense count
export const getExpenseCount = async (userId: string): Promise<number> => {
  return new Promise((resolve) => {
    const userExpensesRef = collection(db, "expenses", userId, "userExpenses");
    const unsubscribe = onSnapshot(
      userExpensesRef,
      (snapshot) => {
        resolve(snapshot.size);
        unsubscribe(); // Unsubscribe after getting the count
      },
      (error) => {
        console.error("Error getting expense count:", error);
        resolve(0);
      }
    );
  });
};
