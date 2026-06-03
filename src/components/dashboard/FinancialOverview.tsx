import { useMemo } from "react";
import { ChevronLeft, ChevronRight, PiggyBank, Plus, Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { Expense } from "../../services/firebase";
import type { Income } from "../../services/incomeService";
import type { Category } from "../../services/categoryService";
import type { Budget } from "../../services/budgetService";
import { calculateBudgetSummary, convertLegacyBudget, isRecurringBudget } from "../../services/budgetService";
import { expenseDate, incomeDate, resolveExpenseVisuals } from "../../utils/dataMappers";
import { formatCurrency, formatMonthYear, formatPercent } from "../../utils/formatters";
import { CHART_COLORS } from "../../utils/chartColors";
import type { GroupedTransaction } from "../expenses/GroupedTransactionList";

import StatCard from "./StatCard";
import DashboardTrendChart from "./DashboardTrendChart";
import DashboardTopCategories from "./DashboardTopCategories";
import DashboardUrgentBudgets from "./DashboardUrgentBudgets";
import DashboardRecentTransactions from "./DashboardRecentTransactions";

interface FinancialOverviewProps {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  categories: Category[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onSetBudget: () => void;
  onViewExpenses: (category?: string) => void;
  onViewBudgets: () => void;
  onTransactionClick?: (transaction: GroupedTransaction) => void;
}

function monthRange(month: Date): { start: Date; end: Date } {
  return {
    start: new Date(month.getFullYear(), month.getMonth(), 1),
    end: new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

function isInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function currencyDelta(current: number, previous: number): string {
  const diff = current - previous;
  const arrow = diff >= 0 ? "↑" : "↓";
  return `${arrow} ${formatCurrency(Math.abs(diff))} vs last month`;
}

export default function FinancialOverview({
  expenses,
  incomes,
  budgets,
  categories,
  selectedMonth,
  onMonthChange,
  onAddExpense,
  onAddIncome,
  onSetBudget,
  onViewExpenses,
  onViewBudgets,
  onTransactionClick,
}: FinancialOverviewProps) {
  const range = useMemo(() => monthRange(selectedMonth), [selectedMonth]);
  const previousRange = useMemo(
    () => monthRange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)),
    [selectedMonth],
  );

  const monthExpenses = useMemo(
    () => expenses.filter((e) => isInRange(expenseDate(e), range.start, range.end)),
    [expenses, range],
  );
  const monthIncomes = useMemo(
    () => incomes.filter((i) => isInRange(incomeDate(i), range.start, range.end)),
    [incomes, range],
  );
  const previousExpenses = useMemo(
    () => expenses.filter((e) => isInRange(expenseDate(e), previousRange.start, previousRange.end)),
    [expenses, previousRange],
  );
  const previousIncomes = useMemo(
    () => incomes.filter((i) => isInRange(incomeDate(i), previousRange.start, previousRange.end)),
    [incomes, previousRange],
  );

  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const previousExpenseTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousIncomeTotal = previousIncomes.reduce((sum, i) => sum + i.amount, 0);
  
  const netBalance = totalIncome - totalExpenses;
  const previousNet = previousIncomeTotal - previousExpenseTotal;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : null;

  const dailyTrend = useMemo(() => {
    const days = new Map<string, number>();
    for (let date = new Date(range.start); date <= range.end; date.setDate(date.getDate() + 1)) {
      days.set(date.toISOString().split("T")[0], 0);
    }
    monthExpenses.forEach((expense) => {
      const key = expenseDate(expense).toISOString().split("T")[0];
      days.set(key, (days.get(key) || 0) + expense.amount);
    });
    return Array.from(days.entries()).map(([key, amount]) => ({
      date: new Date(`${key}T00:00:00`).getDate().toString(),
      fullDate: key,
      amount,
    }));
  }, [monthExpenses, range]);

  const dailyAverage = dailyTrend.length > 0 ? totalExpenses / dailyTrend.length : 0;

  const topCategories = useMemo(() => {
    const totals = new Map<string, number>();
    monthExpenses.forEach((expense) => {
      const key = expense.category || "Uncategorized";
      totals.set(key, (totals.get(key) || 0) + expense.amount);
    });
    return Array.from(totals.entries())
      .map(([name, amount]) => {
        const visuals = resolveExpenseVisuals(categories, name);
        return {
          id: name,
          name: visuals.categoryName,
          amount,
          color: visuals.color,
          icon: visuals.icon,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [categories, monthExpenses, totalExpenses]);

  const urgentBudgets = useMemo(() => {
    return budgets
      .map(convertLegacyBudget)
      .filter(isRecurringBudget)
      .map((budget) => calculateBudgetSummary(budget, expenses, range))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }, [budgets, expenses, range]);

  const recentTransactions = useMemo<GroupedTransaction[]>(() => {
    const expenseTransactions = expenses.map((expense) => {
      const visuals = resolveExpenseVisuals(categories, expense.category);
      return {
        id: expense.id ?? crypto.randomUUID(),
        type: "expense" as const,
        amount: expense.amount,
        description: expense.remarks || "Expense",
        categoryName: visuals.categoryName,
        icon: visuals.icon,
        color: visuals.color,
        date: expenseDate(expense),
      };
    });

    const incomeTransactions = incomes.map((income) => ({
      id: income.id ?? crypto.randomUUID(),
      type: "income" as const,
      amount: income.amount,
      description: income.description || income.source || "Income",
      categoryName: income.source || "Income",
      icon: "TrendingUp",
      color: CHART_COLORS.income,
      date: incomeDate(income),
    }));

    return [...expenseTransactions, ...incomeTransactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8);
  }, [categories, expenses, incomes]);

  const targetRate = 20;
  const targetProgress = savingsRate === null ? 0 : Math.min(100, Math.max(0, (savingsRate / targetRate) * 100));

  return (
    <div className="space-y-6 animate-enter">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="section-label">Financial command center</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
            {formatMonthYear(selectedMonth)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            aria-label="Previous month"
            onClick={() => onMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" className="chip" onClick={() => onMonthChange(new Date())}>
            This Month
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            aria-label="Next month"
            onClick={() => onMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Net Balance"
          value={formatCurrency(netBalance)}
          delta={currencyDelta(netBalance, previousNet)}
          icon={Wallet}
          tone={netBalance >= 0 ? "income" : "expense"}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          delta={currencyDelta(totalExpenses, previousExpenseTotal)}
          icon={TrendingDown}
          tone="expense"
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(totalIncome)}
          delta={currencyDelta(totalIncome, previousIncomeTotal)}
          icon={TrendingUp}
          tone="income"
        />
        <StatCard
          label="Savings Rate"
          value={savingsRate === null ? "—" : `${formatPercent(savingsRate)}%`}
          icon={PiggyBank}
          tone="brand"
        >
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
              <span>Target: {targetRate}%</span>
              <span>{Math.round(targetProgress)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-safe" style={{ width: `${targetProgress}%` }} />
            </div>
          </div>
        </StatCard>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <button type="button" className="btn btn-primary btn-lg" onClick={onAddExpense}>
          <Plus className="h-4 w-4" /> Add Expense
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={onAddIncome}>
          <TrendingUp className="h-4 w-4" /> Log Income
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={onSetBudget}>
          <Target className="h-4 w-4" /> Set Budget
        </button>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <DashboardTrendChart dailyTrend={dailyTrend} dailyAverage={dailyAverage} />
        <DashboardTopCategories topCategories={topCategories} onViewExpenses={onViewExpenses} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
        <DashboardUrgentBudgets
          urgentBudgets={urgentBudgets}
          categories={categories}
          onViewBudgets={onViewBudgets}
          onSetBudget={onSetBudget}
        />
        <DashboardRecentTransactions
          transactions={recentTransactions}
          onViewExpenses={() => onViewExpenses()}
          onTransactionClick={onTransactionClick}
        />
      </section>
    </div>
  );
}
