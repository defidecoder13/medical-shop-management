"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "@/src/components/icons";
import { PharmacyIllustration } from "@/src/components/auth/pharmacy-illustration";
import { BrandMark } from "@/src/components/ui/brand-mark";

const REMEMBERED_EMAIL_KEY = "medishop_remembered_email";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const router = useRouter();

  // Prefill saved email when Keep me logged in was used before
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (res.ok) {
        try {
          if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
          else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        } catch {}
        // Inline success state: button becomes confirmation, then navigate
        setLoading(false);
        setAuthSuccess(true);
        await new Promise((r) => setTimeout(r, 1050));
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#E9F6F6] dark:bg-[#071E20]">
      {/* Calm mint wash background */}
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none select-none">
        <div className="absolute inset-0 bg-[radial-gradient(55rem_25rem_at_20%_0%,rgba(156,212,210,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45rem_20rem_at_80%_100%,rgba(214,237,179,0.18),transparent_60%)]" />
      </div>

      {/* Center Auth Card — Large rounded geometry as per Universal SaaS System */}
      <div className="relative z-10 w-full max-w-[860px] min-h-[460px] mx-auto flex flex-col lg:flex-row items-stretch border border-border/80 rounded-[32px] md:rounded-[36px] overflow-hidden bg-card shadow-soft">
        {/* Left Half: Vector Illustration */}
        <div className="w-full lg:w-1/2 bg-secondary/50 flex items-center justify-center p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-border/60 relative overflow-hidden">
          <div className="relative z-10 w-full flex items-center justify-center">
            <PharmacyIllustration />
          </div>
        </div>

        {/* Right Half: Clean Login Form */}
        <div className="w-full lg:w-1/2 bg-card flex flex-col justify-center px-8 py-10 sm:px-10 sm:py-12">
          <div className="w-full max-w-[320px] mx-auto">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 mb-6">
              <BrandMark size={38} />
              <div className="flex flex-col">
                <span className="font-display font-semibold text-[16px] tracking-tight text-foreground leading-tight">
                  MedSathi Pharmacy
                </span>
                <span className="text-[12px] text-muted-foreground mt-0.5">
                  Sign in to your dashboard
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-full px-4 bg-[#EDB2B7]/30 border border-[#E09EA5] text-[#5C151F] text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Email Address Input */}
              <div className="relative flex items-center bg-card border border-border rounded-full px-4 py-2.5 focus-within:border-[#397F7C] focus-within:ring-2 focus-within:ring-[#397F7C]/20 transition-all">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={2} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full bg-transparent outline-none pl-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center bg-card border border-border rounded-full px-4 py-2.5 focus-within:border-[#397F7C] focus-within:ring-2 focus-within:ring-[#397F7C]/20 transition-all">
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={2} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full bg-transparent outline-none px-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={2} />
                  )}
                </button>
              </div>

              {/* Keep me logged in Checkbox */}
              <div className="pt-0.5 pb-1">
                <label className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border bg-card accent-primary cursor-pointer transition-colors"
                  />
                  <span className="group-hover:text-foreground transition-colors">Keep me logged in</span>
                </label>
              </div>

              {/* Sign in Button */}
              <button
                type="submit"
                disabled={loading || authSuccess}
                aria-live="polite"
                className={`w-full py-2.5 px-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[13px] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-soft active:scale-[0.98] ${
                  authSuccess ? "disabled:opacity-100" : "disabled:opacity-50"
                }`}
              >
                {authSuccess ? (
                  <span className="signin-fade-up inline-flex items-center gap-2">
                    <span className="signin-check-wrap inline-flex">
                      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
                        <path
                          d="M3.2 8.6l3.1 3.1 6.5-7.4"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="signin-check-path"
                        />
                      </svg>
                    </span>
                    Signed in
                  </span>
                ) : loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </button>

              <div aria-live="polite" className="min-h-[18px] text-center">
                {authSuccess && (
                  <p className="signin-fade-up text-[12px] text-muted-foreground font-medium">
                    Opening your workspace…
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes signin-check-draw {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes signin-check-pop {
          from { transform: scale(0.9); }
          to { transform: scale(1); }
        }
        @keyframes signin-fade-up {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .signin-check-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: signin-check-draw 400ms ease-out forwards;
        }
        .signin-check-wrap {
          transform: scale(0.9);
          animation: signin-check-pop 250ms ease-out forwards;
        }
        .signin-fade-up {
          animation: signin-fade-up 220ms ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .signin-check-path,
          .signin-check-wrap,
          .signin-fade-up {
            animation: none;
          }
          .signin-check-path { stroke-dashoffset: 0; }
          .signin-check-wrap { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
