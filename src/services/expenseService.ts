import { db, auth } from "./firebase";
import type { Expense } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";

export const addExpense = async (expense: Omit<Expense, "userId" | "id">) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  await addDoc(collection(db, "expenses"), {
    ...expense,
    userId: user.uid,
  });
};

export const updateExpense = async (id: string, data: Partial<Expense>) => {
  await updateDoc(doc(db, "expenses", id), data);
};

export const getExpenses = (
  userId: string,
  callback: (expenses: Expense[]) => void
) => {
  const q = query(collection(db, "expenses"), where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Expense)
    );
    callback(expenses);
  });
};

export const exportToPDF = async (expenses: Expense[]) => {
  // Implementation would go here
  console.log("Exporting expenses to PDF", expenses);
};
