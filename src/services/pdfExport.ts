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

/**
 * Generates a professional PDF expense report.
 * @param expenses Array of expense objects.
 * @param companyInfo Optional company information for header.
 * @param reportTitle Optional report title.
 * @returns PDF bytes as Uint8Array.
 */
export const generateExpensePDF = async (
  expenses: Expense[],
  companyInfo?: CompanyInfo,
  reportTitle = "Expense Report"
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Color palette
  const colors = {
    primary: rgb(0.8, 0.1, 0.1),
    accent: rgb(0.6, 0.05, 0.05),
    black: rgb(0.1, 0.1, 0.1),
    greyDark: rgb(0.3, 0.3, 0.3),
    greyMid: rgb(0.5, 0.5, 0.5),
    greyLight: rgb(0.9, 0.9, 0.9),
    greyLighter: rgb(0.95, 0.95, 0.95),
    white: rgb(1, 1, 1),
  };

  // Margins
  const margin = { top: 50, bottom: 60, left: 50, right: 50 };
  const contentWidth = width - margin.left - margin.right;
  let cursorY = height - margin.top;

  // Helpers
  const drawLine = (y: number, color = colors.greyMid, thickness = 0.5) =>
    page.drawLine({
      start: { x: margin.left, y },
      end: { x: width - margin.right, y },
      color,
      thickness,
    });

  const drawBox = (x: number, y: number, w: number, h: number, color: any) =>
    page.drawRectangle({ x, y, width: w, height: h, color });

  // --- Header ---
  const headerH = 80;
  drawBox(0, cursorY - headerH + 20, width, headerH, colors.black);
  drawBox(0, cursorY - 5, width, 5, colors.primary);
  cursorY -= 25;

  if (companyInfo) {
    page.drawText(companyInfo.name.toUpperCase(), {
      x: margin.left + 15,
      y: cursorY,
      size: 18,
      font: boldFont,
      color: colors.white,
    });
    cursorY -= 22;
    page.drawText(companyInfo.address, {
      x: margin.left + 15,
      y: cursorY,
      size: 9,
      font: regularFont,
      color: colors.greyLight,
    });
    if (companyInfo.phone || companyInfo.email) {
      cursorY -= 12;
      const contact = [companyInfo.phone, companyInfo.email]
        .filter(Boolean)
        .join(" | ");
      page.drawText(contact, {
        x: margin.left + 15,
        y: cursorY,
        size: 8,
        font: regularFont,
        color: colors.greyMid,
      });
    }
  } else {
    page.drawText("CASHFLOW", {
      x: margin.left + 15,
      y: cursorY,
      size: 16,
      font: boldFont,
      color: colors.white,
    });
    cursorY -= 18;
    page.drawText("Expense Tracking & Reporting", {
      x: margin.left + 15,
      y: cursorY,
      size: 9,
      font: regularFont,
      color: colors.greyLight,
    });
  }
  cursorY -= 40;

  // --- Title ---
  const titleH = 50;
  drawBox(
    margin.left - 10,
    cursorY - titleH + 15,
    contentWidth + 20,
    titleH,
    colors.greyLighter
  );
  drawBox(margin.left - 10, cursorY - titleH + 15, 4, titleH, colors.primary);
  page.drawText(reportTitle.toUpperCase(), {
    x: margin.left + 10,
    y: cursorY - 5,
    size: 24,
    font: boldFont,
    color: colors.black,
  });
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  page.drawText(`Date: ${dateStr}`, {
    x: width - margin.right - 150,
    y: cursorY - 5,
    size: 8,
    font: regularFont,
    color: colors.greyMid,
  });
  cursorY -= 70;

  // --- Summary Section ---
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avg = expenses.length ? total / expenses.length : 0;
  drawBox(
    margin.left - 10,
    cursorY - 25 + 10,
    contentWidth + 20,
    25,
    colors.primary
  );
  page.drawText("FINANCIAL SUMMARY", {
    x: margin.left,
    y: cursorY - 8,
    size: 11,
    font: boldFont,
    color: colors.white,
  });
  cursorY -= 40;

  // Summary cards layout
  const cardW = (contentWidth - 30) / 3;
  const cardH = 45;
  [
    { label: "TOTAL EXPENSES", value: `Rs. ${total.toFixed(2)}` },
    { label: "TRANSACTIONS", value: `${expenses.length}` },
    { label: "AVERAGE", value: `Rs. ${avg.toFixed(2)}` },
  ].forEach((card, i) => {
    const x = margin.left + i * (cardW + 15);
    drawBox(x, cursorY - cardH, cardW, cardH, colors.white);
    drawBox(x, cursorY - 3, cardW, 3, colors.primary);
    page.drawRectangle({
      x,
      y: cursorY - cardH,
      width: cardW,
      height: cardH,
      borderColor: colors.greyLight,
      borderWidth: 1,
    });
    page.drawText(card.label, {
      x: x + 8,
      y: cursorY - 15,
      size: 7,
      font: boldFont,
      color: colors.greyMid,
    });
    page.drawText(card.value, {
      x: x + 8,
      y: cursorY - 32,
      size: 14,
      font: boldFont,
      color: colors.black,
    });
  });
  cursorY -= 65;

  // --- Table Header ---
  drawBox(
    margin.left - 5,
    cursorY - 28 + 8,
    contentWidth + 10,
    28,
    colors.black
  );
  const cols = {
    date: margin.left + 8,
    desc: margin.left + 95,
    amount: width - margin.right - 80,
  };
  ["DATE", "DESCRIPTION", "AMOUNT"].forEach((h, idx) => {
    const x = idx === 0 ? cols.date : idx === 1 ? cols.desc : cols.amount;
    page.drawText(h, {
      x,
      y: cursorY - 5,
      size: 9,
      font: boldFont,
      color: colors.white,
    });
  });
  cursorY -= 40;

  // Table rows
  let count = 0;
  const rowH = 25;
  for (const exp of expenses) {
    if (cursorY < margin.bottom + 100) {
      page = pdfDoc.addPage(PageSizes.A4);
      cursorY = height - margin.top - 20;
      // redraw header row
      drawBox(
        margin.left - 5,
        cursorY - 28 + 8,
        contentWidth + 10,
        28,
        colors.black
      );
      ["DATE", "DESCRIPTION", "AMOUNT"].forEach((h, idx) => {
        const x = idx === 0 ? cols.date : idx === 1 ? cols.desc : cols.amount;
        page.drawText(h, {
          x,
          y: cursorY - 5,
          size: 9,
          font: boldFont,
          color: colors.white,
        });
      });
      cursorY -= 40;
    }

    const bg = count % 2 ? colors.greyLighter : colors.white;
    page.drawRectangle({
      x: margin.left - 5,
      y: cursorY - rowH + 5,
      width: contentWidth + 10,
      height: rowH,
      color: bg,
    });
    page.drawRectangle({
      x: margin.left - 5,
      y: cursorY - rowH + 5,
      width: 2,
      height: rowH,
      color: colors.greyLight,
    });

    const dateStrShort = exp.date.toDate().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
    page.drawText(dateStrShort, {
      x: cols.date,
      y: cursorY - 8,
      size: 8,
      font: regularFont,
      color: colors.black,
    });

    let desc = exp.remarks;
    if (desc.length > 55) desc = desc.slice(0, 52) + "...";
    page.drawText(desc, {
      x: cols.desc,
      y: cursorY - 8,
      size: 8,
      font: regularFont,
      color: colors.black,
    });

    page.drawText(
      `Rs. ${exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      {
        x: cols.amount,
        y: cursorY - 8,
        size: 8,
        font: boldFont,
        color: colors.accent,
      }
    );

    cursorY -= rowH;
    count++;
  }

  // --- Grand Total ---
  cursorY -= 15;
  drawBox(
    margin.left - 10,
    cursorY - 35 + 10,
    contentWidth + 20,
    35,
    colors.black
  );
  drawBox(margin.left - 10, cursorY - 5, contentWidth + 20, 3, colors.primary);
  page.drawText("GRAND TOTAL", {
    x: width - margin.right - 200,
    y: cursorY - 15,
    size: 12,
    font: boldFont,
    color: colors.white,
  });
  page.drawText(`Rs. ${total.toFixed(2)}`, {
    x: width - margin.right - 100,
    y: cursorY - 15,
    size: 16,
    font: boldFont,
    color: colors.white,
  });

  // --- Footer ---
  cursorY -= 60;
  if (cursorY < margin.bottom + 40) {
    page = pdfDoc.addPage(PageSizes.A4);
    cursorY = height - margin.top - 50;
  }
  drawLine(cursorY + 15, colors.primary, 1.5);
  drawBox(0, cursorY - 30, width, 35, colors.greyLighter);
  const now = new Date();
  const footerText = `Generated on ${now.toLocaleDateString(
    "en-IN"
  )} at ${now.toLocaleTimeString("en-IN", { hour12: false })}`;
  page.drawText(footerText, {
    x: margin.left,
    y: cursorY - 10,
    size: 7,
    font: regularFont,
    color: colors.greyMid,
  });
  page.drawText("CONFIDENTIAL", {
    x: margin.left,
    y: cursorY - 22,
    size: 7,
    font: boldFont,
    color: colors.accent,
  });

  // Page numbers
  const pages = pdfDoc.getPages();
  pages.forEach((pg, idx) => {
    pg.drawRectangle({
      x: width - margin.right - 45,
      y: margin.bottom - 25,
      width: 40,
      height: 18,
      color: colors.black,
    });
    pg.drawText(`${idx + 1} / ${pages.length}`, {
      x: width - margin.right - 35,
      y: margin.bottom - 20,
      size: 8,
      font: boldFont,
      color: colors.white,
    });
  });

  return pdfDoc.save();
};
