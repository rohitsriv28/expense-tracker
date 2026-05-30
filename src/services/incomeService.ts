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

export interface Income {
  id?: string;
  amount: number;
  source: string;
  date: Timestamp;
  userId: string;
  createdAt?: Timestamp;
}

export const addIncome = async (income: Omit<Income, "userId" | "id">) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userIncomesRef = collection(db, "incomes", user.uid, "userIncomes");

  await addDoc(userIncomesRef, {
    ...income,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });
};

export const deleteIncome = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const incomeRef = doc(db, "incomes", user.uid, "userIncomes", id);
  await deleteDoc(incomeRef);
};

export const getIncomes = (
  userId: string,
  callback: (incomes: Income[]) => void
) => {
  const userIncomesRef = collection(db, "incomes", userId, "userIncomes");
  const q = query(userIncomesRef, orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const incomes = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Income)
      );
      callback(incomes);
    },
    (error: any) => {
      console.error("Error fetching incomes:", error);
      callback([]);
    }
  );
};
