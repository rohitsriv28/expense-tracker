export function formatCurrency(
  amount: number,
  options: { compact?: boolean; currency?: string } = {},
): string {
  const { compact = false, currency = "INR" } = options;

  if (compact && Math.abs(amount) >= 100000) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}
