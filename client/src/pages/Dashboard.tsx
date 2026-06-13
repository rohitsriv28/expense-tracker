import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Home, Receipt, Target, TrendingUp, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { Expense } from "../types";
import { getAllExpenses } from "../services/expenseService";
import type { Category } from "../types";
import { getCategories } from "../services/categoryService";
import type { Income, IncomeSource } from "../types";
import { getIncomeSources, getIncomes } from "../services/incomeService";
import type { Budget } from "../types";
import { getBudgets } from "../services/budgetService";
import { subscribeToBroadcast } from "../services/broadcastSync";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AddExpenseForm from "../components/expenses/AddExpenseForm";
import AddIncomeForm from "../components/income/AddIncomeForm";
import BudgetManager from "../components/budgeting/BudgetManager";
import ExpenseList from "../components/expenses/ExpenseList";
import CategoryManager from "../components/categories/CategoryManager";
import IncomeList from "../components/income/IncomeList";
import ReportsSection from "../components/reports/ReportsSection";
import FinancialOverview from "../components/dashboard/FinancialOverview";
import ExpenseFilters, {
  type ExpenseFilterValue,
} from "../components/expenses/ExpenseFilters";
import SkeletonCard from "../components/ui/SkeletonCard";
import SkeletonChart from "../components/ui/SkeletonChart";
import SkeletonList from "../components/ui/SkeletonList";
import { useAlert } from "../contexts/AlertContext";

type Tab = "dashboard" | "expenses" | "income" | "budgets" | "reports";
type Sheet = "expense" | "income" | null;

interface ToastState {
  message: string;
  tone: "success" | "error";
}

