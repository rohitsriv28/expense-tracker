import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileText } from "lucide-react";
import type {
  Expense,
  Income,
  Budget,
  Category,
  MonthlyEnvelopeSummary,
} from "../../types";
import {
  calculateEnvelopeSummary,
  convertLegacyBudget,
  isMonthlyEnvelopeBudget,
} from "../../services/budgetService";
import DatePicker from "../ui/DatePicker";
import {
  expenseDate,
  incomeDate,
  resolveExpenseVisuals,
} from "../../utils/dataMappers";
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
} from "../../utils/formatters";
import { CHART_COLORS } from "../../utils/chartColors";
import { useAlert } from "../../contexts/AlertContext";

interface ReportsSectionProps {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  categories: Category[];
  userName: string;
}

type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

interface CategoryBreakdown {
  name: string;
  amount: number;
  count: number;
  color: string;
  previousAmount: number;
}

function rangeFor(
  period: ReportPeriod,
  anchor: Date,
  customStart: Date,
  customEnd: Date,
) {
  const start = new Date(anchor);
  const end = new Date(anchor);

  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }
  if (period === "weekly") {
    const day = anchor.getDay();
    const diff = anchor.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  }
  if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }
  if (period === "yearly") {
    start.setFullYear(anchor.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(anchor.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
  }
  if (period === "custom") {
    start.setTime(customStart.getTime());
    start.setHours(0, 0, 0, 0);
    end.setTime(customEnd.getTime());
    end.setHours(23, 59, 59, 999);
  }

  const label =
    period === "daily"
      ? formatShortDate(start)
      : period === "weekly"
        ? `${formatShortDate(start)} - ${formatShortDate(end)}`
        : period === "monthly"
          ? start.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })
          : period === "yearly"
            ? String(start.getFullYear())
            : `${formatShortDate(start)} - ${formatShortDate(end)}`;

  return { start, end, label };
}

function previousRange(start: Date, end: Date) {
  const span = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - span);
  return { start: previousStart, end: previousEnd };
}

function inRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export default function ReportsSection({
  expenses,
  incomes,
  budgets,
  categories,
  userName,
}: ReportsSectionProps) {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [anchor, setAnchor] = useState(new Date());
  const [customStart, setCustomStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [customEnd, setCustomEnd] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const { showAlert, hideAlert } = useAlert();

  const range = useMemo(
    () => rangeFor(period, anchor, customStart, customEnd),
    [anchor, customEnd, customStart, period],
  );
  const prevRange = useMemo(
    () => previousRange(range.start, range.end),
    [range],
  );

  const periodExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        inRange(expenseDate(expense), range.start, range.end),
      ),
    [expenses, range],
  );
  const periodIncomes = useMemo(
    () =>
      incomes.filter((income) =>
        inRange(incomeDate(income), range.start, range.end),
      ),
    [incomes, range],
  );
  const previousExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        inRange(expenseDate(expense), prevRange.start, prevRange.end),
      ),
    [expenses, prevRange],
  );

  const totalExpenses = periodExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const totalIncome = periodIncomes.reduce(
    (sum, income) => sum + income.amount,
    0,
  );
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : null;
  const largestExpense = periodExpenses.reduce<Expense | null>(
    (largest, expense) =>
      !largest || expense.amount > largest.amount ? expense : largest,
    null,
  );

  const rolling = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return {
      week: expenses
        .filter((expense) => expenseDate(expense) >= weekStart)
        .reduce((sum, expense) => sum + expense.amount, 0),
      month: expenses
        .filter((expense) => expenseDate(expense) >= monthStart)
        .reduce((sum, expense) => sum + expense.amount, 0),
      year: expenses
        .filter((expense) => expenseDate(expense) >= yearStart)
        .reduce((sum, expense) => sum + expense.amount, 0),
    };
  }, [expenses]);

  const categoryData = useMemo<CategoryBreakdown[]>(() => {
    const current = new Map<string, { amount: number; count: number }>();
    const previous = new Map<string, number>();
    periodExpenses.forEach((expense) => {
      const key = expense.category || "Uncategorized";
      const value = current.get(key) ?? { amount: 0, count: 0 };
      current.set(key, {
        amount: value.amount + expense.amount,
        count: value.count + 1,
      });
    });
    previousExpenses.forEach((expense) => {
      const key = expense.category || "Uncategorized";
      previous.set(key, (previous.get(key) || 0) + expense.amount);
    });
    return Array.from(current.entries())
      .map(([name, value]) => {
        const visuals = resolveExpenseVisuals(categories, name);
        return {
          name: visuals.categoryName,
          amount: value.amount,
          count: value.count,
          color: visuals.color,
          previousAmount: previous.get(name) || 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [categories, periodExpenses, previousExpenses]);

  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (
      let date = new Date(range.start);
      date <= range.end;
      date.setDate(date.getDate() + 1)
    ) {
      map.set(date.toISOString().split("T")[0], 0);
    }
    periodExpenses.forEach((expense) => {
      const key = expenseDate(expense).toISOString().split("T")[0];
      map.set(key, (map.get(key) || 0) + expense.amount);
    });
    return Array.from(map.entries()).map(([key, amount]) => ({
      date: formatShortDate(new Date(`${key}T00:00:00`)),
      amount,
      unusual:
        amount > 0 && amount > (totalExpenses / Math.max(1, map.size)) * 2,
    }));
  }, [periodExpenses, range, totalExpenses]);

  const dailyAverage =
    dailyTrend.length > 0 ? totalExpenses / dailyTrend.length : 0;

  const monthlyComparison = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      const income = incomes
        .filter((item) => inRange(incomeDate(item), monthStart, monthEnd))
        .reduce((sum, item) => sum + item.amount, 0);
      const expense = expenses
        .filter((item) => inRange(expenseDate(item), monthStart, monthEnd))
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        month: date.toLocaleDateString("en-IN", { month: "short" }),
        income,
        expenses: expense,
        savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
      };
    });
  }, [expenses, incomes]);

  const budgetSummaries = useMemo<MonthlyEnvelopeSummary[]>(() => {
    return budgets
      .map(convertLegacyBudget)
      .filter(isMonthlyEnvelopeBudget)
      .map((budget) => calculateEnvelopeSummary(budget, expenses, categories));
  }, [budgets, expenses, categories]);

  const dayOfWeek = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totals = labels.map((label) => ({ day: label, amount: 0, count: 0 }));
    periodExpenses.forEach((expense) => {
      const day = expenseDate(expense).getDay();
      totals[day].amount += expense.amount;
      totals[day].count += 1;
    });
    return totals.map((item) => ({
      day: item.day,
      amount: item.count > 0 ? item.amount / item.count : 0,
    }));
  }, [periodExpenses]);

  const highDay = dayOfWeek.reduce(
    (max, item) => (item.amount > max.amount ? item : max),
    dayOfWeek[0],
  );

  const handleExport = async () => {
    setIsExporting(true);
    showAlert({
      title: "Generating PDF Report",
      message:
        "Please wait while we render your charts and compile the document. This may take a few seconds...",
      icon: (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--text-brand)] border-t-transparent" />
      ),
    });
    try {
      const { generatePDFReport } = await import("../../services/pdfExport");
      await generatePDFReport({
        period: range,
        expenses: periodExpenses,
        income: periodIncomes,
        budgets: budgetSummaries,
        userName,
        categories,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
      hideAlert();
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      <section
        className="sticky top-[var(--header-height)] z-20 rounded-xl border p-3 header-blur"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-label">Financial Report</p>
            <h1>{range.label}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                "daily",
                "weekly",
                "monthly",
                "yearly",
                "custom",
              ] as ReportPeriod[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                className={`chip capitalize ${period === item ? "chip-active" : ""}`}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export PDF
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {period === "custom" ? (
            <>
              <DatePicker
                label="From"
                value={customStart}
                onChange={setCustomStart}
              />
              <DatePicker
                label="To"
                value={customEnd}
                onChange={setCustomEnd}
                min={customStart}
              />
            </>
          ) : (
            <DatePicker
              label="Period anchor"
              value={anchor}
              onChange={setAnchor}
            />
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          tone="expense"
        />
        <Metric
          label="Total Income"
          value={formatCurrency(totalIncome)}
          tone="income"
        />
        <Metric
          label="Net Savings"
          value={formatCurrency(netSavings)}
          tone={netSavings >= 0 ? "income" : "expense"}
        />
        <Metric
          label="Savings Rate"
          value={
            savingsRate === null ? "N/A" : `${formatPercent(savingsRate)}%`
          }
          tone="brand"
        />
        <Metric label="Transactions" value={String(periodExpenses.length)} />
        <Metric
          label="Average Expense"
          value={formatCurrency(
            periodExpenses.length ? totalExpenses / periodExpenses.length : 0,
          )}
        />
        <Metric
          label="Largest Expense"
          value={formatCurrency(largestExpense?.amount ?? 0)}
          detail={largestExpense?.category ?? "None"}
        />
        <Metric label="This Week" value={formatCurrency(rolling.week)} />
        <Metric label="This Month" value={formatCurrency(rolling.month)} />
        <Metric label="This Year" value={formatCurrency(rolling.year)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="card">
          <SectionTitle title="Spending Trend" />
          <div style={{ width: "100%", minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={dailyTrend}
                margin={{ left: -18, right: 8, top: 8 }}
              >
                <defs>
                  <linearGradient
                    id="reportSpendGradient"
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
                />
                <YAxis
                  tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                  tickFormatter={(value) =>
                    formatCurrency(Number(value), { compact: true })
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Spent",
                  ]}
                  contentStyle={{
                    background: "var(--bg-card-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
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
                  fill="url(#reportSpendGradient)"
                  dot={(props) => {
                    const payload = props.payload as { unusual?: boolean };
                    return payload.unusual ? (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={CHART_COLORS.expense}
                      />
                    ) : (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={0}
                        fill="transparent"
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <SectionTitle title="Category Donut" />
          <div style={{ width: "100%", minWidth: 0 }}>
            {categoryData.length === 0 ? (
              <EmptyMini title="No category data" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={
                      categoryData as unknown as Array<Record<string, unknown>>
                    }
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <SectionTitle title="Category Breakdown" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-3">
            {categoryData.length === 0 ? (
              <EmptyMini title="No spending in this period" />
            ) : (
              categoryData.map((item, index) => {
                const percentage =
                  totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                return (
                  <div
                    key={item.name}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-enter"
                  >
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span>
                        {formatCurrency(item.amount)} ·{" "}
                        {formatPercent(percentage)}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percentage}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left section-label">
                  <th className="py-2">Category</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Transactions</th>
                  <th className="py-2">Avg</th>
                  <th className="py-2">vs Last</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((item) => {
                  const avg = item.count > 0 ? item.amount / item.count : 0;
                  const delta =
                    item.previousAmount > 0
                      ? ((item.amount - item.previousAmount) /
                          item.previousAmount) *
                        100
                      : 0;
                  return (
                    <tr
                      key={item.name}
                      className="border-t"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <td className="py-3">{item.name}</td>
                      <td className="py-3 tabular-nums">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3">{item.count}</td>
                      <td className="py-3 tabular-nums">
                        {formatCurrency(avg)}
                      </td>
                      <td className="py-3">
                        {delta >= 0 ? "↑" : "↓"}{" "}
                        {formatPercent(Math.abs(delta))}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Income vs Expense">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyComparison} barSize={20} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={CHART_COLORS.surface}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                tickFormatter={(value) =>
                  formatCurrency(Number(value), { compact: true })
                }
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name,
                ]}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill={CHART_COLORS.income}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill={CHART_COLORS.expense}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Day-of-week Pattern">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dayOfWeek}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={CHART_COLORS.surface}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                tickFormatter={(value) =>
                  formatCurrency(Number(value), { compact: true })
                }
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {dayOfWeek.map((item) => (
                  <Cell
                    key={item.day}
                    fill={
                      item.day === highDay.day
                        ? CHART_COLORS.brand
                        : CHART_COLORS.muted
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            You typically spend most on {highDay.day || "quiet days"}.
          </p>
        </ChartCard>
      </section>

      {budgetSummaries.length > 0 && (
        <section className="card">
          <SectionTitle title="Budget vs Actual" />
          <div className="space-y-3">
            {budgetSummaries.map((summary) => (
              <div
                key={summary.budget._id ?? summary.budget.name}
                className="grid gap-2 md:grid-cols-[10rem_1fr_12rem] md:items-center"
              >
                <span className="font-medium">{summary.budget.name}</span>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${summary.status === "safe" ? "progress-safe" : summary.status === "warning" ? "progress-warn" : "progress-danger"}`}
                    style={{ width: `${Math.min(100, summary.percentage)}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums">
                  {formatCurrency(summary.totalSpent)} /{" "}
                  {formatCurrency(summary.budget.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "income" | "expense" | "brand";
}) {
  const color =
    tone === "income"
      ? "var(--text-income)"
      : tone === "expense"
        ? "var(--text-expense)"
        : tone === "brand"
          ? "var(--text-brand)"
          : "var(--text-primary)";
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color }}>
        {value}
      </p>
      {detail && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {detail}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <FileText className="h-5 w-5" style={{ color: "var(--text-brand)" }} />
      <h2 className="text-lg">{title}</h2>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="card">
      <SectionTitle title={title} />
      {children}
    </div>
  );
}

function EmptyMini({ title }: { title: string }) {
  return (
    <div
      className="flex h-full min-h-40 items-center justify-center text-sm"
      style={{ color: "var(--text-secondary)" }}
    >
      {title}
    </div>
  );
}
