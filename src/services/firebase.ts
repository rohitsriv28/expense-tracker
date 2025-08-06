import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence with enhanced error handling
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Firestore persistence failed: Multiple tabs open");
  } else if (err.code === "unimplemented") {
    console.warn("Firestore persistence not supported by browser");
  } else {
    console.error("Firestore offline persistence error:", err.code);
  }
});

// Enhanced Expense interface with optional fields for better type safety
export interface Expense {
  id?: string;
  amount: number;
  remarks: string;
  date: Timestamp;
  userId: string;
  editCount: number;
  createdAt?: Timestamp; // Optional: track when expense was created
  updatedAt?: Timestamp; // Optional: track when expense was last updated
  category?: string; 
  tags?: string[]; // Optional: expense tags for better organization
}

// Helper type for creating new expenses (without auto-generated fields)
export type CreateExpenseData = Omit<
  Expense,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Helper type for updating expenses (all fields optional except what's required)
export type UpdateExpenseData = Partial<Omit<Expense, "id" | "userId">> & {
  updatedAt?: Timestamp;
};

// Database structure type for better TypeScript support
export interface DatabaseStructure {
  expenses: {
    [userId: string]: {
      userExpenses: {
        [expenseId: string]: Expense;
      };
    };
  };
}

// Helper function to create timestamps
export const createTimestamp = (date?: Date) => {
  return Timestamp.fromDate(date || new Date());
};

// Helper function to format Firestore paths
export const getExpensePath = (userId: string, expenseId?: string) => {
  const basePath = `expenses/${userId}/userExpenses`;
  return expenseId ? `${basePath}/${expenseId}` : basePath;
};

export default app;