const NAV_ITEMS: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "budgets", label: "Budgets", icon: Target },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filters, setFilters] = useState<ExpenseFilterValue>({});
  const [sheet, setSheet] = useState<Sheet>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const { showAlert } = useAlert();

  const showToast = useCallback(
    (message: string, tone: ToastState["tone"] = "success") => {
      setToast({ message, tone });
      window.setTimeout(() => setToast(null), 2500);
    },
    [],
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [cats, exps, incs, bds, srcs] = await Promise.all([
        getCategories(),
        getAllExpenses(),
        getIncomes(),
        getBudgets(),
        getIncomeSources(),
      ]);
      setCategories(cats);
      setExpenses(exps);
      setIncomes(incs);
      setBudgets(bds);
      setIncomeSources(srcs);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchData();

    const unsubscribe = subscribeToBroadcast(() => {
      fetchData();
    });

    const handleOfflineSync = () => {
      fetchData();
    };
    window.addEventListener("offline-sync-complete", handleOfflineSync);

    return () => {
      unsubscribe();
      window.removeEventListener("offline-sync-complete", handleOfflineSync);
    };
  }, [user, fetchData]);

  const handleFilterChange = useCallback((nextFilters: ExpenseFilterValue) => {
    setFilters(nextFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const openExpenseSheet = useCallback((expense?: Expense | null) => {
    setEditingExpense(expense ?? null);
    setSheet("expense");
  }, []);

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    const query = filters.query?.trim().toLowerCase();
    if (query) {
      result = result.filter((expense) =>
        `${expense.remarks} ${expense.category ?? ""}`
          .toLowerCase()
          .includes(query),
      );
    }
    if (filters.category && filters.category !== "all") {
      result = result.filter(
        (expense) => expense.category === filters.category,
      );
    }
    if (filters.startDate) {
      const start = filters.startDate.getTime();
      result = result.filter((expense) => {
        const d =
          new Date(expense.date) ?? new Date(expense.date as unknown as string);
        return d.getTime() >= start;
      });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((expense) => {
        const d =
          new Date(expense.date) ?? new Date(expense.date as unknown as string);
        return d.getTime() <= end.getTime();
      });
    }
    return result;
  }, [expenses, filters]);

  const renderTab = () => {
    if (isLoading && activeTab === "dashboard") {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
          <SkeletonChart />
          <SkeletonList rows={5} />
        </div>
      );
    }

    if (activeTab === "dashboard") {
      return (
        <FinancialOverview
          expenses={expenses}
          incomes={incomes}
          budgets={budgets}
          categories={categories}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          onAddExpense={() => openExpenseSheet()}
          onAddIncome={() => setSheet("income")}
          onSetBudget={() => setActiveTab("budgets")}
          onViewExpenses={(category) => {
            setFilters((prev) => ({ ...prev, category }));
            setActiveTab("expenses");
          }}
          onViewBudgets={() => setActiveTab("budgets")}
          onTransactionClick={(transaction) => {
            if (transaction.id.startsWith("temp-")) {
              showAlert({
                title: "Offline Restricted",
                message:
                  "You can edit this item once you are back online and it has synced.",
                icon: "warning",
              });
              return;
            }
            if (transaction.type !== "expense") return;
            const expense = expenses.find(
              (item) => item._id === transaction.id,
            );
            if (expense) openExpenseSheet(expense);
          }}
        />
      );
    }

    if (activeTab === "expenses") {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Spending history</p>
              <h1>Expenses</h1>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openExpenseSheet()}
            >
              Add Expense
            </button>
          </div>
          <ExpenseFilters
            categories={categories}
            value={filters}
            resultCount={filteredExpenses.length}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
          {isLoading ? (
            <SkeletonList rows={6} />
          ) : (
            <ExpenseList
              expenses={filteredExpenses}
              categories={categories}
              hasMore={false}
              onNextPage={() => {}}
              currentPage={1}
              isFirstPage={true}
              onEditExpense={openExpenseSheet}
              onDeleted={(message) => {
                showToast(
                  message,
                  message.startsWith("Failed") ? "error" : "success",
                );
                if (!message.startsWith("Failed")) fetchData();
              }}
              searchQuery={filters.query}
            />
          )}
        </div>
      );
    }

    if (activeTab === "income") {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Money in</p>
              <h1>Income</h1>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setSheet("income")}
            >
              Log Income
            </button>
          </div>
          <IncomeList
            incomes={incomes}
            sources={incomeSources}
            onDeleted={(message) => {
              showToast(
                message,
                message.startsWith("Failed") ? "error" : "success",
              );
              if (!message.startsWith("Failed")) fetchData();
            }}
          />
        </div>
      );
    }

    if (activeTab === "budgets") {
      return (
        <BudgetManager
          budgets={budgets}
          expenses={expenses}
          categories={categories}
          onSaved={(message) => {
            showToast(
              message,
              message.startsWith("Failed") ? "error" : "success",
            );
            if (!message.startsWith("Failed")) fetchData();
          }}
        />
      );
    }

    return (
      <ReportsSection
        expenses={expenses}
        incomes={incomes}
        budgets={budgets}
        categories={categories}
        userName={user?.displayName || "CashFlow user"}
      />
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col">
      <Header onLogout={logout} />

      <main className="mx-auto w-full max-w-[var(--content-max-width)] flex-1 px-4 py-5 pb-[calc(var(--mobile-nav-height)+2rem)] md:px-6 md:py-8">
        <nav className="mb-6 hidden md:block">
          <div className="tab-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`tab-item ${activeTab === item.id ? "tab-item-active" : ""}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {renderTab()}
      </main>

      <nav className="mobile-nav md:hidden" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item ${activeTab === item.id ? "mobile-nav-item-active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="h-5 w-5" />
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {sheet === "expense" && (
        <AddExpenseForm
          isOpen
          onClose={() => {
            setSheet(null);
            setEditingExpense(null);
          }}
          onSaved={(message) => {
            showToast(message);
            fetchData();
          }}
          categories={categories}
          expense={editingExpense}
          onManageCategories={() => setIsCategoryManagerOpen(true)}
        />
      )}

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onSaved={fetchData}
      />

      {sheet === "income" && (
        <AddIncomeForm
          isOpen
          onClose={() => setSheet(null)}
          onSaved={(message) => {
            showToast(message);
            fetchData();
          }}
          sources={incomeSources}
        />
      )}

      {toast && (
        <div className="fixed right-4 top-20 z-[var(--z-toast)]">
          <div className="toast">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background:
                  toast.tone === "success"
                    ? "var(--color-income-500)"
                    : "var(--color-expense-500)",
              }}
            />
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              className="btn btn-ghost btn-icon-sm"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
