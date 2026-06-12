import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import PdfReportTemplate from '../components/pdf-preview/PdfReportTemplate';

export interface ReportData {
  period: { start: Date; end: Date; label: string };
  userName: string;
  income: any[];
  expenses: any[];
  budgets: any[];
  categories: any[];
}

export async function generatePDFReport(data: ReportData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement('div');
      // Hide it off-screen, but ensure it has dimensions so rendering works
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const root = createRoot(container);
      
      root.render(
        React.createElement('div', { id: 'pdf-export-root' }, 
          React.createElement(PdfReportTemplate, { data })
        )
      );

      // Give React time to mount and browser time to apply Tailwind CSS
      setTimeout(async () => {
        try {
          const pages = Array.from(container.querySelectorAll('.page-break-after-always')) as HTMLElement[];
          
          if (pages.length === 0) {
            throw new Error('No pages found to render.');
          }

          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4' // ~595 x 842 pt
          });

          const pdfWidth = 595.28;
          const pdfHeight = 841.89;

          for (let i = 0; i < pages.length; i++) {
            const pageElement = pages[i];
            
            const canvas = await html2canvas(pageElement, {
              scale: 2, // Retain high quality
              useCORS: true,
              logging: false,
              backgroundColor: '#f1f5f9'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            if (i > 0) {
              pdf.addPage();
            }
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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
      }, 500); // 500ms delay to ensure all SVGs and fonts are rendered
    } catch (e) {
      reject(e);
    }
  });
}
