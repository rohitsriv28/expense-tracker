import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Home, Receipt, Target, TrendingUp, X } from "lucide-react";
import { useAuth } from "../services/authService";
import type { Expense } from "../services/firebase";
import { getAllExpenses } from "../services/expenseService";
import type { Category } from "../services/categoryService";
import {
  getCategories,
  initializeDefaultCategories,
} from "../services/categoryService";
import type { Income, IncomeSource } from "../services/incomeService";
import {
  getIncomeSources,
  getIncomes,
  initializeDefaultIncomeSources,
} from "../services/incomeService";
import type { Budget, GoalBudget } from "../services/budgetService";
import {
  convertLegacyBudget,
  getBudgets,
  isGoalBudget,
} from "../services/budgetService";
import { cleanupOldExpenses } from "../services/dataRetentionService";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AddExpenseForm from "../features/expenses/AddExpenseForm";
import AddIncomeForm from "../features/income/AddIncomeForm";
import BudgetManager from "../features/budgeting/BudgetManager";
import ExpenseList from "../features/expenses/ExpenseList";
import CategoryManager from "../features/categories/CategoryManager";
import IncomeList from "../features/income/IncomeList";
import ReportsSection from "../features/reports/ReportsSection";
import FinancialOverview from "../features/dashboard/FinancialOverview";
import ExpenseFilters, {
  type ExpenseFilterValue,
} from "../features/expenses/ExpenseFilters";
import SkeletonCard from "../components/ui/SkeletonCard";
import SkeletonChart from "../components/ui/SkeletonChart";
import SkeletonList from "../components/ui/SkeletonList";

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

  const showToast = useCallback(
    (message: string, tone: ToastState["tone"] = "success") => {
      setToast({ message, tone });
      window.setTimeout(() => setToast(null), 2500);
    },
    [],
  );

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    cleanupOldExpenses(user.uid).catch(() => undefined);
    initializeDefaultCategories(user.uid).catch(() => undefined);
    initializeDefaultIncomeSources(user.uid).catch(() => undefined);

    const unsubscribeCategories = getCategories(user.uid, setCategories);
    const unsubscribeExpenses = getAllExpenses(user.uid, (data) => {
      setExpenses(data);
      setIsLoading(false);
    });
    const unsubscribeIncomes = getIncomes(user.uid, setIncomes);
    const unsubscribeBudgets = getBudgets(user.uid, setBudgets);
    const unsubscribeIncomeSources = getIncomeSources(
      user.uid,
      setIncomeSources,
    );

    return () => {
      unsubscribeCategories();
      unsubscribeExpenses();
      unsubscribeIncomes();
      unsubscribeBudgets();
      unsubscribeIncomeSources();
    };
  }, [user]);

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

  const goalBudgets = useMemo<GoalBudget[]>(
    () => budgets.map(convertLegacyBudget).filter(isGoalBudget),
    [budgets],
  );

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
          expense.date?.toDate?.() ??
          new Date(expense.date as unknown as string);
        return d.getTime() >= start;
      });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((expense) => {
        const d =
          expense.date?.toDate?.() ??
          new Date(expense.date as unknown as string);
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
            if (transaction.type !== "expense") return;
            const expense = expenses.find((item) => item.id === transaction.id);
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
              onDeleted={(message) =>
                showToast(
                  message,
                  message.startsWith("Failed") ? "error" : "success",
                )
              }
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
            onDeleted={(message) =>
              showToast(
                message,
                message.startsWith("Failed") ? "error" : "success",
              )
            }
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
          onSaved={(message) =>
            showToast(
              message,
              message.startsWith("Failed") ? "error" : "success",
            )
          }
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
          onSaved={(message) => showToast(message)}
          categories={categories}
          expense={editingExpense}
          activeGoals={goalBudgets}
          onManageCategories={() => setIsCategoryManagerOpen(true)}
        />
      )}

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />

      {sheet === "income" && (
        <AddIncomeForm
          isOpen
          onClose={() => setSheet(null)}
          onSaved={(message) => showToast(message)}
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
