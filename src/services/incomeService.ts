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
  updateDoc,
  getDocs,
  writeBatch,
  where,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";

export interface Income {
  id?: string;
  amount: number;
  source: string;
  date: Timestamp;
  userId: string;
  createdAt?: Timestamp;
  description?: string;
  sourceId?: string;
  isRecurring?: boolean;
  recurringFrequency?: "weekly" | "biweekly" | "monthly";
  notes?: string;
}

export interface IncomeSource {
  id?: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  frequency: "monthly" | "weekly" | "biweekly" | "irregular";
  expectedAmount?: number;
  createdAt?: Timestamp;
}

export const DEFAULT_INCOME_SOURCES: Array<
  Omit<IncomeSource, "id" | "userId" | "createdAt">
> = [
  { name: "Salary", icon: "Briefcase", color: "#3b82f6", frequency: "monthly" },
  { name: "Freelance", icon: "Code", color: "#8b5cf6", frequency: "irregular" },
  {
    name: "Business",
    icon: "Building2",
    color: "#f59e0b",
    frequency: "monthly",
  },
  {
    name: "Investment",
    icon: "TrendingUp",
    color: "#22c55e",
    frequency: "irregular",
  },
  {
    name: "Rental Income",
    icon: "Home",
    color: "#14b8a6",
    frequency: "monthly",
  },
  {
    name: "Gift / Other",
    icon: "Gift",
    color: "#ec4899",
    frequency: "irregular",
  },
];

export const addIncome = async (income: Omit<Income, "userId" | "id">) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userIncomesRef = collection(db, "users", user.uid, "income");

  await addDoc(userIncomesRef, {
    ...income,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });
};

export const deleteIncome = async (id: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const incomeRef = doc(db, "users", user.uid, "income", id);
  await deleteDoc(incomeRef);
};

export const updateIncome = async (id: string, data: Partial<Income>) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const incomeRef = doc(db, "users", user.uid, "income", id);
  await updateDoc(incomeRef, data);
};

export const getIncomes = (
  userId: string,
  callback: (incomes: Income[]) => void,
) => {
  const userIncomesRef = collection(db, "users", userId, "income");
  const q = query(userIncomesRef, orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const incomes = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Income,
      );
      callback(incomes);
    },
    (error: FirestoreError) => {
      console.error("Error fetching incomes:", error);
      callback([]);
    },
  );
};

export const initializeDefaultIncomeSources = async (
  userId: string,
): Promise<void> => {
  const sourcesRef = collection(db, "users", userId, "incomeSources");
  const snapshot = await getDocs(sourcesRef);
  if (!snapshot.empty) return;

  const batch = writeBatch(db);
  DEFAULT_INCOME_SOURCES.forEach((source) => {
    const sourceRef = doc(sourcesRef);
    batch.set(sourceRef, {
      ...source,
      userId,
      createdAt: Timestamp.now(),
    });
  });
  await batch.commit();
};

export function getIncomeSources(userId: string): Promise<IncomeSource[]>;
export function getIncomeSources(
  userId: string,
  callback: (sources: IncomeSource[]) => void,
): Unsubscribe;
export function getIncomeSources(
  userId: string,
  callback?: (sources: IncomeSource[]) => void,
): Promise<IncomeSource[]> | Unsubscribe {
  const sourcesRef = collection(db, "users", userId, "incomeSources");
  const q = query(
    sourcesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  const mapDocs = (
    docs: Array<{ id: string; data: () => unknown }>,
  ): IncomeSource[] =>
    docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<IncomeSource, "id">),
    }));

  if (callback) {
    return onSnapshot(
      q,
      (snapshot) => callback(mapDocs(snapshot.docs)),
      (error: FirestoreError) => {
        console.error("Error fetching income sources:", error);
        callback([]);
      },
    );
  }

  return getDocs(q).then((snapshot) => mapDocs(snapshot.docs));
}

export const addIncomeSource = async (
  source: Omit<IncomeSource, "id" | "createdAt">,
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const sourcesRef = collection(db, "users", user.uid, "incomeSources");
  const docRef = await addDoc(sourcesRef, {
    ...source,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateIncomeSource = async (
  id: string,
  data: Partial<IncomeSource>,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const sourceRef = doc(db, "users", user.uid, "incomeSources", id);
  await updateDoc(sourceRef, data);
};

export const deleteIncomeSource = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const sourceRef = doc(db, "users", user.uid, "incomeSources", id);
  await deleteDoc(sourceRef);
};
