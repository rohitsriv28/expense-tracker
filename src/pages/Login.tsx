import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/authService";
import {
  Wallet,
  Shield,
  Zap,
  BarChart3,
  Download,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Get detailed insights into your spending patterns",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Add expenses in seconds with our intuitive interface",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and stored securely",
    },
    {
      icon: Download,
      title: "Export Ready",
      description: "Generate beautiful PDF reports instantly",
    },
  ];

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="absolute inset-0">
          {/* Floating Elements */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Features Showcase */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
          <div className="max-w-lg">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-4xl font-bold text-white mb-2">CashFlow</h1>
                <p className="text-indigo-200">Smart Expense Tracking</p>
              </div>
            </div>

            {/* Feature Showcase */}
            <div className="space-y-6 mb-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-4 p-4 rounded-2xl transition-all duration-500 ${
                      currentFeature === index
                        ? "bg-white/10 backdrop-blur-sm shadow-xl scale-105"
                        : "bg-white/5 backdrop-blur-sm"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        currentFeature === index
                          ? "bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg"
                          : "bg-white/20"
                      }`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-indigo-200 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">10K+</div>
                <div className="text-indigo-200 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">₹50L+</div>
                <div className="text-indigo-200 text-sm">Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">4.9</div>
                <div className="text-indigo-200 text-sm flex items-center justify-center">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Rating
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8">
          <div className="max-w-md w-full">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20">
              {/* Mobile Logo */}
              <div className="text-center mb-8 lg:hidden">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl mb-4 shadow-2xl">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">CashFlow</h1>
                <p className="text-indigo-200">Smart Expense Tracking</p>
              </div>

              {/* Welcome Message */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-400 mr-2" />
                  <h2 className="text-2xl font-bold text-white">Welcome!</h2>
                </div>
                <p className="text-indigo-200">
                  Sign in to start tracking your expenses and gain valuable
                  insights into your spending habits.
                </p>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full group relative overflow-hidden bg-white hover:bg-gray-50 border-2 border-transparent hover:border-white/20 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    {/* Google Icon */}
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Security & Privacy */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="text-center mb-4">
                  <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-indigo-200 font-medium">
                    Secure & Private
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm text-indigo-200">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>End-to-end encrypted data</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-indigo-200">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>No data sharing with third parties</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-indigo-200">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>GDPR compliant</span>
                  </div>
                </div>
              </div>

              {/* Mobile Features Preview */}
              <div className="mt-6 lg:hidden">
                <div className="text-center mb-4">
                  <p className="text-sm text-indigo-200 font-medium">
                    What you'll get:
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <BarChart3 className="w-6 h-6 text-indigo-300 mx-auto mb-1" />
                    <div className="text-white font-medium">
                      Smart Analytics
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <Download className="w-6 h-6 text-purple-300 mx-auto mb-1" />
                    <div className="text-white font-medium">PDF Reports</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
