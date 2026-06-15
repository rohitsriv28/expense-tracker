import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import PdfReportTemplate from "../components/pdf-preview/PdfReportTemplate";

export interface ReportData {
  period: { start: Date; end: Date; label: string };
  userName: string;
  income: any[];
  expenses: any[];
  budgets: any[];
  categories: any[];
}

export let isGenerating = false;

export async function generatePDFReport(data: ReportData): Promise<void> {
  isGenerating = true;
  try {
    if (window.Worker) {
      try {
        await new Promise<void>((resolve, reject) => {
          const worker = new Worker(
            new URL("../workers/pdfWorker.ts", import.meta.url),
            { type: "module" },
          );
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
              generatePDFReportSync(data).then(resolve).catch(reject);
            }
          };
          worker.onerror = () => {
            worker.terminate();
            generatePDFReportSync(data).then(resolve).catch(reject);
          };
          worker.postMessage(data);
        });
        return;
      } catch (err) {
        await generatePDFReportSync(data);
      }
    } else {
      await generatePDFReportSync(data);
    }
  } finally {
    isGenerating = false;
  }
}

async function generatePDFReportSync(data: ReportData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement("div");
      // Hide it off-screen, but ensure it has dimensions so rendering works
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      const root = createRoot(container);

      const pdfWidth = 595.28;
      const pdfHeight = 841.89;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const totalPages = 4; // We know PdfReportTemplate has exactly 4 pages

      const processPdf = async () => {
        try {
          for (let i = 0; i < totalPages; i++) {
            // 1. Mount just ONE page
            flushSync(() => {
              root.render(
                React.createElement(
                  "div",
                  { id: "pdf-export-root" },
                  React.createElement(PdfReportTemplate, { data, pageIndex: i }),
                ),
              );
            });

            // 2. Wait for rendering and fonts
            await document.fonts.ready;
            await new Promise((resolve) => requestAnimationFrame(resolve));

            // Wait for any images in this specific page
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

            // 3. Find the page element and capture
            const pageElement = container.querySelector(".page-break-after-always") as HTMLElement;
            if (!pageElement) {
              throw new Error(`Page ${i + 1} did not render properly.`);
            }

            const canvas = await html2canvas(pageElement, {
              scale: 2, // Retain high quality
              useCORS: true,
              logging: false,
              backgroundColor: "#f1f5f9",
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.95);

            if (i > 0) {
              pdf.addPage();
            }

            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

            // 4. Force unmount to clear DOM and let garbage collector clean canvas memory
            flushSync(() => {
              root.render(null);
            });
          }

          const filename = `cashflow-report-${data.period.label.toLowerCase().replace(/\s+/g, "-")}.pdf`;
          pdf.save(filename); // Downloads the file automatically

          resolve();
        } catch (e) {
          reject(e);
        } finally {
          try {
            if (root) root.unmount();
          } catch (e) {}
          if (container && document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }
      };

      processPdf();
    } catch (e) {
      reject(e);
    }
  });
}
