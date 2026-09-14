import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Hexagon, CheckCircle2 } from "lucide-react";
import { authApi } from "../../api/auth";
import { Button } from "../../components/ui/button";

export function RegisterPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
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

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.register({ email, password });
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.error?.message;

    setFormError(
      message ??
        "Unable to create your account. Please try again.",
    );
  } else {
    setFormError(
      "Unable to create your account. Please try again.",
    );
  }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0c] text-white selection:bg-purple-500/30">
      {/* Left side - Product Visual */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#111116] to-[#0a0a0c] border-r border-white/5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Subtle decorative glow - shifted to purple for variety but consistent */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-purple-500/10 via-red-500/5 to-transparent blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Hexagon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">SaaS Billing</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-medium tracking-tight text-white mb-4">
            Build, manage and scale your subscription business.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Create an account to start managing subscriptions, customers and billing from one integrated platform.
          </p>
          
          <div className="mt-12 grid gap-4">
            {/* Decorative flow cards */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-xl transition-all hover:bg-white/10 hover:border-white/20">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <div className="text-sm text-gray-400">Flexible Plans</div>
                <div className="text-sm font-medium text-white">Setup pricing tiers in minutes</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-xl transition-all hover:bg-white/10 hover:border-white/20 translate-x-8">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <div className="text-sm text-gray-400">Secure Payments</div>
                <div className="text-sm font-medium text-white">Automated revenue recovery</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="mx-auto w-full max-w-[400px]">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Hexagon className="h-5 w-5 text-white" />
             </div>
             <span className="text-lg font-semibold tracking-tight">SaaS Billing</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Create your account</h1>
            <p className="text-gray-400 text-sm">Start managing subscriptions, customers and billing from one place.</p>
          </div>

          {isSuccess ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Account created successfully</h3>
              <p className="text-sm text-gray-400">Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-500" noValidate>
              
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
                    autoComplete="new-password"
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

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className={`w-full h-11 pl-3 pr-10 bg-white/5 border ${confirmPasswordError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-white/20 focus:ring-white/10'} rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-4 transition-all`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPasswordError && <p className="text-sm text-red-400 mt-1">{confirmPasswordError}</p>}
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 mt-6 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white font-medium border-0 rounded-lg shadow-[0_4px_14px_rgba(168,85,247,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          )}

          {!isSuccess && (
            <p className="mt-8 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-white hover:text-purple-400 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          )}
          
        </div>
      </div>
    </div>
  );
}