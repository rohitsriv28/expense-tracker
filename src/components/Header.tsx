import { useState } from "react";
import { useAuth } from "../services/authService";
import { Download, LogOut, User, Menu, X } from "lucide-react";
import lightLogo from "../assets/cashflow-light.png";
import darkLogo from "../assets/cashflow-dark.png";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onLogout: () => void;
  onExport: () => void;
}

export default function Header({ onLogout, onExport }: HeaderProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-white/10 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <img
                src={lightLogo}
                alt="CashFlow"
                className="h-10 w-auto dark:hidden"
              />
              <img
                src={darkLogo}
                alt="CashFlow"
                className="h-10 w-auto hidden dark:block"
              />
            </div>
          </div>

          {user && (
            <>
              {/* Desktop View */}
              <div className="hidden md:flex items-center space-x-4">
                <ThemeToggle />
                <div className="hidden sm:flex items-center bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-2">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={onExport}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>

                  <button
                    onClick={onLogout}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors font-medium text-sm border border-gray-200 dark:border-white/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex md:hidden items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && user && (
          <div className="md:hidden pb-4">
            <div className="bg-slate-100 dark:bg-white/5 rounded-lg px-4 py-3 mb-3">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  onExport();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors font-medium border border-gray-200 dark:border-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
