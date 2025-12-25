import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="hidden md:flex flex-col items-center justify-center py-8 mt-auto text-gray-400 dark:text-gray-500 text-sm">
      <div className="flex items-center gap-1 mb-2">
        <span>Made with</span>
        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
        <span>for REAP</span>
      </div>
      <div className="flex gap-4">
        <span>© {new Date().getFullYear()} Expense Tracker</span>
        <span>•</span>
        <Link
          to="/privacy"
          className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
        >
          Privacy
        </Link>
        <span>•</span>
        <Link
          to="/terms"
          className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
        >
          Terms
        </Link>
      </div>
    </footer>
  );
}
