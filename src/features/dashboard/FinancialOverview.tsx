import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Expense } from "../../services/firebase";
import type { Income } from "../../services/incomeService";
import type { Category } from "../../services/categoryService";
import type { Budget } from "../../services/budgetService";
import {
  calculateBudgetSummary,
  convertLegacyBudget,
  isRecurringBudget,
} from "../../services/budgetService";
import {
  categoryHex,
  expenseDate,
  findCategory,
  incomeDate,
  resolveExpenseVisuals,
} from "../../utils/dataMappers";
import {
  formatCurrency,
  formatMonthYear,
  formatPercent,
} from "../../utils/formatters";
import { CHART_COLORS } from "../../utils/chartColors";
import GroupedTransactionList, {
  type GroupedTransaction,
} from "../expenses/GroupedTransactionList";

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
    end: new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ),
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

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone,
  children,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: typeof Wallet;
  tone: "neutral" | "income" | "expense" | "brand";
  children?: ReactNode;
}) {
  const toneStyles = {
    neutral: {
      color: "var(--text-primary)",
      background: "var(--status-neutral-bg)",
    },
    income: {
      color: "var(--text-income)",
      background: "var(--status-income-bg)",
    },
    expense: {
      color: "var(--text-expense)",
      background: "var(--status-expense-bg)",
    },
    brand: {
      color: "var(--text-brand)",
      background: "var(--interactive-primary-subtle)",
    },
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="stat-label">{label}</p>
          <p
            className="stat-value"
            style={{ color: toneStyles[tone].color }}
            data-financial
          >
            {value}
          </p>
          {delta && (
            <p
              className="stat-delta"
              style={{ color: "var(--text-secondary)" }}
            >
              {delta}
            </p>
          )}
        </div>
        <div className="rounded-lg p-2.5" style={toneStyles[tone]}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </div>
  );
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
    () =>
      monthRange(
        new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1),
      ),
    [selectedMonth],
  );

  const monthExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        isInRange(expenseDate(expense), range.start, range.end),
      ),
    [expenses, range],
  );
  const monthIncomes = useMemo(
    () =>
      incomes.filter((income) =>
        isInRange(incomeDate(income), range.start, range.end),
      ),
    [incomes, range],
  );
  const previousExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        isInRange(expenseDate(expense), previousRange.start, previousRange.end),
      ),
    [expenses, previousRange],
  );
  const previousIncomes = useMemo(
    () =>
      incomes.filter((income) =>
        isInRange(incomeDate(income), previousRange.start, previousRange.end),
      ),
    [incomes, previousRange],
  );

  const totalExpenses = monthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const totalIncome = monthIncomes.reduce(
    (sum, income) => sum + income.amount,
    0,
  );
  const previousExpenseTotal = previousExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const previousIncomeTotal = previousIncomes.reduce(
    (sum, income) => sum + income.amount,
    0,
  );
  const netBalance = totalIncome - totalExpenses;
  const previousNet = previousIncomeTotal - previousExpenseTotal;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : null;

  const dailyTrend = useMemo(() => {
    const days = new Map<string, number>();
    for (
      let date = new Date(range.start);
      date <= range.end;
      date.setDate(date.getDate() + 1)
    ) {
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

  const dailyAverage =
    dailyTrend.length > 0 ? totalExpenses / dailyTrend.length : 0;

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
  const targetProgress =
    savingsRate === null
      ? 0
      : Math.min(100, Math.max(0, (savingsRate / targetRate) * 100));

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
            onClick={() =>
              onMonthChange(
                new Date(
                  selectedMonth.getFullYear(),
                  selectedMonth.getMonth() - 1,
                  1,
                ),
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => onMonthChange(new Date())}
          >
            This Month
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            aria-label="Next month"
            onClick={() =>
              onMonthChange(
                new Date(
                  selectedMonth.getFullYear(),
                  selectedMonth.getMonth() + 1,
                  1,
                ),
              )
            }
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
            <div
              className="mb-1 flex justify-between text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              <span>Target: {targetRate}%</span>
              <span>{Math.round(targetProgress)}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill progress-safe"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        </StatCard>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onAddExpense}
        >
          <Plus className="h-4 w-4" /> Add Expense
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={onAddIncome}
        >
          <TrendingUp className="h-4 w-4" /> Log Income
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={onSetBudget}
        >
          <Target className="h-4 w-4" /> Set Budget
        </button>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-label">30 day trend</p>
              <h2 className="text-lg">Daily spending</h2>
            </div>
            <BarChart3
              className="h-5 w-5"
              style={{ color: "var(--text-brand)" }}
            />
          </div>
          <div className="h-[200px] md:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyTrend}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="dashboardSpendGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.brand}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.brand}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={CHART_COLORS.surface}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    formatCurrency(Number(value), { compact: true })
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Spent",
                  ]}
                />
                <ReferenceLine
                  y={dailyAverage}
                  stroke={CHART_COLORS.brand}
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={CHART_COLORS.brand}
                  strokeWidth={2}
                  fill="url(#dashboardSpendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-label">Top categories</p>
              <h2 className="text-lg">Where money went</h2>
            </div>
          </div>
          {topCategories.length === 0 ? (
            <div className="empty-state p-6">
              <p className="empty-state-title">No spending yet</p>
              <p className="empty-state-desc">
                Add expenses this month to see category patterns.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onViewExpenses(category.name)}
                  className="w-full text-left"
                >
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {category.name}
                    </span>
                    <span
                      className="tabular-nums text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatCurrency(category.amount)} ·{" "}
                      {formatPercent(category.percentage)}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${category.percentage}%`,
                        background: category.color,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-label">Budget status</p>
              <h2 className="text-lg">Most urgent</h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onViewBudgets}
            >
              View all
            </button>
          </div>
          {urgentBudgets.length === 0 ? (
            <div className="empty-state p-6">
              <Target className="empty-state-icon" />
              <p className="empty-state-title">No budgets set</p>
              <p className="empty-state-desc">
                Create category budgets to keep spending intentional.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onSetBudget}
              >
                Set up budgets
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {urgentBudgets.map((summary) => {
                const category = findCategory(
                  categories,
                  summary.budget.categoryId,
                );
                const color = categoryHex(category);
                return (
                  <div
                    key={summary.budget.id ?? summary.budget.name}
                    className="rounded-lg border p-3"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="category-dot"
                          style={{ background: color }}
                        />
                        <p className="truncate text-sm font-semibold">
                          {summary.budget.name}
                        </p>
                      </div>
                      <p
                        className="text-xs tabular-nums"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatCurrency(summary.spent)} /{" "}
                        {formatCurrency(summary.budget.amount)}
                      </p>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${summary.status === "safe" ? "progress-safe" : summary.status === "warning" ? "progress-warn" : "progress-danger"}`}
                        style={{
                          width: `${Math.min(100, summary.percentage)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-label">Recent transactions</p>
              <h2 className="text-lg">Latest activity</h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onViewExpenses()}
            >
              View all
            </button>
          </div>
          <GroupedTransactionList
            transactions={recentTransactions}
            emptyTitle="No recent activity"
            emptyDescription="Add expenses or income to see the latest movement here."
            onTransactionClick={onTransactionClick}
          />
        </div>
      </section>
    </div>
  );
}
