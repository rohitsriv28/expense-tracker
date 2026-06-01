import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  writeBatch,
  getDocs,
} from "firebase/firestore";

export interface Category {
  id: string;
  label: string;
  color: string; // Tailwind class or hex
  icon?: string; // Icon name from lucide-react (stored as string)
  type: "default" | "custom";
  isArchived?: boolean;
}

// Default categories to initialize for new users
export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  {
    label: "Food & Drink",
    color: "bg-orange-600",
    type: "default",
    icon: "Coffee",
  },
  { label: "Transport", color: "bg-slate-600", type: "default", icon: "Car" },
  {
    label: "Shopping",
    color: "bg-rose-600",
    type: "default",
    icon: "ShoppingBag",
  },
  { label: "Bills", color: "bg-emerald-600", type: "default", icon: "Home" },
  {
    label: "Entertainment",
    color: "bg-red-600",
    type: "default",
    icon: "Gamepad2",
  },
  { label: "Healthcare", color: "bg-red-400", type: "default", icon: "Heart" },
  {
    label: "Other",
    color: "bg-slate-500",
    type: "default",
    icon: "MoreHorizontal",
  },
];

export const getCategories = (
  userId: string,
  callback: (categories: Category[]) => void,
) => {
  const categoriesRef = collection(db, "users", userId, "categories");

  return onSnapshot(
    categoriesRef,
    (snapshot) => {
      const categories = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Category[];

      const active = categories.filter((c) => c.isArchived !== true);

      if (active.length > 0) {
        callback(active);
      } else {
        // Firestore collection is empty — use hardcoded defaults so the UI
        // always shows categories even when initializeDefaultCategories fails
        // (e.g. due to permission rules or network issues).
        const fallback: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
          ...c,
          id: `default-${i}`,
          isArchived: false,
        }));
        callback(fallback);
      }
    },
    (error) => {
      console.error("Error fetching categories:", error);
      // Return defaults on error so the app remains usable
      const fallback: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
        ...c,
        id: `default-${i}`,
        isArchived: false,
      }));
      callback(fallback);
    },
  );
};

export const initializeDefaultCategories = async (userId: string) => {
  const categoriesRef = collection(db, "users", userId, "categories");
  const snapshot = await getDocs(categoriesRef);

  if (!snapshot.empty) return; // Already initialized

  const batch = writeBatch(db);
  DEFAULT_CATEGORIES.forEach((cat) => {
    const docRef = doc(categoriesRef);
    batch.set(docRef, { ...cat, isArchived: false });
  });

  await batch.commit();
};

export const addCategory = async (
  userId: string,
  category: Omit<Category, "id" | "type">,
) => {
  const categoriesRef = collection(db, "users", userId, "categories");
  await addDoc(categoriesRef, {
    ...category,
    type: "custom",
    isArchived: false,
  });
};

export const updateCategory = async (
  userId: string,
  categoryId: string,
  data: Partial<Category>,
) => {
  const categoryRef = doc(db, "users", userId, "categories", categoryId);
  await updateDoc(categoryRef, data);
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  // We don't actually delete, we archive to preserve history for old expenses
  const categoryRef = doc(db, "users", userId, "categories", categoryId);
  await updateDoc(categoryRef, { isArchived: true });
};
