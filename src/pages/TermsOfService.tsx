import { Link } from "react-router-dom";
import { ArrowLeft, FileText, AlertCircle, Info, Shield } from "lucide-react";
import { useAuth } from "../services/authService";

export default function TermsOfService() {
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
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Terms of Service
              </h1>
              <p className="text-slate-500 dark:text-gray-400 mt-1">
                Please read these terms carefully.
              </p>
            </div>
          </div>

          <div className="space-y-10 text-slate-600 dark:text-gray-300">
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-red-600 dark:text-red-500" />
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed pl-7">
                By accessing and using CashFlow ("the Application"), you agree
                to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use the Application.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
                2. "As Is" Disclaimer
              </h2>
              <p className="leading-relaxed pl-7">
                The Application is provided on an "AS IS" and "AS AVAILABLE"
                basis. We make no warranties, expressed or implied, regarding
                the reliability, accuracy, or availability of the service. You
                use the Application at your own sole risk. We are not
                responsible for any financial decisions made based on data from
                this tool.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-500" />
                3. User Responsibilities
              </h2>
              <div className="pl-7">
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    You are responsible for maintaining the confidentiality of
                    your account.
                  </li>
                  <li>
                    You agree not to use the service for any illegal or
                    unauthorized purpose.
                  </li>
                  <li>
                    You retain ownership of all data you input into the system.
                  </li>
                </ul>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <p className="text-sm text-gray-400">
              We reserve the right to modify these terms at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
