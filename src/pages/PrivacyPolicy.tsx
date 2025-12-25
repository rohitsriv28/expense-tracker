import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, CheckCircle } from "lucide-react";
import { useAuth } from "../services/authService";

export default function PrivacyPolicy() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to={user ? "/" : "/login"}
            className="inline-flex items-center text-slate-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {user ? "Back to Dashboard" : "Back to Login"}
          </Link>
          <span className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden p-8 sm:p-12 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 dark:border-slate-700 pb-6">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-500">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="text-slate-500 dark:text-gray-400 mt-1">
                Your data, your control.
              </p>
            </div>
          </div>

          <div className="space-y-10 text-slate-600 dark:text-gray-300">
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
                1. Data Storage & Ownership
              </h2>
              <p className="leading-relaxed pl-7">
                CashFlow is designed with a privacy-first architecture. Your
                financial data is stored primarily in your browser's local
                storage (IndexedDB) for offline access. When you sync, data is
                securely transmitted to our Firebase backend solely for the
                purpose of synchronization across your devices. We do not sell,
                rent, or analyze your personal financial data for advertising
                purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600 dark:text-red-500" />
                2. Authentication
              </h2>
              <p className="leading-relaxed pl-7">
                We use Google Firebase Authentication to secure your account. We
                only store your email address and profile picture URL to
                identify you. We never post to your social media accounts or
                share your identity with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-red-600 dark:text-red-500" />
                3. Data Usage
              </h2>
              <div className="pl-7">
                <p className="leading-relaxed mb-2">
                  Your data is used exclusively to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide expense tracking and analytics features.</li>
                  <li>Generate PDF reports at your request.</li>
                  <li>Sync your state across multiple devices.</li>
                </ul>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <p className="text-sm text-gray-400">
              Questions? Contact us at support@cashflow.app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
