export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const getCurrentMonth = (date: Date) =>
  date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export const getWeekRange = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 1, 0); // Changed to 00:00:01

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return [start, end];
};

export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 1, 0); // Sets to 00:00:01
  return d;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return getStartOfDay(d);
}

export function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  return getStartOfDay(d);
}

export function getStartOfYear(date: Date): Date {
  const d = new Date(date);
  d.setMonth(0, 1); // January 1st
  return getStartOfDay(d);
}

// New function to get end of period
export function getEndOfPeriod(
  start: Date,
  period: "daily" | "weekly" | "monthly"
): Date {
  const end = new Date(start);

  switch (period) {
    case "daily":
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return end;
}

// New function to get filter label
export function getFilterLabel(period: "daily" | "weekly" | "monthly"): string {
  switch (period) {
    case "daily":
      return "Today";
    case "weekly":
      return "This Week";
    case "monthly":
      return "This Month";
    default:
      return "";
  }
}

export function toLocalISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
