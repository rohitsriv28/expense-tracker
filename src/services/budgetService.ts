import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  orderBy,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

export interface Budget {
  id?: string;
  name: string;
  limit: number;
  type: "week" | "month" | "trip";
  startDate: Timestamp;
  endDate: Timestamp;
  userId: string;
  createdAt?: Timestamp;
}

export const addBudget = async (budget: Omit<Budget, "userId" | "id">) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userBudgetsRef = collection(db, "budgets", user.uid, "userBudgets");

  await addDoc(userBudgetsRef, {
    ...budget,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });
};

export const deleteBudget = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const budgetRef = doc(db, "budgets", user.uid, "userBudgets", id);
  await deleteDoc(budgetRef);
};

export const getBudgets = (
  userId: string,
  callback: (budgets: Budget[]) => void
) => {
  const userBudgetsRef = collection(db, "budgets", userId, "userBudgets");
  const q = query(userBudgetsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const budgets = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Budget)
      );
      callback(budgets);
    },
    (error: any) => {
      console.error("Error fetching budgets:", error);
      callback([]);
    }
  );
};
