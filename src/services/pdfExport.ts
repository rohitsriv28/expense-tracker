import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";

interface Expense {
  date: { toDate(): Date };
  remarks: string;
  amount: number;
  category?: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  logo?: Uint8Array;
}

interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Generates a basic professional PDF expense report.
 * @param expenses Array of expense objects.
 * @param companyInfo Optional company information for header.
 * @param reportTitle Optional report title.
 * @param dateRange Optional date range to filter expenses.
 * @returns PDF bytes as Uint8Array.
 */
export const generateExpensePDF = async (
  expenses: Expense[],
  companyInfo?: CompanyInfo,
  reportTitle = "Expense Report",
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

  // Professional color palette - Red, Black, Grey
  const colors = {
    primary: rgb(0.8, 0.1, 0.1), // Professional red
    accent: rgb(0.6, 0.05, 0.05), // Darker red
    black: rgb(0, 0, 0),
    darkGrey: rgb(0.3, 0.3, 0.3),
    mediumGrey: rgb(0.5, 0.5, 0.5),
    lightGrey: rgb(0.8, 0.8, 0.8),
    veryLightGrey: rgb(0.95, 0.95, 0.95),
    white: rgb(1, 1, 1),
  };

  // Margins
  const margin = { top: 60, bottom: 60, left: 60, right: 60 };
  const contentWidth = width - margin.left - margin.right;
  let cursorY = height - margin.top;

  // Helper function to draw horizontal lines
  const drawLine = (y: number, thickness = 0.5, color = colors.mediumGrey) => {
    page.drawLine({
      start: { x: margin.left, y },
      end: { x: width - margin.right, y },
      color,
      thickness,
    });
  };

  // --- Header Section ---
  // CashFlow brand header with red accent
  page.drawRectangle({
    x: margin.left - 10,
    y: cursorY - 35,
    width: contentWidth + 20,
    height: 35,
    color: colors.black,
  });

  // Red accent stripe
  page.drawRectangle({
    x: margin.left - 10,
    y: cursorY - 5,
    width: contentWidth + 20,
    height: 3,
    color: colors.primary,
  });

  page.drawText("CashFlow", {
    x: margin.left + 10,
    y: cursorY - 25,
    size: 22,
    font: boldFont,
    color: colors.white,
  });

  page.drawText("Financial Reporting System", {
    x: margin.left + 140,
    y: cursorY - 20,
    size: 10,
    font: regularFont,
    color: colors.lightGrey,
  });

  cursorY -= 50;

  if (companyInfo) {
    page.drawText(companyInfo.name.toUpperCase(), {
      x: margin.left,
      y: cursorY,
      size: 14,
      font: boldFont,
      color: colors.black,
    });
    cursorY -= 18;

    page.drawText(companyInfo.address, {
      x: margin.left,
      y: cursorY,
      size: 10,
      font: regularFont,
      color: colors.darkGrey,
    });
    cursorY -= 15;

    if (companyInfo.phone || companyInfo.email) {
      const contact = [companyInfo.phone, companyInfo.email]
        .filter(Boolean)
        .join(" | ");
      page.drawText(contact, {
        x: margin.left,
        y: cursorY,
        size: 10,
        font: regularFont,
        color: colors.darkGrey,
      });
      cursorY -= 15;
    }
  }

  // Draw line under header
  drawLine(cursorY, 1, colors.primary);
  cursorY -= 30;

  // --- Title and Date ---
  page.drawText(reportTitle.toUpperCase(), {
    x: margin.left,
    y: cursorY,
    size: 18,
    font: boldFont,
    color: colors.primary,
  });

  // If dateRange is provided, show the date range in the report
  let dateRangeStr = "";
  if (dateRange) {
    const startStr = dateRange.start.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const endStr = dateRange.end.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    dateRangeStr = ` (${startStr} - ${endStr})`;
  }

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  page.drawText(`Report Date: ${dateStr}${dateRangeStr}`, {
    x: width - margin.right - 250, // Adjusted for longer text
    y: cursorY,
    size: 10,
    font: regularFont,
    color: colors.darkGrey,
    maxWidth: 250,
  });
  cursorY -= 40;

  // --- Summary Section ---
  const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const transactionCount = filteredExpenses.length;

  // Summary header with red background
  page.drawRectangle({
    x: margin.left - 5,
    y: cursorY - 20,
    width: contentWidth + 10,
    height: 20,
    color: colors.primary,
  });

  page.drawText("SUMMARY", {
    x: margin.left,
    y: cursorY - 12,
    size: 12,
    font: boldFont,
    color: colors.white,
  });
  cursorY -= 35;

  // Summary details
  const summaryItems = [
    {
      label: "Total Expenses:",
      value: `Rs. ${total.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}`,
    },
    { label: "Number of Transactions:", value: `${transactionCount}` },
  ];

  summaryItems.forEach((item) => {
    page.drawText(item.label, {
      x: margin.left + 20,
      y: cursorY,
      size: 10,
      font: regularFont,
      color: colors.black,
    });
    page.drawText(item.value, {
      x: margin.left + 200,
      y: cursorY,
      size: 10,
      font: boldFont,
      color: colors.black,
    });
    cursorY -= 18;
  });

  cursorY -= 20;
  drawLine(cursorY, 1, colors.primary);
  cursorY -= 30;

  // --- Transaction Table ---
  // Table header with black background
  page.drawRectangle({
    x: margin.left - 5,
    y: cursorY - 25,
    width: contentWidth + 10,
    height: 25,
    color: colors.black,
  });

  page.drawText("TRANSACTION DETAILS", {
    x: margin.left,
    y: cursorY - 8,
    size: 12,
    font: boldFont,
    color: colors.white,
  });
  cursorY -= 40;

  // Table headers with grey background
  page.drawRectangle({
    x: margin.left - 5,
    y: cursorY - 18,
    width: contentWidth + 10,
    height: 18,
    color: colors.mediumGrey,
  });

  const columnPositions = {
    date: margin.left,
    description: margin.left + 80,
    amount: width - margin.right - 100,
  };

  page.drawText("Date", {
    x: columnPositions.date,
    y: cursorY - 8,
    size: 10,
    font: boldFont,
    color: colors.white,
  });
  page.drawText("Description", {
    x: columnPositions.description,
    y: cursorY - 8,
    size: 10,
    font: boldFont,
    color: colors.white,
  });
  page.drawText("Amount", {
    x: columnPositions.amount,
    y: cursorY - 8,
    size: 10,
    font: boldFont,
    color: colors.white,
  });

  cursorY -= 25;
  drawLine(cursorY, 0.5, colors.lightGrey);
  cursorY -= 20;

  // Transaction rows
  const rowHeight = 20;
  let rowIndex = 0;
  for (const expense of filteredExpenses) {
    // Check if we need a new page
    if (cursorY < margin.bottom + 100) {
      page = pdfDoc.addPage(PageSizes.A4);
      cursorY = height - margin.top;

      // Redraw table headers on new page with grey background
      page.drawRectangle({
        x: margin.left - 5,
        y: cursorY - 18,
        width: contentWidth + 10,
        height: 18,
        color: colors.mediumGrey,
      });

      page.drawText("Date", {
        x: columnPositions.date,
        y: cursorY - 8,
        size: 10,
        font: boldFont,
        color: colors.white,
      });
      page.drawText("Description", {
        x: columnPositions.description,
        y: cursorY - 8,
        size: 10,
        font: boldFont,
        color: colors.white,
      });
      page.drawText("Amount", {
        x: columnPositions.amount,
        y: cursorY - 8,
        size: 10,
        font: boldFont,
        color: colors.white,
      });
      cursorY -= 25;
      drawLine(cursorY, 0.5, colors.lightGrey);
      cursorY -= 20;
      rowIndex = 0; // Reset row index for alternating colors
    }

    // Alternating row background
    if (rowIndex % 2 === 1) {
      page.drawRectangle({
        x: margin.left - 5,
        y: cursorY - rowHeight + 5,
        width: contentWidth + 10,
        height: rowHeight,
        color: colors.veryLightGrey,
      });
    }

    // Format date
    const expenseDate = expense.date.toDate().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });

    // Truncate description if too long
    let description = expense.remarks;
    if (description.length > 45) {
      description = description.slice(0, 42) + "...";
    }

    // Draw transaction data
    page.drawText(expenseDate, {
      x: columnPositions.date,
      y: cursorY,
      size: 9,
      font: regularFont,
      color: colors.black,
    });

    page.drawText(description, {
      x: columnPositions.description,
      y: cursorY,
      size: 9,
      font: regularFont,
      color: colors.black,
    });

    page.drawText(
      `Rs. ${expense.amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}`,
      {
        x: columnPositions.amount,
        y: cursorY,
        size: 9,
        font: regularFont,
        color: colors.black,
      }
    );

    cursorY -= rowHeight;
  }

  // --- Total Section ---
  cursorY -= 20;
  drawLine(cursorY, 1);
  cursorY -= 25;

  page.drawText("TOTAL:", {
    x: columnPositions.amount - 50,
    y: cursorY,
    size: 12,
    font: boldFont,
    color: colors.black,
  });

  page.drawText(
    `Rs. ${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    {
      x: columnPositions.amount,
      y: cursorY,
      size: 12,
      font: boldFont,
      color: colors.black,
    }
  );

  // Double line under total
  cursorY -= 10;
  drawLine(cursorY, 1);
  cursorY -= 3;
  drawLine(cursorY, 1);

  // --- Footer ---
  const pages = pdfDoc.getPages();
  pages.forEach((pg, idx) => {
    const footerY = margin.bottom - 30;

    // Generation timestamp
    const now = new Date();
    const timestamp = `Generated on ${now.toLocaleDateString(
      "en-IN"
    )} at ${now.toLocaleTimeString("en-IN")}`;
    pg.drawText(timestamp, {
      x: margin.left,
      y: footerY,
      size: 8,
      font: regularFont,
      color: colors.darkGrey,
    });

    // Page number
    pg.drawText(`Page ${idx + 1} of ${pages.length}`, {
      x: width - margin.right - 80,
      y: footerY,
      size: 8,
      font: regularFont,
      color: colors.darkGrey,
    });

    // Confidential notice
    pg.drawText("CONFIDENTIAL", {
      x: margin.left,
      y: footerY - 12,
      size: 8,
      font: boldFont,
      color: colors.accent,
    });
  });

  return pdfDoc.save();
};
