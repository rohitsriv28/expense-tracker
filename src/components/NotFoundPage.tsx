import {
  AlertTriangle,
  Home,
  ArrowLeft,
  Search,
  Compass,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      setIsSearching(false);
      navigate("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* 404 Animation */}
        <div className="relative mb-8 pt-8">
          <div className="text-8xl font-bold text-red-600 mb-4">404</div>
        </div>

        {/* Error Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto transform rotate-12 hover:rotate-0 transition-transform duration-500">
            <Compass className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Oops! Page Not Found
        </h1>

        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          The page you're looking for seems to have wandered off into the
          digital void. Don't worry though - let's get you back on track!
        </p>

        {/* Suggested Actions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center justify-center">
            <Search className="w-5 h-5 mr-2 text-red-600" />
            What would you like to do?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={handleGoHome}
              className="flex flex-col items-center p-6 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
            >
              <Home className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Go Home</span>
              <span className="text-xs opacity-90 mt-1">
                Return to dashboard
              </span>
            </button>

            <button
              onClick={handleGoBack}
              className="flex flex-col items-center p-6 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-gray-200 group"
            >
              <ArrowLeft className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform text-gray-600" />
              <span className="font-semibold">Go Back</span>
              <span className="text-xs text-gray-500 mt-1">Previous page</span>
            </button>

            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex flex-col items-center p-6 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
            >
              {isSearching ? (
                <RefreshCw className="w-8 h-8 mb-3 animate-spin" />
              ) : (
                <Search className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              )}
              <span className="font-semibold">
                {isSearching ? "Searching..." : "Search"}
              </span>
              <span className="text-xs opacity-90 mt-1">
                Find what you need
              </span>
            </button>
          </div>
        </div>

        {/* Popular Links */}
        <div className="bg-slate-100 rounded-2xl p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">Popular Pages</h4>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200"
            >
              Login
            </button>
          </div>
        </div>

        {/* Fun Fact */}
        <div className="mt-8 text-sm text-gray-500">
          <p className="flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Fun fact: This is a 404 error, named after room 404 at CERN where
            the web was born!
          </p>
        </div>
      </div>
    </div>
  );
}
