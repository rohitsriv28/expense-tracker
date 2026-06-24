import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useGoogleLogin, GoogleLogin } from "@react-oauth/google";
import {
  Shield,
  Wallet,
  TrendingUp,
  PieChart,
  Target,
  AlertCircle,
  X,
} from "lucide-react";
import cashflowDark from "../assets/cashflow-dark.png";
import cashflowLight from "../assets/cashflow-light.png";

// ─── Feature list shown on the left hero panel ───────────────────────────────

const FEATURES = [
  {
    icon: Wallet,
    title: "Expense Tracking",
    description: "Log and categorise every transaction in seconds",
  },
  {
    icon: TrendingUp,
    title: "Income Management",
    description: "Track sources, recurring income, and net savings",
  },
  {
    icon: Target,
    title: "Envelope Budgets",
    description: "Set category limits and monitor them in real time",
  },
  {
    icon: PieChart,
    title: "Rich Analytics",
    description: "Visual breakdowns, trends, and exportable PDF reports",
  },
];

// ─── Google "G" SVG — meets Google Sign-In branding guidelines ───────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300"
    >
      <AlertCircle
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps Firebase Auth error codes to human-readable messages.
 * Avoids exposing internal error strings to the user.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code ?? "";

    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      return "Sign-in was cancelled. Please try again.";
    }
    if (code === "auth/popup-blocked") {
      return "Your browser blocked the sign-in popup. Please allow popups for this site and try again.";
    }
    if (code === "auth/network-request-failed") {
      return "No internet connection. Please check your network and try again.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many sign-in attempts. Please wait a moment before trying again.";
    }
    if (code === "auth/user-disabled") {
      return "This account has been disabled. Please contact support.";
    }
  }
  return "Sign-in failed. Please try again. If this persists, try refreshing the page.";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loginWithToken, user } = useAuth();
  const navigate = useNavigate();

  // Redirect guard — send already-authenticated users straight to the dashboard
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Detect standalone PWA mode
  const isStandalone = useMemo(() => {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  // Handle callback if redirected back with token in URL hash (PWA standalone mode)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // Remove the leading '#'
      const idToken = params.get("id_token");
      if (idToken) {
        // Strip hash parameters from location so they don't linger in URL
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );

        const performLogin = async () => {
          try {
            setIsLoading(true);
            await loginWithToken(idToken);
          } catch (error) {
            console.error("Redirect login failed:", error);
            setErrorMessage(getErrorMessage(error));
            setIsLoading(false);
          }
        };
        performLogin();
      }
    }
  }, [loginWithToken]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        // Fallback or explicit token handler if used elsewhere
        await loginWithToken(tokenResponse.access_token);
      } catch (error) {
        console.error("Login failed:", error);
        setErrorMessage(getErrorMessage(error));
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
      setErrorMessage(getErrorMessage(error));
      setIsLoading(false);
    },
  });

  const handleLoginClick = () => {
    if (isStandalone) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
      const scope = encodeURIComponent("openid profile email");
      const nonce = Math.random().toString(36).substring(2);
      sessionStorage.setItem("google_auth_nonce", nonce);
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${nonce}`;
      window.location.href = url;
    } else {
      handleGoogleLogin();
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-white dark:bg-slate-900 transition-colors">
      {/* ── Left: Hero panel (desktop only) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Subtle ambient glow — purely decorative */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 bg-slate-700/40 rounded-full blur-3xl" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 mt-16">
          <img
            src={cashflowDark}
            alt="CashFlow"
            className="h-14 w-auto mb-10"
          />

          <h1 className="text-4xl font-bold leading-snug mb-4 tracking-tight">
            Your complete
            <br />
            <span className="text-indigo-400">personal finance</span>
            <br />
            companion.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-12">
            Track expenses, manage budgets, analyse income trends, and export
            professional reports — all in one privacy-first app.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center flex-shrink-0">
                  <Icon
                    className="w-5 h-5 text-indigo-400"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-semibold text-sm text-white">{title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel footer */}
        <p className="relative z-10 text-xs text-slate-600">
          © {new Date().getFullYear()} CashFlow. All rights reserved.
        </p>
      </div>

      {/* ── Right: Login form ──────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-12 bg-white dark:bg-slate-900 transition-colors">
        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo — hidden on desktop where the hero panel shows it */}
          <div className="flex justify-center lg:hidden">
            <img
              src={cashflowLight}
              alt="CashFlow"
              className="h-11 w-auto dark:hidden"
            />
            <img
              src={cashflowDark}
              alt="CashFlow"
              className="h-11 w-auto hidden dark:block"
            />
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sign in to CashFlow
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Your financial data, always in sync.
            </p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Actions */}
          <div className="space-y-4">
            {/*
              Google Sign-In button.
              Styling follows Google's brand guidelines:
              - White background, #1F1F1F text on light mode
              - Dark surface, white text on dark mode
              - Google logo always on a white background
              Reference: https://developers.google.com/identity/branding-guidelines
            */}
            {isStandalone ? (
              <button
                onClick={handleLoginClick}
                disabled={isLoading}
                aria-busy={isLoading}
                className="
                  w-full flex items-center justify-center gap-3
                  px-4 py-3.5
                  bg-white dark:bg-slate-800
                  border border-slate-200 dark:border-slate-700
                  rounded-xl
                  text-sm font-medium text-slate-800 dark:text-slate-100
                  shadow-sm
                  hover:bg-slate-50 dark:hover:bg-slate-700/60
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                  active:scale-[0.99]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {isLoading ? (
                  <>
                    <div
                      className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>Signing you in…</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Continue with Google (PWA)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex justify-center w-full min-h-[44px]">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      try {
                        setIsLoading(true);
                        await loginWithToken(credentialResponse.credential);
                      } catch (error) {
                        console.error("Login failed:", error);
                        setErrorMessage(getErrorMessage(error));
                        setIsLoading(false);
                      }
                    }
                  }}
                  onError={() => {
                    setErrorMessage("Sign-in failed. Please try again.");
                  }}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width="384"
                />
              </div>
            )}

            {/* Security assurance row */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Shield
                className="w-3.5 h-3.5 flex-shrink-0"
                aria-hidden="true"
              />
              <span>Secured by Google OAuth & JWT</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
          </div>

          {/* Legal */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link
              to="/terms"
              className="font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline-offset-2 hover:underline transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline-offset-2 hover:underline transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
