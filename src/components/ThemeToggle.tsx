import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg transition-colors overflow-hidden group ${
        theme === "dark"
          ? "bg-slate-800 text-yellow-300 hover:bg-slate-700"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
      aria-label="Toggle theme"
    >
      <div className="relative z-10">
        {theme === "dark" ? (
          <Moon className="w-5 h-5 transition-transform group-hover:rotate-12" />
        ) : (
          <Sun className="w-5 h-5 transition-transform group-hover:rotate-90" />
        )}
      </div>
    </button>
  );
}
