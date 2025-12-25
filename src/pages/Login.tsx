import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../services/authService";
import { Shield, Wallet } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900 transition-colors">
      {/* Left Side - Hero Section (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Abstract Background - Subtle Charcoal textures */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-900/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mt-20">
          <div className="mb-12">
            <img
              src="/cashflow-dark.png"
              alt="CashFlow Logo"
              className="h-16 w-auto mb-8"
            />
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Master Your <br />
              <span className="text-red-500">Financial Life</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-md leading-relaxed">
              Experience the clarity of mindful spending. Track, analyze, and
              optimize your wealth with our local-first, privacy-focused
              platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 max-w-lg">
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-2">
                <Wallet className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg">Smart Tracking</h3>
              <p className="text-sm text-gray-400">
                Effortless expense logging
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg">Secure & Private</h3>
              <p className="text-sm text-gray-400">Local-first architecture</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-gray-500">
          © {new Date().getFullYear()} CashFlow LLC. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-white dark:bg-slate-900 transition-colors">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/cashflow-light.png"
              alt="CashFlow"
              className="h-12 mx-auto dark:hidden"
            />
            <img
              src="/cashflow-dark.png"
              alt="CashFlow"
              className="h-12 mx-auto hidden dark:block"
            />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-gray-100 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-slate-600 dark:text-gray-400">
              Sign in to access your dashboard
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-4 border border-transparent rounded-xl shadow-lg shadow-red-500/10 text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg
                    className="h-5 w-5 mr-3 bg-white rounded-full p-0.5"
                    viewBox="0 0 24 24"
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
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-gray-500">
                  Secure Access
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400">
              By continuing, you agree to our
              <Link
                to="/terms"
                className="text-slate-900 dark:text-gray-300 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1"
              >
                Terms
              </Link>
              {" & "}
              <Link
                to="/privacy"
                className="text-slate-900 dark:text-gray-300 font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
