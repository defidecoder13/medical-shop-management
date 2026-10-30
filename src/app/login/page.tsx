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
      {/* Calm mint wash background with faint medical vector art */}
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {/* Soft atmospheric radial gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(55rem_25rem_at_20%_0%,rgba(156,212,210,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45rem_20rem_at_80%_100%,rgba(214,237,179,0.18),transparent_60%)]" />

        {/* Soft ambient blur spots */}
        <div className="absolute -top-32 -left-20 w-[540px] h-[540px] rounded-full bg-[#9CD4D2]/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-[500px] h-[500px] rounded-full bg-[#D6EDB3]/20 blur-3xl" />

        {/* 1. Large Faint Medical Cross (Upper-Left) */}
        <svg
          className="absolute top-10 left-10 hidden md:block w-28 h-28 text-[#397F7C]/15 dark:text-[#9CD4D2]/10"
          viewBox="0 0 64 64"
          fill="currentColor"
        >
          <path d="M24 6h16v18h18v16H40v18H24V40H6V24h18z" />
        </svg>

        {/* 2. Floating Medium Medical Cross (Bottom-Right) */}
        <svg
          className="absolute bottom-16 right-16 hidden sm:block w-20 h-20 text-[#397F7C]/15 dark:text-[#9CD4D2]/10"
          viewBox="0 0 64 64"
          fill="currentColor"
        >
          <path d="M24 6h16v18h18v16H40v18H24V40H6V24h18z" />
        </svg>

        {/* 3. Floating Small Medical Cross (Top-Right) */}
        <svg
          className="absolute top-20 right-32 hidden lg:block w-12 h-12 text-[#9CD4D2]/30 dark:text-[#9CD4D2]/15"
          viewBox="0 0 64 64"
          fill="currentColor"
        >
          <path d="M24 6h16v18h18v16H40v18H24V40H6V24h18z" />
        </svg>

        {/* 4. Faint ECG Heartbeat Pulse Line (Lower-Left) */}
        <svg
          className="absolute bottom-12 left-10 hidden lg:block w-[460px] text-[#397F7C]/20 dark:text-[#9CD4D2]/15"
          viewBox="0 0 460 70"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M0 35 L120 35 L135 35 L145 15 L155 58 L168 5 L180 62 L192 28 L200 35 L320 35 L332 20 L342 50 L354 10 L366 58 L376 35 L460 35" />
        </svg>

        {/* 5. Angled Medicine Capsule & Tablet Vector Art (Lower-Right) */}
        <svg
          className="absolute right-10 bottom-24 hidden xl:block w-40 h-32 text-[#397F7C]/20 dark:text-[#9CD4D2]/15"
          viewBox="0 0 160 120"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
        >
          <g transform="rotate(32 80 60)">
            <rect x="52" y="14" width="48" height="92" rx="24" />
            <line x1="52" y1="60" x2="100" y2="60" />
            <path d="M62 30 C66 24, 76 20, 84 20" strokeLinecap="round" strokeWidth={2.5} />
          </g>
          <circle cx="132" cy="94" r="14" fill="currentColor" stroke="none" opacity={0.3} />
          <line x1="126" y1="94" x2="138" y2="94" stroke="#EFF9F9" strokeWidth={2.5} strokeLinecap="round" />
        </svg>

        {/* 6. Faint Rx Prescription Symbol (Upper-Right) */}
        <svg
          className="absolute top-10 right-[18%] hidden xl:block w-28 h-28 text-[#397F7C]/12 dark:text-[#9CD4D2]/10"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.5}
          strokeLinecap="round"
        >
          <path d="M25 20 L25 80 M25 20 C60 20, 60 52, 25 52 L65 80 M42 62 L68 76" />
        </svg>

        {/* 7. Dotted Matrix Patterns */}
        <div className="absolute top-10 right-12 hidden md:block w-36 h-28 opacity-25 dark:opacity-15 bg-[radial-gradient(#397F7C_1.3px,transparent_1.3px)] bg-[size:16px_16px]" />
        <div className="absolute bottom-16 left-14 hidden md:block w-36 h-28 opacity-20 dark:opacity-10 bg-[radial-gradient(#397F7C_1.3px,transparent_1.3px)] bg-[size:16px_16px]" />

        {/* 8. Soft flowing waves at bottom */}
        <svg
          className="absolute -bottom-8 left-0 right-0 w-full h-32 text-[#9CD4D2]/15 dark:text-[#0E3235]/40"
          viewBox="0 0 1440 160"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,80 C320,140 600,30 900,90 C1200,150 1340,60 1440,80 L1440,160 L0,160 Z" />
        </svg>
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
