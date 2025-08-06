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

export const generateExpensePDF = async (
  expenses: Expense[],
  companyInfo?: CompanyInfo,
  reportTitle: string = "Expense Report"
) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();

  // Font setup
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Professional color scheme - Red, Black, Grey
  const primaryRed = rgb(0.8, 0.1, 0.1); // Professional red
  const darkRed = rgb(0.6, 0.05, 0.05); // Darker red for accents
  const charcoalBlack = rgb(0.1, 0.1, 0.1); // Almost black
  const darkGrey = rgb(0.3, 0.3, 0.3); // Dark grey
  const mediumGrey = rgb(0.5, 0.5, 0.5); // Medium grey
  const lightGrey = rgb(0.9, 0.9, 0.9); // Light grey
  const veryLightGrey = rgb(0.95, 0.95, 0.95); // Very light grey
  const white = rgb(1, 1, 1); // Pure white

  // Better margin system
  const margins = {
    top: 50,
    bottom: 60,
    left: 50,
    right: 50,
  };

  const contentWidth = width - margins.left - margins.right;
  let currentY = height - margins.top;

  // Helper functions with improved spacing
  const drawLine = (
    y: number,
    color = mediumGrey,
    thickness = 0.5,
    leftOffset = 0,
    rightOffset = 0
  ) => {
    page.drawLine({
      start: { x: margins.left + leftOffset, y },
      end: { x: width - margins.right - rightOffset, y },
      thickness,
      color,
    });
  };

  const drawBackground = (
    x: number,
    y: number,
    w: number,
    h: number,
    color = lightGrey
  ) => {
    page.drawRectangle({ x, y, width: w, height: h, color });
  };

  // ENHANCED HEADER SECTION
  const headerHeight = 80;

  // Main header background
  drawBackground(
    0,
    currentY - headerHeight + 20,
    width,
    headerHeight,
    charcoalBlack
  );

  // Red accent stripe at top
  drawBackground(0, currentY - 5, width, 5, primaryRed);

  // Company/Header content with better spacing
  currentY -= 20;

  if (companyInfo) {
    // Company name with proper spacing
    page.drawText(companyInfo.name.toUpperCase(), {
      x: margins.left + 15,
      y: currentY,
      size: 18,
      font: boldFont,
      color: white,
    });

    currentY -= 22;

    // Address with better formatting
    page.drawText(companyInfo.address, {
      x: margins.left + 15,
      y: currentY,
      size: 9,
      font: regularFont,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Contact info on same line if available
    if (companyInfo.phone || companyInfo.email) {
      currentY -= 12;
      const contactInfo = [companyInfo.phone, companyInfo.email]
        .filter(Boolean)
        .join("  |  ");
      page.drawText(contactInfo, {
        x: margins.left + 15,
        y: currentY,
        size: 8,
        font: regularFont,
        color: rgb(0.7, 0.7, 0.7),
      });
    }
  } else {
    // Default header
    page.drawText("EXPENSE MANAGEMENT SYSTEM", {
      x: margins.left + 15,
      y: currentY,
      size: 16,
      font: boldFont,
      color: white,
    });
    currentY -= 18;
    page.drawText("Professional Financial Reporting", {
      x: margins.left + 15,
      y: currentY,
      size: 9,
      font: regularFont,
      color: rgb(0.8, 0.8, 0.8),
    });
  }

  currentY -= 40;

  // TITLE SECTION WITH IMPROVED LAYOUT
  const titleSectionHeight = 50;

  // Title background with better proportions
  drawBackground(
    margins.left - 10,
    currentY - titleSectionHeight + 15,
    contentWidth + 20,
    titleSectionHeight,
    veryLightGrey
  );

  // Red accent line on left
  drawBackground(
    margins.left - 10,
    currentY - titleSectionHeight + 15,
    4,
    titleSectionHeight,
    primaryRed
  );

  // Title text with better positioning
  page.drawText(reportTitle.toUpperCase(), {
    x: margins.left + 10,
    y: currentY - 5,
    size: 24,
    font: boldFont,
    color: charcoalBlack,
  });

  // Report metadata - properly aligned
  const today = new Date();
  const reportDate = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const metadataX = width - margins.right - 150;
  page.drawText(`Generated: ${reportDate}`, {
    x: metadataX,
    y: currentY - 5,
    size: 8,
    font: regularFont,
    color: mediumGrey,
  });

  page.drawText(`Doc ID: EXP-${Date.now().toString().slice(-6)}`, {
    x: metadataX,
    y: currentY - 18,
    size: 8,
    font: regularFont,
    color: mediumGrey,
  });

  currentY -= 70;

  // IMPROVED SUMMARY SECTION
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length > 0 ? total / expenses.length : 0;

  // Section header with better styling
  const sectionHeaderHeight = 25;
  drawBackground(
    margins.left - 10,
    currentY - sectionHeaderHeight + 10,
    contentWidth + 20,
    sectionHeaderHeight,
    primaryRed
  );

  page.drawText("FINANCIAL SUMMARY", {
    x: margins.left,
    y: currentY - 8,
    size: 11,
    font: boldFont,
    color: white,
  });

  currentY -= 40;

  // Summary cards with better proportions and spacing
  const cardSpacing = 15;
  const cardWidth = (contentWidth - cardSpacing * 2) / 3;
  const cardHeight = 45;

  // Card positions
  const card1X = margins.left;
  const card2X = margins.left + cardWidth + cardSpacing;
  const card3X = margins.left + (cardWidth + cardSpacing) * 2;

  // Card 1 - Total Amount
  drawBackground(card1X, currentY - cardHeight, cardWidth, cardHeight, white);
  drawBackground(card1X, currentY - 3, cardWidth, 3, primaryRed);

  // Add subtle border
  page.drawRectangle({
    x: card1X,
    y: currentY - cardHeight,
    width: cardWidth,
    height: cardHeight,
    borderColor: lightGrey,
    borderWidth: 1,
  });

  page.drawText("TOTAL EXPENSES", {
    x: card1X + 8,
    y: currentY - 15,
    size: 7,
    font: boldFont,
    color: mediumGrey,
  });

  page.drawText(
    `Rs. ${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    {
      x: card1X + 8,
      y: currentY - 32,
      size: 14,
      font: boldFont,
      color: charcoalBlack,
    }
  );

  // Card 2 - Transaction Count
  drawBackground(card2X, currentY - cardHeight, cardWidth, cardHeight, white);
  drawBackground(card2X, currentY - 3, cardWidth, 3, primaryRed);

  page.drawRectangle({
    x: card2X,
    y: currentY - cardHeight,
    width: cardWidth,
    height: cardHeight,
    borderColor: lightGrey,
    borderWidth: 1,
  });

  page.drawText("TOTAL TRANSACTIONS", {
    x: card2X + 8,
    y: currentY - 15,
    size: 7,
    font: boldFont,
    color: mediumGrey,
  });

  page.drawText(`${expenses.length} Items`, {
    x: card2X + 8,
    y: currentY - 32,
    size: 14,
    font: boldFont,
    color: charcoalBlack,
  });

  // Card 3 - Average
  drawBackground(card3X, currentY - cardHeight, cardWidth, cardHeight, white);
  drawBackground(card3X, currentY - 3, cardWidth, 3, primaryRed);

  page.drawRectangle({
    x: card3X,
    y: currentY - cardHeight,
    width: cardWidth,
    height: cardHeight,
    borderColor: lightGrey,
    borderWidth: 1,
  });

  page.drawText("AVERAGE EXPENSE", {
    x: card3X + 8,
    y: currentY - 15,
    size: 7,
    font: boldFont,
    color: mediumGrey,
  });

  page.drawText(`Rs. ${avgExpense.toFixed(2)}`, {
    x: card3X + 8,
    y: currentY - 32,
    size: 14,
    font: boldFont,
    color: charcoalBlack,
  });

  currentY -= 65;

  // Period information with better formatting
  if (expenses.length > 0) {
    const dates = expenses
      .map((e) => e.date.toDate())
      .sort((a, b) => a.getTime() - b.getTime());
    const startDate = dates[0].toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const endDate = dates[dates.length - 1].toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    page.drawText(`Report Period: ${startDate} — ${endDate}`, {
      x: margins.left,
      y: currentY,
      size: 9,
      font: regularFont,
      color: darkGrey,
    });

    currentY -= 30;
  }

  // ENHANCED TABLE DESIGN
  const tableHeaderHeight = 28;

  // Table header with better styling
  drawBackground(
    margins.left - 5,
    currentY - tableHeaderHeight + 8,
    contentWidth + 10,
    tableHeaderHeight,
    charcoalBlack
  );

  // Column headers with better spacing
  const colPositions = {
    date: margins.left + 8,
    description: margins.left + 95,
    amount: width - margins.right - 80,
  };

  page.drawText("DATE", {
    x: colPositions.date,
    y: currentY - 5,
    size: 9,
    font: boldFont,
    color: white,
  });

  page.drawText("DESCRIPTION", {
    x: colPositions.description,
    y: currentY - 5,
    size: 9,
    font: boldFont,
    color: white,
  });

  page.drawText("AMOUNT", {
    x: colPositions.amount,
    y: currentY - 5,
    size: 9,
    font: boldFont,
    color: white,
  });

  currentY -= 40;

  // Table rows with improved styling
  let itemCount = 0;
  let currentPage = page;
  const rowHeight = 25;
  const minBottomMargin = 100;

  for (const expense of expenses) {
    // Check for new page with better margins
    if (currentY < minBottomMargin) {
      currentPage = pdfDoc.addPage(PageSizes.A4);
      currentY = height - margins.top - 20;

      // Redraw header on new page
      drawBackground(
        margins.left - 5,
        currentY - tableHeaderHeight + 8,
        contentWidth + 10,
        tableHeaderHeight,
        charcoalBlack
      );

      currentPage.drawText("DATE", {
        x: colPositions.date,
        y: currentY - 5,
        size: 9,
        font: boldFont,
        color: white,
      });
      currentPage.drawText("DESCRIPTION", {
        x: colPositions.description,
        y: currentY - 5,
        size: 9,
        font: boldFont,
        color: white,
      });
      currentPage.drawText("AMOUNT", {
        x: colPositions.amount,
        y: currentY - 5,
        size: 9,
        font: boldFont,
        color: white,
      });

      currentY -= 40;
    }

    // Alternating row colors with better contrast
    const rowBg = itemCount % 2 === 0 ? white : veryLightGrey;
    currentPage.drawRectangle({
      x: margins.left - 5,
      y: currentY - rowHeight + 5,
      width: contentWidth + 10,
      height: rowHeight,
      color: rowBg,
    });

    // Subtle left border for rows
    currentPage.drawRectangle({
      x: margins.left - 5,
      y: currentY - rowHeight + 5,
      width: 2,
      height: rowHeight,
      color: lightGrey,
    });

    // Format date properly
    const dateStr = expense.date.toDate().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });

    // Truncate description with proper length
    let description = expense.remarks;
    const maxDescLength = 55;
    if (description.length > maxDescLength) {
      description = description.substring(0, maxDescLength - 3) + "...";
    }

    // Row content with better alignment
    currentPage.drawText(dateStr, {
      x: colPositions.date,
      y: currentY - 8,
      size: 8,
      font: regularFont,
      color: charcoalBlack,
    });

    currentPage.drawText(description, {
      x: colPositions.description,
      y: currentY - 8,
      size: 8,
      font: regularFont,
      color: charcoalBlack,
    });

    currentPage.drawText(
      `Rs. ${expense.amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}`,
      {
        x: colPositions.amount,
        y: currentY - 8,
        size: 8,
        font: boldFont,
        color: darkRed,
      }
    );

    currentY -= rowHeight;
    itemCount++;
  }

  // ENHANCED TOTAL SECTION
  currentY -= 15;

  // Grand total with professional styling
  const totalSectionHeight = 35;
  drawBackground(
    margins.left - 10,
    currentY - totalSectionHeight + 10,
    contentWidth + 20,
    totalSectionHeight,
    charcoalBlack
  );

  // Red accent at top
  drawBackground(
    margins.left - 10,
    currentY - 5,
    contentWidth + 20,
    3,
    primaryRed
  );

  currentPage.drawText("GRAND TOTAL", {
    x: width - margins.right - 200,
    y: currentY - 15,
    size: 12,
    font: boldFont,
    color: white,
  });

  currentPage.drawText(
    `Rs. ${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    {
      x: width - margins.right - 100,
      y: currentY - 15,
      size: 16,
      font: boldFont,
      color: white,
    }
  );

  // PROFESSIONAL FOOTER
  currentY -= 60;

  // Ensure footer fits on current page
  if (currentY < margins.bottom + 40) {
    currentPage = pdfDoc.addPage(PageSizes.A4);
    currentY = height - margins.top - 50;
  }

  // Footer separator
  drawLine(currentY + 15, primaryRed, 1.5);
  currentY -= 5;

  // Footer background
  drawBackground(0, currentY - 30, width, 35, veryLightGrey);

  // Footer content with better spacing
  const footerText = `Document generated on ${today.toLocaleDateString(
    "en-IN"
  )} at ${today.toLocaleTimeString("en-IN", { hour12: false })}`;
  currentPage.drawText(footerText, {
    x: margins.left,
    y: currentY - 10,
    size: 7,
    font: regularFont,
    color: mediumGrey,
  });

  currentPage.drawText("CONFIDENTIAL FINANCIAL DOCUMENT", {
    x: margins.left,
    y: currentY - 22,
    size: 7,
    font: boldFont,
    color: darkRed,
  });

  // Enhanced page numbering
  const pages = pdfDoc.getPages();
  pages.forEach((pg, index) => {
    // Page number with better styling
    pg.drawRectangle({
      x: width - margins.right - 45,
      y: margins.bottom - 25,
      width: 40,
      height: 18,
      color: charcoalBlack,
    });

    pg.drawText(`${index + 1} of ${pages.length}`, {
      x: width - margins.right - 35,
      y: margins.bottom - 20,
      size: 8,
      font: boldFont,
      color: white,
    });
  });

  return await pdfDoc.save();
};

// Enhanced usage example:
/*
const companyInfo = {
  name: "Acme Corporation Ltd.",
  address: "Tower A, Business Park, Sector 18, Gurugram, Haryana - 122015",
  phone: "+91 124 456 7890",
  email: "finance@acmecorp.com"
};

const pdfBytes = await generateExpensePDF(expenses, companyInfo, "Monthly Expense Report");
*/
