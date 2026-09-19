import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Hexagon } from "lucide-react";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../stores/auth.store";
import { Button } from "../../components/ui/button";

export function LoginPage() {
  const navigate = useNavigate();
  const {
  setTokens,
  setUser,
  setInitialized,
  clearAuth,
} = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setFormError("");

    if (!email) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      isValid = false;
    }

    return isValid;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) {
    return;
  }

  setIsLoading(true);

  try {
    const tokens = await authApi.login({
      email,
      password,
    });

    setTokens(
      tokens.accessToken,
      tokens.refreshToken,
    );

    const user = await authApi.me();

    setUser(user.userId);
    setInitialized(true);

    navigate("/workspace", {
      replace: true,
    });
  } catch (error) {
    clearAuth();

    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.error?.message;

      setFormError(
        message ?? "Unable to sign in. Please try again.",
      );
    } else {
      setFormError(
        "Unable to sign in. Please try again.",
      );
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0c] text-white selection:bg-red-500/30">
      {/* Left side - Product Visual */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#111116] to-[#0a0a0c] border-r border-white/5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-red-500/10 via-purple-500/5 to-transparent blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-purple-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <Hexagon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">SaaS Billing</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-medium tracking-tight text-white mb-4">
            Subscriptions, invoices and payments.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            One place to manage your business. Streamline your revenue operations with our premium billing infrastructure.
          </p>
          
          <div className="mt-12 grid gap-4">
            {/* Decorative metric cards */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-xl transition-all hover:bg-white/10 hover:border-white/20">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <div className="text-sm text-gray-400">Monthly Recurring Revenue</div>
                <div className="text-lg font-semibold text-white">$124,500.00</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-xl transition-all hover:bg-white/10 hover:border-white/20 translate-x-8">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <div>
                <div className="text-sm text-gray-400">Active Subscriptions</div>
                <div className="text-lg font-semibold text-white">1,204</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="mx-auto w-full max-w-[400px]">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-purple-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <Hexagon className="h-5 w-5 text-white" />
             </div>
             <span className="text-lg font-semibold tracking-tight">SaaS Billing</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to continue to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`w-full h-11 px-3 bg-white/5 border ${emailError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-white/20 focus:ring-white/10'} rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-4 transition-all`}
                placeholder="user@example.com"
                autoComplete="email"
                autoFocus
              />
              {emailError && <p className="text-sm text-red-400 mt-1">{emailError}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={`w-full h-11 pl-3 pr-10 bg-white/5 border ${passwordError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-white/20 focus:ring-white/10'} rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-4 transition-all`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="text-sm text-red-400 mt-1">{passwordError}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-11 mt-6 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium border-0 rounded-lg shadow-[0_4px_14px_rgba(239,68,68,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-white hover:text-red-400 font-medium transition-colors">
              Create one
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}