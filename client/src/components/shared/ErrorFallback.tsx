import {
  AlertTriangle,
  RefreshCw,
  Home,
  Shield,
  Copy,
  ExternalLink,
  Bug,
} from "lucide-react";
import { useMemo, useState } from "react";

interface ErrorFallbackProps {
  error: any;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false);

  const errorId = useMemo(
    () => crypto.randomUUID().slice(0, 8).toUpperCase(),
    [],
  );

  const copyErrorDetails = async () => {
    const errorDetails = `
Error ID: ${errorId}
Error: ${error.message}

Stack:
${error.stack}

URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  const reportIssue = () => {
    const issueBody = encodeURIComponent(`
Error ID: ${errorId}

Error:
${error.message}

URL:
${window.location.href}

Browser:
${navigator.userAgent}

Timestamp:
${new Date().toISOString()}

Stack Trace:
${error.stack}
    `);

    window.open(
      `https://github.com/yourorg/cashflow/issues/new?title=${encodeURIComponent(
        `Error: ${error.message}`,
      )}&body=${issueBody}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-xl">
        <div className="rounded-3xl border border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />

              <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl">
                <AlertTriangle className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Something unexpected happened
            </h1>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              An unexpected error occurred while loading this page. You can try
              again or return to the dashboard.
            </p>

            <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              Error ID: {errorId}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={resetErrorBoundary}
              className="
                w-full
                inline-flex
                items-center
                justify-center
                px-5
                py-3.5
                rounded-2xl
                bg-gradient-to-r
                from-red-500
                to-red-600
                text-white
                font-semibold
                shadow-lg
                hover:shadow-xl
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all
              "
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="
                w-full
                inline-flex
                items-center
                justify-center
                px-5
                py-3.5
                rounded-2xl
                bg-white
                dark:bg-slate-800
                text-slate-700
                dark:text-slate-200
                border
                border-slate-200
                dark:border-slate-700
                hover:bg-slate-50
                dark:hover:bg-slate-700
                transition-all
              "
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </button>

            <button
              onClick={reportIssue}
              className="
                w-full
                inline-flex
                items-center
                justify-center
                px-5
                py-3.5
                rounded-2xl
                bg-slate-100
                dark:bg-slate-800
                text-slate-700
                dark:text-slate-200
                hover:bg-slate-200
                dark:hover:bg-slate-700
                transition-all
              "
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Report Issue
            </button>
          </div>

          {/* Data Safety Card */}
          <div className="mt-8 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />

              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Your data is safe
                </h3>

                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Your expense records remain securely stored. This error has
                  not affected your saved data.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="mt-6">
            <details className="group">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center">
                    <Bug className="w-5 h-5 mr-2 text-red-500" />

                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Technical Details
                    </span>
                  </div>

                  <span className="text-sm text-slate-500">
                    Click to expand
                  </span>
                </div>
              </summary>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4">
                  <p className="text-red-700 dark:text-red-300 font-medium break-words">
                    {error.message}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={copyErrorDetails}
                    className="
                      inline-flex
                      items-center
                      px-3
                      py-2
                      rounded-lg
                      bg-slate-100
                      dark:bg-slate-800
                      hover:bg-slate-200
                      dark:hover:bg-slate-700
                      text-sm
                      transition-colors
                    "
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copied!" : "Copy Details"}
                  </button>
                </div>

                <pre className="overflow-auto rounded-xl bg-slate-950 text-slate-300 p-4 text-xs leading-relaxed max-h-72">
                  {error.stack}
                </pre>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Need help? Contact{" "}
              <a
                href="mailto:support@cashflow.app"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                support@cashflow.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
