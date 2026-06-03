import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
  type RGB,
} from "pdf-lib";
import type { Expense } from "./firebase";
import type { Income } from "./incomeService";
import type { BudgetPeriodSummary } from "./budgetService";
import type { Category } from "./categoryService";
import { expenseDate, resolveExpenseVisuals } from "../utils/dataMappers";
import { formatCurrency } from "../utils/formatters";

interface DateRange {
  start: Date;
  end: Date;
  label?: string;
}

interface ReportData {
  period: { label: string; start: Date; end: Date };
  expenses: Expense[];
  income: Income[];
  budgets: BudgetPeriodSummary[];
  categories: Category[];
  userName: string;
}

interface PdfContext {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  colors: {
    primary: RGB;
    income: RGB;
    expense: RGB;
    text: RGB;
    textSecondary: RGB;
    border: RGB;
    bgAlt: RGB;
    white: RGB;
  };
}

const margin = 48;

function pdfText(text: string): string {
  return text.replace(/₹/g, "Rs. ").replace(/[^\x20-\x7E]/g, "-");
}

function colorFromHex(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(
    Number.isFinite(r) ? r : 0.58,
    Number.isFinite(g) ? g : 0.64,
    Number.isFinite(b) ? b : 0.72,
  );
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
) {
  page.drawText(pdfText(text), { x, y, size, font, color });
}

function drawHeader(
  page: PDFPage,
  ctx: PdfContext,
  title: string,
  subtitle?: string,
) {
  const { width, height } = page.getSize();
  drawText(page, title, margin, height - margin, 18, ctx.bold, ctx.colors.text);
  if (subtitle)
    drawText(
      page,
      subtitle,
      margin,
      height - margin - 18,
      10,
      ctx.font,
      ctx.colors.textSecondary,
    );
  page.drawLine({
    start: { x: margin, y: height - margin - 30 },
    end: { x: width - margin, y: height - margin - 30 },
    color: ctx.colors.border,
    thickness: 1,
  });
}

function drawMetricCard(
  page: PDFPage,
  ctx: PdfContext,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: ctx.colors.bgAlt,
    borderColor: ctx.colors.border,
    borderWidth: 1,
  });
  drawText(
    page,
    label.toUpperCase(),
    x + 12,
    y + height - 18,
    8,
    ctx.bold,
    ctx.colors.textSecondary,
  );
  drawText(page, value, x + 12, y + 14, 15, ctx.bold, ctx.colors.text);
}

function categoryRows(expenses: Expense[], categories: Category[]) {
  const map = new Map<
    string,
    { amount: number; count: number; color: string }
  >();
  expenses.forEach((expense) => {
    const name = expense.category || "Uncategorized";
    const visuals = resolveExpenseVisuals(categories, name);
    const current = map.get(name) ?? {
      amount: 0,
      count: 0,
      color: visuals.color,
    };
    map.set(name, {
      ...current,
      amount: current.amount + expense.amount,
      count: current.count + 1,
    });
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.amount - a.amount);
}

function addCoverPage(ctx: PdfContext, data: ReportData) {
  const page = ctx.doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  page.drawRectangle({
    x: 0,
    y: height - 150,
    width,
    height: 150,
    color: ctx.colors.primary,
  });
  drawText(
    page,
    "CashFlow",
    margin,
    height - 70,
    28,
    ctx.bold,
    ctx.colors.white,
  );
  drawText(
    page,
    "Financial Report",
    margin,
    height - 96,
    15,
    ctx.font,
    ctx.colors.white,
  );
  drawText(
    page,
    data.period.label,
    margin,
    height - 116,
    11,
    ctx.font,
    ctx.colors.white,
  );
  drawText(
    page,
    `Generated for ${data.userName}`,
    width - 220,
    height - 76,
    10,
    ctx.font,
    ctx.colors.white,
  );
  drawText(
    page,
    new Date().toLocaleDateString("en-IN"),
    width - 220,
    height - 94,
    10,
    ctx.font,
    ctx.colors.white,
  );

  const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = data.expenses.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const netSavings = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0
      ? `${Math.round((netSavings / totalIncome) * 100)}%`
      : "N/A";
  const avgExpense =
    data.expenses.length > 0 ? totalExpenses / data.expenses.length : 0;
  const metrics = [
    ["Total Income", formatCurrency(totalIncome)],
    ["Total Expenses", formatCurrency(totalExpenses)],
    ["Net Savings", formatCurrency(netSavings)],
    ["Savings Rate", savingsRate],
    ["Transactions", String(data.expenses.length)],
    ["Avg Expense", formatCurrency(avgExpense)],
  ];

  const cardWidth = (width - margin * 2 - 18) / 2;
  const cardHeight = 64;
  metrics.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    drawMetricCard(
      page,
      ctx,
      label,
      value,
      margin + col * (cardWidth + 18),
      height - 240 - row * 82,
      cardWidth,
      cardHeight,
    );
  });
}

