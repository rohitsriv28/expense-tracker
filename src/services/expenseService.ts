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

export const getExpenses = (
  userId: string,
  callback: (expenses: Expense[]) => void
) => {
  // Query the nested collection with ordering
  const userExpensesRef = collection(db, "expenses", userId, "userExpenses");
  const q = query(userExpensesRef, orderBy("date", "desc"));

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
      // Optionally call callback with empty array or handle error
      callback([]);
    }
  );
};

// Enhanced export with date filtering
export const getExpensesByDateRange = (
  userId: string,
  startDate: Date,
  endDate: Date,
  callback: (expenses: Expense[]) => void
) => {
  const userExpensesRef = collection(db, "expenses", userId, "userExpenses");
  const q = query(
    userExpensesRef,
    orderBy("date", "desc")
    // Note: For date range filtering, you might want to add where clauses
    // but this requires composite indexes in Firestore
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Expense))
        .filter((expense) => {
          const expenseDate = expense.date.toDate();
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      callback(expenses);
    },
    (error) => {
      console.error("Error fetching expenses by date range:", error);
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
