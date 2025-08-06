import {
  AlertTriangle,
  RefreshCw,
  Home,
  Shield,
  Copy,
  ExternalLink,
  Bug,
} from "lucide-react";
import { useState } from "react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false);

  const copyErrorDetails = async () => {
    const errorDetails = `
Error: ${error.message}
Stack: ${error.stack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  const reportIssue = () => {
    const issueBody = encodeURIComponent(`
**Error Description:**
${error.message}

**Steps to Reproduce:**
1. 
2. 
3. 

**Additional Context:**
- URL: ${window.location.href}
- Browser: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}

**Stack Trace:**
\`\`\`
${error.stack}
\`\`\`
    `);

    window.open(
      `https://github.com/yourorg/cashflow/issues/new?title=${encodeURIComponent(
        `Error: ${error.message}`
      )}&body=${issueBody}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* Error Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl blur opacity-20 animate-pulse"></div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-gray-600 mb-6 leading-relaxed">
          We encountered an unexpected error. Don't worry - your data is safe
          and this is likely a temporary issue that we can fix quickly.
        </p>

        {/* Error Details */}
        <div className="bg-white/70 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-8 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Bug className="w-5 h-5 mr-2 text-red-500" />
              Error Details
            </h3>
            <button
              onClick={copyErrorDetails}
              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            >
              <Copy className="w-4 h-4 mr-1" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-2">{error.message}</p>
            <details className="text-sm">
              <summary className="cursor-pointer text-red-600 hover:text-red-700 font-medium">
                Technical Details
              </summary>
              <pre className="mt-2 text-red-700 overflow-auto text-xs bg-red-100 p-2 rounded border">
                {error.stack}
              </pre>
            </details>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white transition-all duration-200 font-semibold border border-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </button>

          <button
            onClick={reportIssue}
            className="inline-flex items-center px-8 py-4 bg-blue-100 text-blue-700 rounded-2xl hover:bg-blue-200 transition-all duration-200 font-semibold border border-blue-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Report Issue
          </button>
        </div>

        {/* Safety Notice */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-800">Your Data is Safe</h3>
          </div>
          <p className="text-green-700 text-sm leading-relaxed">
            All your expense data is securely stored and protected. This error
            doesn't affect your data integrity. Simply refresh the page or try
            again to continue using CashFlow.
          </p>
        </div>

        {/* Help Links */}
        <div className="mt-6 text-sm text-gray-500">
          <p>
            Need help? Contact us at{" "}
            <a
              href="mailto:support@cashflow.app"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              support@cashflow.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
