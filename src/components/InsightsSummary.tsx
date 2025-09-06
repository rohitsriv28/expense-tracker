import type { Expense } from "../services/firebase";
import { getCurrentMonth, getWeekRange } from "../utils/dateUtils";
import {
  Calendar,
  TrendingUp,
  BadgeIndianRupee,
  BarChart3,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface InsightsSummaryProps {
  expenses: Expense[];
}

export default function InsightsSummary({ expenses }: InsightsSummaryProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [isSpendingOverviewExpanded, setIsSpendingOverviewExpanded] =
    useState(true);
  const [isQuickStatsExpanded, setIsQuickStatsExpanded] = useState(false);

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  const dailyExpenses = expenses.filter(
    (e) => e.date.toDate().toISOString().split("T")[0] === todayString
  );

  const weeklyExpenses = expenses.filter((e) => {
    const [start, end] = getWeekRange(today);
    const date = e.date.toDate();
    return date >= start && date <= end;
  });

  const monthlyExpenses = expenses.filter(
    (e) => getCurrentMonth(e.date.toDate()) === getCurrentMonth(today)
  );

  const calculateTotal = (items: Expense[]) =>
    items.reduce((sum, item) => sum + item.amount, 0);

  const calculateAverage = (items: Expense[], days: number) =>
    items.length > 0 ? calculateTotal(items) / days : 0;

  const dailyTotal = calculateTotal(dailyExpenses);
  const weeklyTotal = calculateTotal(weeklyExpenses);
  const monthlyTotal = calculateTotal(monthlyExpenses);
  const dailyAverage = calculateAverage(monthlyExpenses, new Date().getDate());

  const toggleCardExpansion = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const summaryCards = [
    {
      title: "Today",
      amount: dailyTotal,
      count: dailyExpenses.length,
      icon: Calendar,
      gradient: "from-blue-600 via-blue-500 to-cyan-500",
      bgGradient: "from-blue-50/80 via-blue-50/60 to-cyan-50/80",
      textColor: "text-blue-700",
      accentColor: "bg-blue-500",
      shadowColor: "shadow-blue-200/50",
    },
    {
      title: "This Week",
      amount: weeklyTotal,
      count: weeklyExpenses.length,
      icon: TrendingUp,
      gradient: "from-emerald-600 via-green-500 to-teal-500",
      bgGradient: "from-emerald-50/80 via-green-50/60 to-teal-50/80",
      textColor: "text-emerald-700",
      accentColor: "bg-emerald-500",
      shadowColor: "shadow-emerald-200/50",
    },
    {
      title: "This Month",
      amount: monthlyTotal,
      count: monthlyExpenses.length,
      icon: BarChart3,
      gradient: "from-purple-600 via-violet-500 to-fuchsia-500",
      bgGradient: "from-purple-50/80 via-violet-50/60 to-fuchsia-50/80",
      textColor: "text-purple-700",
      accentColor: "bg-purple-500",
      shadowColor: "shadow-purple-200/50",
    },
  ];

  return (
    <div className="mb-8 px-2 md:px-0">
      {/* Spending Overview Section */}
      <div className="mb-6 md:mb-8">
        {/* Header with glassmorphism effect and dropdown toggle */}
        <div
          className="flex items-center justify-between mb-4 md:mb-6 pl-2 cursor-pointer md:cursor-default"
          onClick={() =>
            window.innerWidth < 768 &&
            setIsSpendingOverviewExpanded(!isSpendingOverviewExpanded)
          }
        >
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-20"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-3 shadow-lg">
                <BadgeIndianRupee className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                Spending Overview
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Track your financial journey
              </p>
            </div>
          </div>

          {/* Dropdown toggle - only visible on mobile */}
          <div className="md:hidden">
            <ChevronDown
              className={`w-6 h-6 text-gray-600 transition-all duration-300 ${
                isSpendingOverviewExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Collapsible content */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isSpendingOverviewExpanded
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 opacity-0 md:max-h-[2000px] md:opacity-100"
          }`}
        >
          <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-8">
            {summaryCards.map((card, index) => {
              const IconComponent = card.icon;
              const isExpanded = expandedCard === index;

              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden bg-gradient-to-br ${card.bgGradient} rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl ${card.shadowColor} border border-white/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer backdrop-blur-sm`}
                  onClick={() => toggleCardExpansion(index)}
                >
                  {/* Animated background patterns */}
                  <div className="absolute inset-0 opacity-[0.03]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white rounded-full transform translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white rounded-full transform -translate-x-12 translate-y-12"></div>
                  </div>

                  {/* Subtle animated gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.02] transition-opacity duration-500 group-hover:opacity-[0.06]`}
                  ></div>

                  <div className="relative p-5 md:p-7">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <div
                        className={`relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-xl transform transition-transform duration-300 group-hover:scale-110`}
                      >
                        {/* Glow effect */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-2xl blur-md opacity-40 scale-110`}
                        ></div>
                        <IconComponent className="relative w-5 h-5 md:w-7 md:h-7 text-white drop-shadow-sm" />
                      </div>
                      <div className="flex items-center">
                        <div className={`text-right mr-3 ${card.textColor}`}>
                          <p className="text-sm md:text-base font-semibold opacity-90 mb-1">
                            {card.title}
                          </p>
                          <div className="flex items-center justify-end">
                            <div
                              className={`w-2 h-2 ${card.accentColor} rounded-full mr-2 opacity-60`}
                            ></div>
                            <p className="text-xs opacity-70 font-medium">
                              {card.count}{" "}
                              {card.count === 1 ? "expense" : "expenses"}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 md:w-6 md:h-6 ${
                            card.textColor
                          } transition-all duration-300 opacity-60 hover:opacity-100 ${
                            isExpanded ? "rotate-180" : ""
                          } md:hidden`}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-baseline">
                        <p
                          className={`text-3xl md:text-4xl font-black ${card.textColor} tracking-tight`}
                        >
                          ₹{card.amount.toFixed(2)}
                        </p>
                        <Sparkles
                          className={`w-4 h-4 ml-2 ${card.textColor} opacity-40`}
                        />
                      </div>

                      {(isExpanded || window.innerWidth >= 768) &&
                        index === 2 &&
                        monthlyExpenses.length > 0 && (
                          <div
                            className={`bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/30 transition-all duration-300`}
                          >
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <div
                                  className={`w-1.5 h-1.5 ${card.accentColor} rounded-full mr-2`}
                                ></div>
                                <span
                                  className={`${card.textColor} font-semibold`}
                                >
                                  Daily avg: ₹{dailyAverage.toFixed(2)}
                                </span>
                              </div>
                              <span
                                className={`${card.textColor} opacity-80 bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium border border-white/20`}
                              >
                                {new Date().getDate()} days
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      {expenses.length > 0 && (
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-xl border border-white/40 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 rounded-full transform -translate-x-24 translate-y-24"></div>

          <div className="relative">
            {/* Header with dropdown toggle */}
            <div
              className="flex items-center justify-between p-6 md:p-8 pb-4 md:pb-6 cursor-pointer md:cursor-default"
              onClick={() =>
                window.innerWidth < 768 &&
                setIsQuickStatsExpanded(!isQuickStatsExpanded)
              }
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-xl blur-md opacity-20"></div>
                  <div className="relative bg-gradient-to-r from-gray-500 to-gray-700 rounded-xl p-2.5 shadow-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-gray-800 text-lg md:text-xl">
                    Quick Stats
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">
                    Your expense insights
                  </p>
                </div>
              </div>

              {/* Dropdown toggle - only visible on mobile */}
              <div className="md:hidden">
                <ChevronDown
                  className={`w-6 h-6 text-gray-600 transition-all duration-300 ${
                    isQuickStatsExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {/* Collapsible content */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isQuickStatsExpanded
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-0 opacity-0 md:max-h-[1000px] md:opacity-100"
              }`}
            >
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                  {[
                    {
                      label: "Expenses",
                      value: expenses.length,
                      color: "from-blue-500 to-cyan-500",
                    },
                    {
                      label: "All Time",
                      value: `₹${calculateTotal(expenses).toFixed(0)}`,
                      color: "from-emerald-500 to-teal-500",
                    },
                    {
                      label: "Average",
                      value: `₹${
                        expenses.length > 0
                          ? (
                              calculateTotal(expenses) / expenses.length
                            ).toFixed(0)
                          : "0"
                      }`,
                      color: "from-purple-500 to-violet-500",
                    },
                    {
                      label: "Highest",
                      value: `₹${
                        expenses.length > 0
                          ? Math.max(...expenses.map((e) => e.amount)).toFixed(
                              0
                            )
                          : "0"
                      }`,
                      color: "from-pink-500 to-rose-500",
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      {/* Subtle glow effect on hover */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 rounded-xl md:rounded-2xl transition-opacity duration-300`}
                      ></div>

                      <div className="relative text-center">
                        <div
                          className={`w-3 h-3 bg-gradient-to-r ${stat.color} rounded-full mx-auto mb-3 shadow-sm`}
                        ></div>
                        <p className="text-xl md:text-3xl font-black text-gray-900 mb-2 tracking-tight">
                          {stat.value}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 font-semibold">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
