import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";

interface Expense {
  date: { toDate(): Date };
  remarks: string;
  amount: number;
  category?: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Generates a premium professional PDF expense report.
 * @param expenses Array of expense objects.
 * @param dateRange Optional date range to filter expenses.
 * @returns PDF bytes as Uint8Array.
 */
export const generateExpensePDF = async (
  expenses: Expense[],
  _unused1?: unknown,
  _unused2?: unknown,
  dateRange?: DateRange
): Promise<Uint8Array> => {
  // Filter expenses by date range if provided
  let filteredExpenses = expenses;
  if (dateRange) {
    filteredExpenses = expenses.filter((expense) => {
      const expenseDate = expense.date.toDate();
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
    });
  }

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Professional Red/Black Palette
  const colors = {
    primary: rgb(0.694, 0.07, 0.149), // #B11226 (Premium Crimson Red)
    secondary: rgb(0.839, 0.121, 0.227), // #D61F3A (Dark Mode Red)
    accent: rgb(0.97, 0.97, 0.97), // Very light grey for backgrounds
    headerText: rgb(1, 1, 1), // White
    text: rgb(0, 0, 0), // Black
    subtext: rgb(0.3, 0.3, 0.3), // Dark Grey
    border: rgb(0.8, 0.8, 0.8), // Light Grey
  };

  // Margins
  const margin = { top: 50, bottom: 50, left: 50, right: 50 };
  const contentWidth = width - margin.left - margin.right;
  let cursorY = height - margin.top;

  // Helper function to draw horizontal lines
  const drawLine = (y: number, thickness = 0.5, color = colors.border) => {
    page.drawLine({
      start: { x: margin.left, y },
      end: { x: width - margin.right, y },
      color,
      thickness,
    });
  };

  // --- Header Section ---
  // Gradient-like background for header
  page.drawRectangle({
    x: 0,
    y: cursorY - 60,
    width: width,
    height: 110,
    color: colors.primary,
  });

  page.drawText("CashFlow", {
    x: margin.left,
    y: cursorY - 15,
    size: 26,
    font: boldFont,
    color: colors.headerText,
  });

  page.drawText("Financial Summary & Analysis", {
    x: margin.left,
    y: cursorY - 35,
    size: 10,
    font: regularFont,
    color: rgb(0.9, 0.9, 0.9), // Slightly transparent white
  });

  // Report details in header (Right side)
  const reportDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  page.drawText("GENERATED ON", {
    x: width - margin.right - 120,
    y: cursorY - 10,
    size: 8,
    font: boldFont,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawText(reportDate, {
    x: width - margin.right - 120,
    y: cursorY - 25,
    size: 10,
    font: regularFont,
    color: colors.headerText,
  });

  if (dateRange) {
    const rangeText = `${dateRange.start.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    })} - ${dateRange.end.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;

    page.drawText("PERIOD", {
      x: width - margin.right - 120,
      y: cursorY - 40,
      size: 8,
      font: boldFont,
      color: rgb(0.9, 0.9, 0.9),
    });
    page.drawText(rangeText, {
      x: width - margin.right - 120,
      y: cursorY - 53,
      size: 10,
      font: regularFont,
      color: colors.headerText,
    });
  }

  cursorY -= 100;

  // --- Executive Summary Cards ---
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgTransaction =
    filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;

  // Draw 3 Summary Cards
  const cardWidth = (contentWidth - 20) / 3;
  const cardHeight = 60;

  const drawSummaryCard = (
    title: string,
    value: string,
    x: number,
    y: number
  ) => {
    // Card Background/Border
    page.drawRectangle({
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      color: colors.accent,
      borderColor: colors.border,
      borderWidth: 1,
    });

    page.drawText(title.toUpperCase(), {
      x: x + 12,
      y: y + cardHeight - 18,
      size: 8,
      font: boldFont,
      color: colors.subtext,
    });

    page.drawText(value, {
      x: x + 12,
      y: y + 15,
      size: 16,
      font: boldFont,
      color: colors.primary,
    });
  };

  drawSummaryCard(
    "Total Spend",
    `Rs. ${totalAmount.toLocaleString("en-IN")}`,
    margin.left,
    cursorY - cardHeight
  );
  drawSummaryCard(
    "Transactions",
    filteredExpenses.length.toString(),
    margin.left + cardWidth + 10,
    cursorY - cardHeight
  );
  drawSummaryCard(
    "Average / Txn",
    `Rs. ${avgTransaction.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`,
    margin.left + (cardWidth + 10) * 2,
    cursorY - cardHeight
  );

  cursorY -= cardHeight + 40;

  // --- Category Breakdown Section ---
  if (filteredExpenses.length > 0) {
    page.drawText("Category Breakdown", {
      x: margin.left,
      y: cursorY,
      size: 14,
      font: boldFont,
      color: colors.text,
    });
    cursorY -= 15;
    drawLine(cursorY);
    cursorY -= 20;

    // Calculate totals by category
    const categoryTotals: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });

    // Sort by amount desc
    const sortedCategories = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    );

    // Draw Category List (No bars as per request)
    // Draw Category List (No bars as per request)
    sortedCategories.slice(0, 5).forEach(([cat, amount]) => {
      const y = cursorY;

      // Category Name
      page.drawText(cat, {
        x: margin.left,
        y,
        size: 10,
        font: regularFont,
        color: colors.text,
      });

      // Amount
      page.drawText(`Rs. ${amount.toLocaleString("en-IN")}`, {
        x: width - margin.right - 80,
        y,
        size: 10,
        font: boldFont,
        color: colors.text,
      });

      cursorY -= 20;
    });

    if (sortedCategories.length > 5) {
      cursorY -= 5;
      page.drawText(`+ ${sortedCategories.length - 5} other categories...`, {
        x: margin.left,
        y: cursorY,
        size: 9,
        font: regularFont,
        color: colors.subtext,
      });
      cursorY -= 20;
    }

    cursorY -= 20;
  }

  // --- Transactions List ---
  page.drawText("Transaction Details", {
    x: margin.left,
    y: cursorY,
    size: 14,
    font: boldFont,
    color: colors.text,
  });
  cursorY -= 15;

  // Table Headers
  const tableTop = cursorY;
  page.drawRectangle({
    x: margin.left,
    y: tableTop - 20,
    width: contentWidth,
    height: 24,
    color: colors.accent,
  });

  const colX = {
    date: margin.left + 10,
    category: margin.left + 100,
    desc: margin.left + 220,
    amount: width - margin.right - 20,
  };

  const drawTableHeaders = (y: number) => {
    page.drawText("DATE", {
      x: colX.date,
      y: y - 14,
      size: 9,
      font: boldFont,
      color: colors.primary,
    });
    page.drawText("CATEGORY", {
      x: colX.category,
      y: y - 14,
      size: 9,
      font: boldFont,
      color: colors.primary,
    });
    page.drawText("DESCRIPTION", {
      x: colX.desc,
      y: y - 14,
      size: 9,
      font: boldFont,
      color: colors.primary,
    });
    const amtWidth = boldFont.widthOfTextAtSize("AMOUNT", 9);
    page.drawText("AMOUNT", {
      x: colX.amount - amtWidth,
      y: y - 14,
      size: 9,
      font: boldFont,
      color: colors.primary,
    });
  };

  drawTableHeaders(tableTop);
  cursorY -= 40;

  // Rows
  for (const exp of filteredExpenses) {
    if (cursorY < margin.bottom + 40) {
      page = pdfDoc.addPage(PageSizes.A4);
      cursorY = height - margin.top;
      // Re-draw header on new page
      page.drawRectangle({
        x: margin.left,
        y: cursorY - 20,
        width: contentWidth,
        height: 24,
        color: colors.accent,
      });
      drawTableHeaders(cursorY);
      cursorY -= 40;
    }

    const dateStr = exp.date.toDate().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    page.drawText(dateStr, {
      x: colX.date,
      y: cursorY,
      size: 9,
      font: regularFont,
      color: colors.text,
    });

    // Category Badge
    const cat = exp.category || "General";
    // Shorten if needed
    const displayCat = cat.length > 15 ? cat.substring(0, 12) + "..." : cat;

    page.drawText(displayCat, {
      x: colX.category,
      y: cursorY,
      size: 9,
      font: regularFont,
      color: colors.text,
    });

    // Description
    const desc =
      exp.remarks.length > 35
        ? exp.remarks.substring(0, 32) + "..."
        : exp.remarks;
    page.drawText(desc, {
      x: colX.desc,
      y: cursorY,
      size: 9,
      font: regularFont,
      color: colors.subtext,
    });

    // Amount
    const amtStr = `Rs. ${exp.amount.toLocaleString("en-IN")}`;
    const amtWidth = regularFont.widthOfTextAtSize(amtStr, 9);
    page.drawText(amtStr, {
      x: colX.amount - amtWidth,
      y: cursorY,
      size: 9,
      font: boldFont,
      color: colors.text,
    });

    // Separator line
    drawLine(cursorY - 8, 0.5, rgb(0.95, 0.95, 0.95));
    cursorY -= 24;
  }

  // --- Footer ---
  const pages = pdfDoc.getPages();
  pages.forEach((pg, idx) => {
    const footerY = margin.bottom - 20;

    // Page number centered
    const pageNum = `${idx + 1} / ${pages.length}`;
    const pWidth = regularFont.widthOfTextAtSize(pageNum, 8);

    pg.drawText(pageNum, {
      x: (width - pWidth) / 2,
      y: footerY,
      size: 8,
      font: regularFont,
      color: colors.subtext,
    });
  });

  return pdfDoc.save();
};
