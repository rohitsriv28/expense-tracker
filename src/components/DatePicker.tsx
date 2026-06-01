import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  max?: Date;
  min?: Date;
  placeholder?: string;
}

/* ── helpers ────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aa < bb;
}

function isAfterDay(a: Date, b: Date): boolean {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aa > bb;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Returns the calendar grid cells for a given month (always 6 rows × 7 cols). */
function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  // Monday = 0 … Sunday = 6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];

  // Leading blanks
  for (let i = 0; i < startOffset; i++) cells.push(null);

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // Trailing blanks to fill the grid (up to 42 = 6 rows)
  while (cells.length < 42) cells.push(null);

  return cells;
}

/* ── component ──────────────────────────────────────────────────── */

type CalendarMode = "days" | "months" | "years";

const DatePicker = ({
  label,
  value,
  onChange,
  max,
  min,
  placeholder,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [mode, setMode] = useState<CalendarMode>("days");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync the calendar view when the value prop changes externally
  useEffect(() => {
    setViewYear(value.getFullYear());
    setViewMonth(value.getMonth());
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setMode("days");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setMode("days");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const cells = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const isDisabled = useCallback(
    (date: Date): boolean => {
      if (min && isBeforeDay(date, min)) return true;
      if (max && isAfterDay(date, max)) return true;
      return false;
    },
    [min, max],
  );

  const canGoPrev = useMemo(() => {
    if (!min) return true;
    // Can go prev if the first day of the current view month is after min
    return (
      new Date(viewYear, viewMonth, 1) >
      new Date(min.getFullYear(), min.getMonth(), 1)
    );
  }, [min, viewYear, viewMonth]);

  const canGoNext = useMemo(() => {
    if (!max) return true;
    return (
      new Date(viewYear, viewMonth, 1) <
      new Date(max.getFullYear(), max.getMonth(), 1)
    );
  }, [max, viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDate = (date: Date) => {
    onChange(date);
    setIsOpen(false);
    setMode("days");
  };

  const presets = useMemo(() => {
    const items: Array<{ label: string; date: Date }> = [];
    if (!isDisabled(today)) items.push({ label: "Today", date: today });
    if (!isDisabled(yesterday))
      items.push({ label: "Yesterday", date: yesterday });
    return items;
  }, [today, yesterday, isDisabled]);

  // Calculate how many rows we need (hide empty trailing rows)
  const visibleRows = useMemo(() => {
    let lastFilledIdx = 0;
    cells.forEach((cell, idx) => {
      if (cell !== null) lastFilledIdx = idx;
    });
    return Math.ceil((lastFilledIdx + 1) / 7);
  }, [cells]);

  const yearOptions = useMemo(() => {
    const minYear = min ? min.getFullYear() : today.getFullYear() - 20;
    const maxYear = max ? max.getFullYear() : today.getFullYear() + 10;
    const years = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [min, max, today]);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label
          className="mb-1.5 block text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm transition-all"
        style={{
          borderColor: isOpen ? "var(--border-focus)" : "var(--border-input)",
          background: "var(--bg-input)",
          color: "var(--text-primary)",
          boxShadow: isOpen
            ? "0 0 0 3px var(--interactive-primary-subtle)"
            : "none",
        }}
      >
        <CalendarDays
          className="h-4.5 w-4.5 shrink-0 transition-colors"
          style={{
            color: isOpen ? "var(--color-primary-500)" : "var(--text-tertiary)",
          }}
        />
        <span className="flex-1 tabular-nums">
          {value ? formatDisplay(value) : placeholder || "Pick a date"}
        </span>
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 w-[300px] origin-top animate-in fade-in slide-in-from-top-1 rounded-2xl border p-3 shadow-xl"
          style={{
            background: "var(--bg-card-elevated, var(--bg-card))",
            borderColor: "var(--border-default)",
          }}
        >
          {/* Presets */}
          {presets.length > 0 && mode === "days" && (
            <div className="mb-3 flex gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => selectDate(preset.date)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    background: sameDay(value, preset.date)
                      ? "var(--interactive-primary)"
                      : "var(--status-neutral-bg)",
                    color: sameDay(value, preset.date)
                      ? "#fff"
                      : "var(--text-secondary)",
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* Month/Year navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canGoPrev || mode !== "days"}
              className="rounded-lg p-1.5 transition-colors hover:bg-[var(--status-neutral-bg)] disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1 items-center">
              <button
                type="button"
                onClick={() => setMode(mode === "months" ? "days" : "months")}
                className="cursor-pointer bg-transparent text-sm font-semibold hover:bg-[var(--status-neutral-bg)] rounded px-2 py-1 focus:outline-none transition-colors"
                style={{
                  color: "var(--text-primary)",
                  background:
                    mode === "months"
                      ? "var(--status-neutral-bg)"
                      : "transparent",
                }}
              >
                {MONTH_NAMES[viewMonth]}
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === "years" ? "days" : "years")}
                className="cursor-pointer bg-transparent text-sm font-semibold hover:bg-[var(--status-neutral-bg)] rounded px-2 py-1 focus:outline-none tabular-nums transition-colors"
                style={{
                  color: "var(--text-primary)",
                  background:
                    mode === "years"
                      ? "var(--status-neutral-bg)"
                      : "transparent",
                }}
              >
                {viewYear}
              </button>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!canGoNext || mode !== "days"}
              className="rounded-lg p-1.5 transition-colors hover:bg-[var(--status-neutral-bg)] disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {mode === "days" && (
            <>
              {/* Day-of-week headers */}
              <div className="mb-1 grid grid-cols-7 text-center">
                {DAY_LABELS.map((d) => (
                  <span
                    key={d}
                    className="py-1 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {cells.slice(0, visibleRows * 7).map((cell, idx) => {
                  if (!cell) {
                    return <div key={`blank-${idx}`} className="h-9" />;
                  }

                  const selected = sameDay(cell, value);
                  const isToday = sameDay(cell, today);
                  const disabled = isDisabled(cell);

                  return (
                    <button
                      key={cell.toISOString()}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDate(cell)}
                      className="relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-25 disabled:pointer-events-none"
                      style={{
                        background: selected
                          ? "var(--interactive-primary)"
                          : "transparent",
                        color: selected
                          ? "#fff"
                          : isToday
                            ? "var(--color-primary-500)"
                            : "var(--text-primary)",
                        fontWeight: isToday ? 700 : selected ? 600 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!selected && !disabled) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "var(--status-neutral-bg)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "transparent";
                        }
                      }}
                    >
                      {cell.getDate()}
                      {/* Today indicator dot */}
                      {isToday && !selected && (
                        <span
                          className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                          style={{ background: "var(--color-primary-500)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {mode === "months" && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {MONTH_NAMES.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setViewMonth(i);
                    setMode("days");
                  }}
                  className="rounded-lg py-3 px-2 text-sm font-semibold transition-colors hover:bg-[var(--status-neutral-bg)]"
                  style={{
                    background:
                      i === viewMonth
                        ? "var(--interactive-primary)"
                        : "transparent",
                    color: i === viewMonth ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {m.substring(0, 3)}
                </button>
              ))}
            </div>
          )}

          {mode === "years" && (
            <div className="grid grid-cols-4 gap-2 mt-2 max-h-[240px] overflow-y-auto px-1 pb-1 custom-scrollbar">
              {yearOptions.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setViewYear(y);
                    setMode("days");
                  }}
                  className="rounded-lg py-3 px-1 text-sm font-semibold tabular-nums transition-colors hover:bg-[var(--status-neutral-bg)]"
                  style={{
                    background:
                      y === viewYear
                        ? "var(--interactive-primary)"
                        : "transparent",
                    color: y === viewYear ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
