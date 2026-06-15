import { Link } from "react-router-dom";
import { Heart, Sparkles, Shield, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white/30 dark:bg-slate-950/20 backdrop-blur-md border-t border-gray-200/50 dark:border-white/10 mt-auto py-8 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand/Slogan */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
            <div className="flex items-center gap-2">
              <span className="font-black bg-gradient-to-r from-red-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight text-lg">
                CashFlow
              </span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Premium personal wealth companion. Take control of your balance.
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 uppercase tracking-wider">
              Developed by Rohit Raj Srivastava
            </p>
          </div>

          {/* Made with Love credit with beating heart */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-bounce" />
            <span>for CashFlow</span>
          </div>

          {/* Quick links & Copyright */}
          <div className="flex flex-col items-center md:items-end gap-2 text-xs">
            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 font-semibold">
              <Link
                to="/privacy"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                Privacy Policy
              </Link>
              <span className="text-gray-300 dark:text-white/10">•</span>
              <Link
                to="/terms"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                Terms of Service
              </Link>
            </div>
            <span className="text-gray-400 dark:text-white/30 text-[10px] tracking-wider uppercase font-bold mt-1">
              © {new Date().getFullYear()} CashFlow Inc. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
