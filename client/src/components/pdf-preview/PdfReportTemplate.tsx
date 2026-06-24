import {
  User,
  Calendar,
  Clock3,
  Wallet,
  TrendingDown,
  PiggyBank,
  Percent,
  Receipt,
  TrendingUp,
  FileBarChart,
  ClipboardList,
  Target,
  Sparkles,
  PieChart,
  Trophy,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { resolveExpenseVisuals } from "../../utils/dataMappers";

// --- Types ---

interface ReportData {
  period: { start: Date; end: Date; label: string };
  userName: string;
  income: { amount: number }[];
  expenses: any[];
  budgets: any[];
  categories: any[];
}

// ─── Design tokens (inline, PDF-safe) ───────────────────────────────────────
const C = {
  brand: "#4f46e5",
  brandLight: "#eef2ff",
  brandMid: "#6366f1",
  brandDark: "#3730a3",
  income: "#10b981",
  incomeLight: "#ecfdf5",
  incomeBorder: "#a7f3d0",
  expense: "#f43f5e",
  expenseLight: "#fff1f2",
  expenseBorder: "#fecdd3",
  warning: "#f59e0b",
  warningLight: "#fffbeb",
  warningBorder: "#fde68a",
  ink: "#0f172a",
  inkMid: "#334155",
  inkSoft: "#64748b",
  inkFaint: "#94a3b8",
  surface: "#f8fafc",
  border: "#e2e8f0",
  white: "#ffffff",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildConicGradient(
  slices: { color: string; percentage: number }[],
): string {
  const stops: string[] = [];
  let acc = 0;
  slices.forEach(({ color, percentage }) => {
    const deg = (percentage / 100) * 360;
    const end = acc + deg;
    stops.push(`${color} ${acc.toFixed(1)}deg ${end.toFixed(1)}deg`);
    acc = end;
  });
  // Close the ring to 360 if floating-point drift leaves a gap
  if (acc < 360) stops.push(`${C.border} ${acc.toFixed(1)}deg 360deg`);
  return stops.join(", ");
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function PageHeader({
  icon,
  title,
  subtitle,
  accentColor = C.brand,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        padding: "28px 36px 22px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: accentColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.white,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function ReportFooter({ page = 1, totalPages = 4 }: any) {
  return (
    <div
      style={{
        height: 44,
        borderTop: `1px solid ${C.border}`,
        background: C.surface,
        padding: "0 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <BarChart3 size={15} color={C.brand} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.brand }}>
          CashFlow
        </span>
      </div>
      <div style={{ fontSize: 11, color: C.inkSoft, fontWeight: 500 }}>
        Personal Finance Report · {new Date().getFullYear()}
      </div>
      <div
        style={{
          background: C.brand,
          color: C.white,
          fontSize: 11,
          fontWeight: 700,
          padding: "3px 12px",
          borderRadius: 999,
        }}
      >
        {page} / {totalPages}
      </div>
    </div>
  );
}

// Compact metric pill used in the cover hero band
function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 16,
        padding: "14px 18px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.6)",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

// Summary stat card used on cover page
function StatCard({
  icon,
  title,
  value,
  delta,
  deltaType,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  iconColor: string;
}) {
  const deltaColor =
    deltaType === "positive"
      ? C.income
      : deltaType === "negative"
        ? C.expense
        : C.inkSoft;
  const DeltaIcon =
    deltaType === "positive"
      ? ArrowUpRight
      : deltaType === "negative"
        ? ArrowDownRight
        : Minus;

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `${iconColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>
          {title}
        </span>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: C.ink,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 8,
            fontSize: 12,
            fontWeight: 600,
            color: deltaColor,
          }}
        >
          <DeltaIcon size={13} />
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── Page 1: Cover ───────────────────────────────────────────────────────────

function ReportCoverPage({ data }: { data: ReportData }) {
  const totalIncome = data.income.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const txnCount = data.expenses.length;
  const avgExpense = txnCount > 0 ? totalExpenses / txnCount : 0;

  const savingsRateDeltaType: "positive" | "negative" | "neutral" =
    savingsRate >= 20 ? "positive" : savingsRate >= 0 ? "neutral" : "negative";

  return (
    <div
      className="page-break-after-always"
      style={{
        width: 794,
        height: 1123,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Hero Banner ── */}
      <div
        style={{
          background: `linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4f46e5 100%)`,
          padding: "36px 36px 0",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orb */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(129,140,248,0.18)",
            filter: "blur(40px)",
          }}
        />
        {/* Brand + App name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileBarChart size={18} color={C.white} />
          </div>
          <span
            style={{
              color: C.white,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            CashFlow
          </span>
        </div>

        {/* Headline row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 46,
                fontWeight: 800,
                color: C.white,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              Personal Finance
              <br />
              <span style={{ color: "#a5b4fc" }}>Report</span>
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.55)",
                marginTop: 10,
                fontWeight: 500,
              }}
            >
              Your money. Your future. In your control.
            </div>
          </div>
          {/* Meta chips */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flexShrink: 0,
              paddingBottom: 6,
            }}
          >
            {[
              {
                icon: <User size={13} />,
                label: "Prepared for",
                value: data.userName,
              },
              {
                icon: <Calendar size={13} />,
                label: "Period",
                value: data.period.label,
              },
              {
                icon: <Clock3 size={13} />,
                label: "Generated",
                value: new Date().toLocaleDateString("en-GB"),
              },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  borderRadius: 12,
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#a5b4fc", display: "flex" }}>
                  {icon}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    marginRight: 4,
                  }}
                >
                  {label}:
                </span>
                <span style={{ fontSize: 12, color: C.white, fontWeight: 600 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metric strip */}
        <div
          style={{ display: "flex", gap: 10, marginTop: 28, paddingBottom: 28 }}
        >
          <MetricPill
            label="TOTAL INCOME"
            value={formatCurrency(totalIncome, { compact: true })}
            color="#6ee7b7"
          />
          <MetricPill
            label="TOTAL EXPENSES"
            value={formatCurrency(totalExpenses, { compact: true })}
            color="#fda4af"
          />
          <MetricPill
            label="NET SAVINGS"
            value={formatCurrency(netSavings, { compact: true })}
            color="#a5b4fc"
          />
          <MetricPill
            label="SAVINGS RATE"
            value={`${savingsRate}%`}
            color={
              savingsRate >= 20
                ? "#6ee7b7"
                : savingsRate >= 0
                  ? "#fde68a"
                  : "#fda4af"
            }
          />
        </div>

        {/* White scallop transition */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 32,
            background: C.white,
            borderRadius: "50px 50px 0 0",
          }}
        />
      </div>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          padding: "28px 36px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Section label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Sparkles size={16} color={C.brand} />
          <span style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>
            Detailed Breakdown
          </span>
        </div>

        {/* 3-col stat grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <StatCard
            icon={<Wallet size={16} />}
            title="Total Income"
            value={formatCurrency(totalIncome)}
            delta={`${data.income.length} source${data.income.length !== 1 ? "s" : ""}`}
            deltaType="positive"
            iconColor={C.income}
          />
          <StatCard
            icon={<TrendingDown size={16} />}
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            delta={`${txnCount} transactions`}
            deltaType="negative"
            iconColor={C.expense}
          />
          <StatCard
            icon={<PiggyBank size={16} />}
            title="Net Savings"
            value={formatCurrency(netSavings)}
            delta={netSavings >= 0 ? "Positive balance" : "Deficit"}
            deltaType={netSavings >= 0 ? "positive" : "negative"}
            iconColor={C.brand}
          />
          <StatCard
            icon={<Percent size={16} />}
            title="Savings Rate"
            value={`${savingsRate}%`}
            delta={
              savingsRate >= 20
                ? "Healthy"
                : savingsRate >= 10
                  ? "Moderate"
                  : "Needs work"
            }
            deltaType={savingsRateDeltaType}
            iconColor={C.brandMid}
          />
          <StatCard
            icon={<Receipt size={16} />}
            title="Total Transactions"
            value={String(txnCount)}
            delta="Expense entries"
            deltaType="neutral"
            iconColor={C.brandMid}
          />
          <StatCard
            icon={<TrendingUp size={16} />}
            title="Avg. Transaction"
            value={formatCurrency(avgExpense)}
            delta="Per expense"
            deltaType="neutral"
            iconColor={C.warning}
          />
        </div>

        {/* Executive Summary */}
        <div
          style={{
            background: C.brandLight,
            border: `1px solid #e0e7ff`,
            borderRadius: 20,
            padding: "20px 24px",
            marginBottom: 20,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Sparkles size={16} color={C.brand} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
              Executive Summary
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: C.inkMid,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            During <strong>{data.period.label}</strong>, you earned{" "}
            <strong style={{ color: C.income }}>
              {formatCurrency(totalIncome)}
            </strong>{" "}
            across {data.income.length} income source
            {data.income.length !== 1 ? "s" : ""} and spent{" "}
            <strong style={{ color: C.expense }}>
              {formatCurrency(totalExpenses)}
            </strong>{" "}
            across {txnCount} transactions — resulting in net savings of{" "}
            <strong style={{ color: C.brand }}>
              {formatCurrency(netSavings)}
            </strong>{" "}
            ({savingsRate}% savings rate). Detailed category breakdowns, a full
            transaction log, and budget performance are covered on the following
            pages.
          </p>
        </div>

        {/* Report Contents */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.ink,
              marginBottom: 12,
            }}
          >
            Report Contents
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            {[
              {
                icon: <PieChart size={16} />,
                num: "01",
                title: "Spending by Category",
              },
              {
                icon: <ClipboardList size={16} />,
                num: "02",
                title: "Transaction Log",
              },
              {
                icon: <Target size={16} />,
                num: "03",
                title: "Budget Performance",
              },
            ].map(({ icon, num, title }) => (
              <div
                key={num}
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: C.brandLight,
                    color: C.brand,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.inkFaint,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    PAGE {num}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                    {title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ReportFooter page={1} totalPages={4} />
    </div>
  );
}

// ─── Page 2: Spending by Category ────────────────────────────────────────────

function SpendingByCategoryPage({ data }: { data: ReportData }) {
  const total = data.expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const map = new Map<string, any>();
  data.expenses.forEach((ex) => {
    const v = resolveExpenseVisuals(
      data.categories,
      ex.category || "Uncategorized",
    );
    const name = v.categoryName;
    const cur = map.get(name) || { amount: 0, count: 0, color: v.color };
    map.set(name, {
      amount: cur.amount + ex.amount,
      count: cur.count + 1,
      color: v.color,
      name,
    });
  });

  const categories = Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({
      ...c,
      percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0,
    }));

  const topCat = categories[0];
  const top5 = categories.slice(0, 5);

  // BUG FIX: use buildConicGradient helper instead of raw string concatenation
  const conicGradient = top5.length
    ? buildConicGradient(
        top5.map((c) => ({ color: c.color, percentage: c.percentage })),
      )
    : `${C.border} 0deg 360deg`;

  // Compute "others" for pie
  const othersAmount = categories.slice(5).reduce((s, c) => s + c.amount, 0);
  const othersCount = categories.slice(5).reduce((s, c) => s + c.count, 0);

  return (
    <div
      className="page-break-after-always"
      style={{
        width: 794,
        height: 1123,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PageHeader
        icon={<PieChart size={19} />}
        title="Spending by Category"
        subtitle="Understand where your money went during this period"
      />

      <div
        style={{
          flex: 1,
          padding: "24px 36px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top row: bar list + donut */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 24,
            padding: "22px 24px",
            marginBottom: 20,
            flexShrink: 0,
            display: "grid",
            gridTemplateColumns: "1fr 220px",
            gap: 32,
          }}
        >
          {/* Bar list */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
                Category Distribution
              </span>
              <span
                style={{
                  background: C.brandLight,
                  color: C.brand,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 999,
                }}
              >
                TOP {top5.length}
              </span>
            </div>
            {top5.map((category, i) => (
              <div
                key={category.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 88px",
                  gap: 12,
                  alignItems: "center",
                  paddingBottom: i < top5.length - 1 ? 14 : 0,
                  marginBottom: i < top5.length - 1 ? 14 : 0,
                  borderBottom:
                    i < top5.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: category.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.white,
                    fontWeight: 800,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {category.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: C.ink,
                      marginBottom: 6,
                    }}
                  >
                    {category.name}
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: C.border,
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${category.percentage}%`,
                        background: category.color,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: C.ink,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {category.percentage}%
                  </div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3 }}>
                    {formatCurrency(category.amount, { compact: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Donut chart */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative", width: 168, height: 168 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: `conic-gradient(${conicGradient})`,
                }}
              />
              {/* Inner ring shadow */}
              <div
                style={{
                  position: "absolute",
                  inset: 18,
                  borderRadius: "50%",
                  background: C.white,
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: C.ink,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {topCat?.percentage || 0}%
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.inkSoft,
                    marginTop: 3,
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Top
                  <br />
                  Category
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: C.ink,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {formatCurrency(total, { compact: true })}
              </div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
                Total Expenses
              </div>
            </div>
            {/* Legend dots */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 5,
                width: "100%",
              }}
            >
              {top5.map((c) => (
                <div
                  key={c.name}
                  style={{ display: "flex", alignItems: "center", gap: 7 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: c.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: C.inkMid,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>
                    {c.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top category highlight */}
        {topCat && (
          <div
            style={{
              background: `linear-gradient(135deg, ${C.incomeLight} 0%, #f0fdf4 100%)`,
              border: `1px solid ${C.incomeBorder}`,
              borderRadius: 20,
              padding: "18px 22px",
              marginBottom: 20,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: C.income,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Trophy size={20} color={C.white} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: C.inkSoft }}>
                Largest Expense Category
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.ink,
                  lineHeight: 1.2,
                }}
              >
                {topCat.name}
              </div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { label: "Amount", val: formatCurrency(topCat.amount) },
                { label: "Share", val: `${topCat.percentage}%` },
                { label: "Transactions", val: String(topCat.count) },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: C.inkSoft }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full category table */}
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Table header */}
          <div
            style={{
              background: C.brand,
              display: "grid",
              gridTemplateColumns: "2fr 1fr 80px 80px",
              padding: "12px 20px",
              color: C.white,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <div>Category</div>
            <div>Amount</div>
            <div style={{ textAlign: "center" }}>Share</div>
            <div style={{ textAlign: "right" }}>Txns</div>
          </div>
          {[
            ...top5,
            ...(othersAmount > 0
              ? [
                  {
                    name: "Other",
                    color: C.inkFaint,
                    amount: othersAmount,
                    count: othersCount,
                    percentage: categories
                      .slice(5)
                      .reduce((s, c) => s + c.percentage, 0),
                  },
                ]
              : []),
          ].map((category, index, arr) => (
            <div
              key={category.name}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 80px 80px",
                padding: "12px 20px",
                fontSize: 13,
                borderBottom:
                  index < arr.length - 1 ? `1px solid ${C.surface}` : "none",
                background: index % 2 === 0 ? C.white : C.surface,
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: category.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, color: C.ink }}>
                  {category.name}
                </span>
              </div>
              <div style={{ color: C.inkMid, fontWeight: 600 }}>
                {formatCurrency(category.amount)}
              </div>
              <div
                style={{ textAlign: "center", fontWeight: 700, color: C.ink }}
              >
                {category.percentage}%
              </div>
              <div style={{ textAlign: "right", color: C.inkSoft }}>
                {category.count}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ReportFooter page={2} totalPages={4} />
    </div>
  );
}

// ─── Page 3: Transaction Log ──────────────────────────────────────────────────

function TransactionLogPage({ data }: { data: ReportData }) {
  const sorted = [...data.expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);
  const total = data.expenses.reduce((s, e) => s + e.amount, 0);
  const max = data.expenses.length
    ? Math.max(...data.expenses.map((e) => e.amount))
    : 0;
  const avg = data.expenses.length ? total / data.expenses.length : 0;
  const largestTxn = data.expenses.find((e) => e.amount === max);

  return (
    <div
      className="page-break-after-always"
      style={{
        width: 794,
        height: 1123,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PageHeader
        icon={<ClipboardList size={19} />}
        title="Transaction Log"
        subtitle="Detailed record of all expenses during this period"
      />

      <div
        style={{
          flex: 1,
          padding: "24px 36px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 14,
            marginBottom: 22,
            flexShrink: 0,
          }}
        >
          {[
            {
              icon: <CreditCard size={16} />,
              label: "Transactions",
              value: String(data.expenses.length),
              color: C.brand,
            },
            {
              icon: <IndianRupee size={16} />,
              label: "Total Spent",
              value: formatCurrency(total, { compact: true }),
              color: C.expense,
            },
            {
              icon: <TrendingUp size={16} />,
              label: "Average",
              value: formatCurrency(avg, { compact: true }),
              color: C.income,
            },
            {
              icon: <Trophy size={16} />,
              label: "Largest",
              value: formatCurrency(max, { compact: true }),
              color: C.warning,
            },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `${color}18`,
                    color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {icon}
                </div>
                <span
                  style={{ fontSize: 11, color: C.inkSoft, fontWeight: 600 }}
                >
                  {label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.ink,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Transaction table */}
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            overflow: "hidden",
            flexShrink: 0,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: C.brand,
              display: "grid",
              // Date | Category | Description | Amount
              gridTemplateColumns: "100px 140px 1fr 120px",
              padding: "12px 20px",
              color: C.white,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <div>Date</div>
            <div>Category</div>
            <div>Description</div>
            <div style={{ textAlign: "right" }}>Amount</div>
          </div>
          {sorted.map((txn, index) => {
            const v = resolveExpenseVisuals(
              data.categories,
              txn.category || "",
            );
            return (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 140px 1fr 120px",
                  padding: "11px 20px",
                  alignItems: "center",
                  borderBottom:
                    index < sorted.length - 1
                      ? `1px solid ${C.surface}`
                      : "none",
                  background: index % 2 === 0 ? C.white : C.surface,
                }}
              >
                <div style={{ fontSize: 12, color: C.inkSoft }}>
                  {new Date(txn.date).toLocaleDateString("en-GB")}
                </div>
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "3px 10px 3px 7px",
                      borderRadius: 999,
                      background: `${v.color}18`,
                      color: v.color,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: v.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 90,
                      }}
                    >
                      {v.categoryName}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingRight: 8,
                  }}
                >
                  {txn.remarks || txn.notes || "—"}
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontWeight: 800,
                    fontSize: 14,
                    color: C.expense,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {formatCurrency(txn.amount)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              background: C.warningLight,
              border: `1px solid ${C.warningBorder}`,
              borderRadius: 20,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: C.warning,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trophy size={17} color={C.white} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.inkSoft }}>
                  Largest Transaction
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: C.ink,
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 180,
                  }}
                >
                  {largestTxn?.remarks || "—"}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: C.ink,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {formatCurrency(max)}
            </div>
          </div>
          <div
            style={{
              background: C.incomeLight,
              border: `1px solid ${C.incomeBorder}`,
              borderRadius: 20,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: C.income,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={17} color={C.white} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.inkSoft }}>
                  Average Transaction
                </div>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 13 }}>
                  Spending Pattern
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: C.ink,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {formatCurrency(avg)}
            </div>
          </div>
        </div>
      </div>
      <ReportFooter page={3} totalPages={4} />
    </div>
  );
}

// ─── Page 4: Budget Performance ───────────────────────────────────────────────

function BudgetPerformancePage({ data }: { data: ReportData }) {
  const onTrack = data.budgets.filter((b) => b.status === "safe").length;
  const nearLimit = data.budgets.filter((b) => b.status === "warning").length;
  const exceeded = data.budgets.filter(
    (b) => b.status === "danger" || b.status === "exceeded",
  ).length;

  const healthLabel =
    exceeded === 0 ? "Excellent" : exceeded < 2 ? "Good" : "Needs Attention";
  const healthColor =
    exceeded === 0 ? C.income : exceeded < 2 ? C.warning : C.expense;

  // Show up to 5 budgets; indicate if more exist
  const displayBudgets = data.budgets.slice(0, 5);
  const extraCount = data.budgets.length - displayBudgets.length;

  return (
    // NOTE: Last page intentionally omits page-break-after-always
    <div
      className="page-break-after-always"
      style={{
        width: 794,
        height: 1123,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PageHeader
        icon={<Target size={19} />}
        title="Budget Performance"
        subtitle="Track progress against your spending goals"
      />

      <div
        style={{
          flex: 1,
          padding: "24px 36px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Budget health KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 14,
            marginBottom: 22,
            flexShrink: 0,
          }}
        >
          {[
            { dot: C.brand, label: "Total Budgets", val: data.budgets.length },
            { dot: C.income, label: "On Track", val: onTrack },
            { dot: C.warning, label: "Near Limit", val: nearLimit },
            { dot: C.expense, label: "Exceeded", val: exceeded },
          ].map(({ dot, label, val }) => (
            <div
              key={label}
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: dot,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontSize: 11, color: C.inkSoft, fontWeight: 600 }}
                >
                  {label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: C.ink,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* Budget rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            flexShrink: 0,
            marginBottom: 20,
          }}
        >
          {displayBudgets.map((b) => {
            const isDanger = b.status === "danger" || b.status === "exceeded";
            const isWarning = b.status === "warning";
            const color = isDanger
              ? C.expense
              : isWarning
                ? C.warning
                : C.income;
            const bgColor = isDanger
              ? C.expenseLight
              : isWarning
                ? C.warningLight
                : C.incomeLight;
            const borderColor = isDanger
              ? C.expenseBorder
              : isWarning
                ? C.warningBorder
                : C.incomeBorder;
            const statusLabel = isDanger
              ? "EXCEEDED"
              : isWarning
                ? "NEAR LIMIT"
                : "ON TRACK";
            const remaining = b.budget.amount - b.totalSpent;
            const pct = Math.min(Math.round(b.percentage), 100);

            return (
              <div
                key={b.budget._id}
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 22,
                  padding: "18px 20px",
                  display: "grid",
                  gridTemplateColumns: "1fr 140px",
                  gap: 20,
                  alignItems: "center",
                }}
              >
                {/* Left: info + bar */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Wallet size={17} color={C.white} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 16,
                            color: C.ink,
                          }}
                        >
                          {b.budget.name}
                        </div>
                        <div style={{ fontSize: 12, color: C.inkSoft }}>
                          Category Budget
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        color,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {statusLabel}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: C.inkSoft,
                      marginBottom: 8,
                    }}
                  >
                    <span>{formatCurrency(b.totalSpent)} spent</span>
                    <span>{formatCurrency(b.budget.amount)} budget</span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 10,
                        background: C.border,
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: color,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: C.ink,
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {Math.round(b.percentage)}%
                    </div>
                  </div>
                </div>

                {/* Right: remaining box */}
                <div
                  style={{
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 16,
                    padding: "14px 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatCurrency(Math.abs(remaining), { compact: true })}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color,
                      marginTop: 6,
                    }}
                  >
                    {remaining >= 0 ? "remaining" : "over budget"}
                  </div>
                </div>
              </div>
            );
          })}
          {extraCount > 0 && (
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                color: C.inkSoft,
                padding: "6px 0",
                fontStyle: "italic",
              }}
            >
              + {extraCount} more budget{extraCount !== 1 ? "s" : ""} not shown
            </div>
          )}
        </div>

        {/* Bottom: health summary + verdict */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.ink,
                marginBottom: 14,
              }}
            >
              Budget Health Summary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  icon: <CheckCircle2 size={17} color="#059669" />,
                  label: "Within Budget",
                  count: onTrack,
                },
                {
                  icon: <AlertTriangle size={17} color="#d97706" />,
                  label: "Near Limit",
                  count: nearLimit,
                },
                {
                  icon: <XCircle size={17} color="#e11d48" />,
                  label: "Exceeded",
                  count: exceeded,
                },
              ].map(({ icon, label, count }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: C.surface,
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {icon}
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: C.inkMid }}
                    >
                      {label}
                    </span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: `linear-gradient(135deg, ${C.brand} 0%, ${C.brandDark} 100%)`,
              borderRadius: 20,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={20} color={C.white} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Overall Budget Health
                </div>
                <div
                  style={{ fontSize: 22, fontWeight: 800, color: healthColor }}
                >
                  {healthLabel}
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {exceeded === 0
                ? "All budgets remain under control. Spending patterns are healthy and your savings goals are on track."
                : "Some budgets have exceeded their limits. Consider adjusting your spending or increasing your budget allocations."}
            </p>
          </div>
        </div>
      </div>
      <ReportFooter page={4} totalPages={4} />
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────

export const TOTAL_PAGES = 4;

export default function PdfReportTemplate({
  data,
  pageIndex,
}: {
  data: ReportData;
  pageIndex?: number;
}) {
  const pages = [
    <ReportCoverPage key="cover" data={data} />,
    <SpendingByCategoryPage key="spending" data={data} />,
    <TransactionLogPage key="transactions" data={data} />,
    <BudgetPerformancePage key="budget" data={data} />,
  ];

  if (pageIndex !== undefined && pageIndex >= 0 && pageIndex < pages.length) {
    return (
      <div style={{ width: 794, background: "#f1f5f9" }}>
        {pages[pageIndex]}
      </div>
    );
  }

  return <div style={{ width: 794, background: "#f1f5f9" }}>{pages}</div>;
}