function addCategoryPage(ctx: PdfContext, data: ReportData) {
  const page = ctx.doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  drawHeader(page, ctx, "Spending by Category", data.period.label);
  const rows = categoryRows(data.expenses, data.categories);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  let y = height - 120;
  const barMax = width - margin * 2 - 170;

  rows.forEach((row) => {
    const percentage = total > 0 ? row.amount / total : 0;
    drawText(
      page,
      row.name.slice(0, 24),
      margin,
      y,
      10,
      ctx.font,
      ctx.colors.text,
    );
    page.drawRectangle({
      x: margin + 130,
      y: y - 2,
      width: barMax,
      height: 9,
      color: ctx.colors.bgAlt,
    });
    page.drawRectangle({
      x: margin + 130,
      y: y - 2,
      width: barMax * percentage,
      height: 9,
      color: colorFromHex(row.color),
    });
    drawText(
      page,
      `${formatCurrency(row.amount)}  ${Math.round(percentage * 100)}%`,
      width - 150,
      y,
      9,
      ctx.font,
      ctx.colors.textSecondary,
    );
    y -= 24;
  });

  y -= 18;
  drawText(page, "Category", margin, y, 9, ctx.bold, ctx.colors.textSecondary);
  drawText(
    page,
    "Amount",
    margin + 190,
    y,
    9,
    ctx.bold,
    ctx.colors.textSecondary,
  );
  drawText(
    page,
    "% of Total",
    margin + 300,
    y,
    9,
    ctx.bold,
    ctx.colors.textSecondary,
  );
  drawText(
    page,
    "Transactions",
    margin + 400,
    y,
    9,
    ctx.bold,
    ctx.colors.textSecondary,
  );
  y -= 18;

  rows.forEach((row) => {
    const percentage = total > 0 ? (row.amount / total) * 100 : 0;
    drawText(
      page,
      row.name.slice(0, 28),
      margin,
      y,
      9,
      ctx.font,
      ctx.colors.text,
    );
    drawText(
      page,
      formatCurrency(row.amount),
      margin + 190,
      y,
      9,
      ctx.font,
      ctx.colors.text,
    );
    drawText(
      page,
      `${percentage.toFixed(1)}%`,
      margin + 300,
      y,
      9,
      ctx.font,
      ctx.colors.text,
    );
    drawText(
      page,
      String(row.count),
      margin + 400,
      y,
      9,
      ctx.font,
      ctx.colors.text,
    );
    y -= 16;
  });
}

function addTransactionPages(ctx: PdfContext, data: ReportData) {
  const sorted = [...data.expenses].sort(
    (a, b) => expenseDate(b).getTime() - expenseDate(a).getTime(),
  );
  let page = ctx.doc.addPage(PageSizes.A4);
  let { width, height } = page.getSize();
  let y = height - 110;
  drawHeader(page, ctx, `Transactions - ${data.period.label}`);

  const drawTableHeader = () => {
    drawText(page, "Date", margin, y, 9, ctx.bold, ctx.colors.textSecondary);
    drawText(
      page,
      "Category",
      margin + 80,
      y,
      9,
      ctx.bold,
      ctx.colors.textSecondary,
    );
    drawText(
      page,
      "Description",
      margin + 190,
      y,
      9,
      ctx.bold,
      ctx.colors.textSecondary,
    );
    drawText(
      page,
      "Amount",
      width - 110,
      y,
      9,
      ctx.bold,
      ctx.colors.textSecondary,
    );
    y -= 18;
  };

  drawTableHeader();
  sorted.forEach((expense, index) => {
    if (y < 70) {
      page = ctx.doc.addPage(PageSizes.A4);
      width = page.getSize().width;
      height = page.getSize().height;
      y = height - 110;
      drawHeader(page, ctx, `Transactions - ${data.period.label}`);
      drawTableHeader();
    }

    if (index % 2 === 0) {
      page.drawRectangle({
        x: margin - 6,
        y: y - 5,
        width: width - margin * 2 + 12,
        height: 17,
        color: ctx.colors.bgAlt,
      });
    }

    const visuals = resolveExpenseVisuals(data.categories, expense.category);
    page.drawCircle({
      x: margin + 86,
      y: y + 4,
      size: 3,
      color: colorFromHex(visuals.color),
    });
    drawText(
      page,
      expenseDate(expense).toLocaleDateString("en-IN"),
      margin,
      y,
      8,
      ctx.font,
      ctx.colors.text,
    );
    drawText(
      page,
      visuals.categoryName.slice(0, 18),
      margin + 96,
      y,
      8,
      ctx.font,
      ctx.colors.text,
    );
    drawText(
      page,
      expense.remarks.slice(0, 36),
      margin + 190,
      y,
      8,
      ctx.font,
      ctx.colors.textSecondary,
    );
    const amount = formatCurrency(expense.amount);
    drawText(page, amount, width - 110, y, 8, ctx.font, ctx.colors.text);
    y -= 17;
  });
}

