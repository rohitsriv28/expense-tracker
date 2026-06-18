import { jsPDF } from "jspdf";

interface WorkerInput {
  images: string[];
  pdfWidth: number;
  pdfHeight: number;
}

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  try {
    const { images, pdfWidth, pdfHeight } = e.data;

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

    const pdfBytes = pdf.output("arraybuffer");

    self.postMessage({ success: true, pdfBytes }, [pdfBytes]);
  } catch (error: any) {
    self.postMessage({
      success: false,
      error: error.message || "Failed to compile PDF in worker",
    });
  }
};
