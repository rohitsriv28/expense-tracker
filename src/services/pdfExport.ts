import { PDFDocument, StandardFonts } from "pdf-lib";

export const generateExpensePDF = async (expenses: any[]) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { height } = page.getSize();
  const fontSize = 12;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let y = height - 50;

  // Add title
  page.drawText("Expense Report", {
    x: 50,
    y,
    size: 18,
    font,
  });
  y -= 30;

  // Add date range info
  const today = new Date().toLocaleDateString("en-IN");
  page.drawText(`Generated on: ${today}`, {
    x: 50,
    y,
    size: 10,
    font,
  });
  y -= 30;

  // Add expenses - replace rupee symbol with "Rs."
  expenses.forEach((expense) => {
    const dateStr = expense.date.toDate().toLocaleDateString("en-IN");
    const text = `${dateStr}: ${expense.remarks} - Rs.${expense.amount.toFixed(
      2
    )}`;

    page.drawText(text, {
      x: 50,
      y,
      size: fontSize,
      font,
    });
    y -= 20;

    // Add new page if running out of space
    if (y < 100) {
      const newPage = pdfDoc.addPage([600, 800]);
      y = newPage.getSize().height - 50;
    }
  });

  // Add total
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  y -= 20;
  page.drawText(`Total: Rs.${total.toFixed(2)}`, {
    x: 50,
    y,
    size: fontSize + 2,
    font,
  });

  return await pdfDoc.save();
};