function addBudgetPage(ctx: PdfContext, data: ReportData) {
  if (data.budgets.length === 0) return;
  const page = ctx.doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  drawHeader(page, ctx, "Budget Performance", data.period.label);
  let y = height - 120;
  const barWidth = width - margin * 2 - 210;

  data.budgets.forEach((summary) => {
    drawText(
      page,
      summary.budget.name,
      margin,
      y,
      10,
      ctx.bold,
      ctx.colors.text,
    );
    drawText(
      page,
      `${formatCurrency(summary.spent)} / ${formatCurrency(summary.budget.amount)}`,
      width - 150,
      y,
      9,
      ctx.font,
      ctx.colors.textSecondary,
    );
    y -= 16;
    page.drawRectangle({
      x: margin,
      y,
      width: barWidth,
      height: 8,
      color: ctx.colors.bgAlt,
    });
    page.drawRectangle({
      x: margin,
      y,
      width: Math.min(barWidth, barWidth * (summary.percentage / 100)),
      height: 8,
      color:
        summary.status === "safe"
          ? ctx.colors.income
          : summary.status === "warning"
            ? rgb(0.961, 0.62, 0.043)
            : ctx.colors.expense,
    });
    drawText(
      page,
      `${Math.round(summary.percentage)}%`,
      margin + barWidth + 12,
      y - 1,
      8,
      ctx.font,
      ctx.colors.textSecondary,
    );
    y -= 28;
  });
}

function addFooters(ctx: PdfContext) {
  const pages = ctx.doc.getPages();
  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const text = `Page ${index + 1} of ${pages.length}`;
    const textWidth = ctx.font.widthOfTextAtSize(text, 8);
    drawText(
      page,
      text,
      (width - textWidth) / 2,
      28,
      8,
      ctx.font,
      ctx.colors.textSecondary,
    );
  });
}

export async function generatePDFReport(data: ReportData): Promise<void> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: PdfContext = {
    doc,
    font,
    bold,
    colors: {
      primary: rgb(0.388, 0.4, 0.945),
      income: rgb(0.133, 0.773, 0.369),
      expense: rgb(0.957, 0.247, 0.369),
      text: rgb(0.059, 0.09, 0.161),
      textSecondary: rgb(0.278, 0.337, 0.459),
      border: rgb(0.882, 0.914, 0.941),
      bgAlt: rgb(0.973, 0.98, 0.992),
      white: rgb(1, 1, 1),
    },
  };

  addCoverPage(ctx, data);
  addCategoryPage(ctx, data);
  addTransactionPages(ctx, data);
  addBudgetPage(ctx, data);
  addFooters(ctx);

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cashflow-report-${data.period.label.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const generateExpensePDF = async (
  expenses: Expense[],
  _unused1?: unknown,
  _unused2?: unknown,
  dateRange?: DateRange,
): Promise<Uint8Array> => {
  const start = dateRange?.start ?? new Date(0);
  const end = dateRange?.end ?? new Date();
  const filteredExpenses = expenses.filter((expense) => {
    const date = expenseDate(expense);
    return date >= start && date <= end;
  });

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: PdfContext = {
    doc,
    font,
    bold,
    colors: {
      primary: rgb(0.388, 0.4, 0.945),
      income: rgb(0.133, 0.773, 0.369),
      expense: rgb(0.957, 0.247, 0.369),
      text: rgb(0.059, 0.09, 0.161),
      textSecondary: rgb(0.278, 0.337, 0.459),
      border: rgb(0.882, 0.914, 0.941),
      bgAlt: rgb(0.973, 0.98, 0.992),
      white: rgb(1, 1, 1),
    },
  };

  addCoverPage(ctx, {
    period: { start, end, label: dateRange?.label ?? "Expense Report" },
    expenses: filteredExpenses,
    income: [],
    budgets: [],
    categories: [],
    userName: "CashFlow user",
  });
  addTransactionPages(ctx, {
    period: { start, end, label: dateRange?.label ?? "Expense Report" },
    expenses: filteredExpenses,
    income: [],
    budgets: [],
    categories: [],
    userName: "CashFlow user",
  });
  addFooters(ctx);
  return doc.save();
};
