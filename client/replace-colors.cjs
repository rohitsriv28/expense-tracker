const fs = require("fs");

const file =
  "c:/Users/Rohit/Desktop/expense-tracker/client/src/components/pdf-preview/PdfReportTemplate.tsx";
let content = fs.readFileSync(file, "utf8");

const map = {
  "slate-50": "#f8fafc",
  "slate-100": "#f1f5f9",
  "slate-200": "#e2e8f0",
  "slate-500": "#64748b",
  "slate-600": "#475569",
  "slate-700": "#334155",
  "slate-800": "#1e293b",
  "slate-900": "#0f172a",

  "indigo-50": "#eef2ff",
  "indigo-100": "#e0e7ff",
  "indigo-200": "#c7d2fe",
  "indigo-400": "#818cf8",
  "indigo-500": "#6366f1",
  "indigo-600": "#4f46e5",
  "indigo-800": "#3730a3",
  "indigo-900": "#312e81",
  "indigo-950": "#1e1b4b",

  "emerald-50": "#ecfdf5",
  "emerald-100": "#d1fae5",
  "emerald-400": "#34d399",
  "emerald-500": "#10b981",
  "emerald-600": "#059669",

  "green-50": "#f0fdf4",
  "green-600": "#16a34a",

  "rose-500": "#f43f5e",
  "rose-600": "#e11d48",

  "amber-50": "#fffbeb",
  "amber-100": "#fef3c7",
  "amber-500": "#f59e0b",
  "amber-600": "#d97706",
};

// Replace text-color, bg-color, border-color, from-color, via-color, to-color
Object.keys(map).forEach((color) => {
  const hex = map[color];
  const regex = new RegExp(
    `(?<=[\\s"'\\\`])(text|bg|border|from|via|to)-${color}(?=[\\s"'\\\`/])`,
    "g",
  );
  content = content.replace(regex, `$1-[${hex}]`);
});

fs.writeFileSync(file, content);
console.log("Replaced colors");
