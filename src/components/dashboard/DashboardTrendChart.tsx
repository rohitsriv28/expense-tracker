import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { CHART_COLORS } from "../../utils/chartColors";
import { formatCurrency } from "../../utils/formatters";

interface TrendData {
  date: string;
  fullDate: string;
  amount: number;
}

interface DashboardTrendChartProps {
  dailyTrend: TrendData[];
  dailyAverage: number;
}

export default function DashboardTrendChart({ dailyTrend, dailyAverage }: DashboardTrendChartProps) {
  return (
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
  );
}
