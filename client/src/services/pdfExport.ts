import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import PdfReportTemplate from "../components/pdf-preview/PdfReportTemplate";
import PDFWorker from "../workers/pdfWorker?worker";

import type { Income, Expense, Category, MonthlyEnvelopeSummary } from "../types";

export interface ReportData {
  period: { start: Date; end: Date; label: string };
  userName: string;
  income: Income[];
  expenses: Expense[];
  budgets: MonthlyEnvelopeSummary[];
  categories: Category[];
}

export let isGenerating = false;

export async function generatePDFReport(data: ReportData): Promise<void> {
  isGenerating = true;
  const container = document.createElement("div");
  // Hide it off-screen, but ensure it has dimensions so rendering works
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const root = createRoot(container);
  const pdfWidth = 595.28;
  const pdfHeight = 841.89;
  const totalPages = 4; // We know PdfReportTemplate has exactly 4 pages
  const images: string[] = [];

  try {
    // 1. Capture all pages to images on main thread
    for (let i = 0; i < totalPages; i++) {
      flushSync(() => {
        root.render(
          React.createElement(
            "div",
            { id: "pdf-export-root" },
            React.createElement(PdfReportTemplate, { data, pageIndex: i }),
          ),
        );
      });

      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const imgs = Array.from(container.querySelectorAll("img")).filter(
        (img) => !img.complete,
      );
      if (imgs.length > 0) {
        await Promise.all(
          imgs.map(
            (img) =>
              new Promise<void>((resolve) => {
                const timeout = setTimeout(resolve, 3000);
                img.onload = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                img.onerror = () => {
                  clearTimeout(timeout);
                  resolve();
                };
              }),
          ),
        );
      }

      const pageElement = container.querySelector(".page-break-after-always") as HTMLElement;
      if (!pageElement) {
        throw new Error(`Page ${i + 1} did not render properly.`);
      }

      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f1f5f9",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      images.push(imgData);

      flushSync(() => {
        root.render(null);
      });
    }

    // 2. Pass images to Web Worker for assembly
    if (window.Worker) {
      try {
        await new Promise<void>((resolve, reject) => {
          const worker = new PDFWorker();
          worker.onmessage = (e) => {
            if (e.data.success) {
              const blob = new Blob([e.data.pdfBytes], {
                type: "application/pdf",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `cashflow-report-${data.period.label.toLowerCase().replace(/\s+/g, "-")}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
              worker.terminate();
              resolve();
            } else {
              worker.terminate();
              reject(new Error(e.data.error || "Worker failed"));
            }
          };
          worker.onerror = (err) => {
            worker.terminate();
            reject(err);
          };
          worker.postMessage({ images, pdfWidth, pdfHeight });
        });
        return;
      } catch (err) {
        console.warn("Worker assembly failed, falling back to sync assembly:", err);
      }
    }

    // 3. Fallback: Sync assembly on main thread
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    for (let i = 0; i < images.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(images[i], "JPEG", 0, 0, pdfWidth, pdfHeight);
    }
    const filename = `cashflow-report-${data.period.label.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    pdf.save(filename);

  } finally {
    isGenerating = false;
    try {
      if (root) root.unmount();
    } catch {
      // ignore unmount errors
    }
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
