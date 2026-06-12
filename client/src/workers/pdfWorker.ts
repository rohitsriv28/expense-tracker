import type { ReportData } from '../services/pdfExport';

self.onmessage = async (_e: MessageEvent<ReportData>) => {
  try {
    // If we try to use html2canvas here, it will fail because there is no document
    // We post a failure so the main thread handles it gracefully as requested.
    if (typeof document === 'undefined') {
      self.postMessage({ success: false, error: 'DOM not available in worker. Falling back to main thread.' });
      return;
    }
    
    // The rest of the implementation if somehow DOM was available
    self.postMessage({ success: false, error: 'Not implemented in worker' });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message || 'Worker failed' });
  }
};
