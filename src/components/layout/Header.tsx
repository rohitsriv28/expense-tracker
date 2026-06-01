import { useState } from "react";
import { useAuth } from "../../services/authService";
import { LogOut, User, Menu, X } from "lucide-react";
import lightLogo from "../../assets/cashflow-light.png";
import darkLogo from "../../assets/cashflow-dark.png";
import ThemeToggle from "../ui/ThemeToggle";

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
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

                <div className="relative group z-50">
                  <div className="cursor-pointer">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Hover Popover */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform scale-95 group-hover:scale-100 p-5 flex flex-col items-center">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-20 h-20 rounded-full mb-3 shadow-md object-cover border-4 border-white dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3 shadow-md border-4 border-white dark:border-slate-700">
                        <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <p className="font-bold text-lg text-gray-900 dark:text-white text-center leading-tight mb-1">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5 truncate w-full">
                      {user.email}
                    </p>

                    <button
                      onClick={onLogout}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors font-semibold text-sm"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex md:hidden items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2"
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
          <div className="md:hidden pb-4 pt-2 border-t border-gray-100 dark:border-white/10 mt-2 animate-fade-in">
            <div className="flex flex-col items-center bg-slate-50 dark:bg-white/5 rounded-2xl p-5 mb-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-16 h-16 rounded-full mb-3 shadow-sm object-cover border-2 border-white dark:border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3 shadow-sm border-2 border-white dark:border-slate-700">
                  <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              <p className="font-bold text-gray-900 dark:text-white text-center">
                {user.displayName || "User"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {user.email}
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-semibold shadow-sm"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
