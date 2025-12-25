import { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import {
  addCategory,
  deleteCategory,
  getCategories,
  initializeDefaultCategories,
} from "../services/categoryService";
import type { Category } from "../services/categoryService";
import { useAuth } from "../services/authService";
import { ICON_MAP, getIcon } from "../utils/iconMap";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-gray-500",
];

export default function CategoryManager({
  isOpen,
  onClose,
}: CategoryManagerProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New category form state
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(AVAILABLE_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState("MoreHorizontal");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    // Initialize defaults if needed
    initializeDefaultCategories(user.uid);

    const unsubscribe = getCategories(user.uid, (cats) => {
      setCategories(cats);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCatName.trim()) return;

    setIsAdding(true);
    setError("");

    try {
      // limit label length
      if (newCatName.length > 20) {
        throw new Error("Category name too long (max 20 chars)");
      }

      await addCategory(user.uid, {
        label: newCatName.trim(),
        color: newCatColor,
        icon: newCatIcon,
      });
      setNewCatName("");
      // Reset to defaults
      setNewCatColor(
        AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]
      );
    } catch (err) {
      console.error("Error adding category:", err);
      setError((err as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (catId: string) => {
    if (!user || !confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await deleteCategory(user.uid, catId);
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  if (!isOpen) return null;

  // Helper to render icon dynamically
  const renderIcon = (iconName: string, className: string) => {
    const IconComponent = getIcon(iconName);
    return <IconComponent className={className} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in border border-gray-200 dark:border-white/10 transition-colors duration-300">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-slate-100 dark:bg-white/5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Manage Categories
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
          {/* Add New Category Section */}
          <section className="bg-red-50/50 dark:bg-white/5 p-4 md:p-5 rounded-xl border border-red-100 dark:border-white/10">
            <h3 className="text-sm font-semibold text-red-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create New Category
            </h3>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g., Gym, Netflix..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    maxLength={20}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color} ${
                          newCatColor === color
                            ? "ring-2 ring-offset-2 ring-red-600 scale-110"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-600 h-24 overflow-y-auto">
                  {Object.entries(ICON_MAP).map(([name, Icon]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewCatIcon(name)}
                      className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                        newCatIcon === name
                          ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-700"
                          : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
                      }`}
                      title={name}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isAdding || !newCatName.trim()}
                className="w-full md:w-auto px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAdding ? "Creating..." : "Create Category"}
              </button>
            </form>
          </section>

          {/* Existing Categories List */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Your Categories
            </h3>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${cat.color} flex items-center justify-center text-white shadow-sm`}
                      >
                        {renderIcon(cat.icon || "MoreHorizontal", "w-5 h-5")}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {cat.label}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {cat.type}
                        </span>
                      </div>
                    </div>

                    {cat.type === "custom" && (
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-700 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-white/20 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
