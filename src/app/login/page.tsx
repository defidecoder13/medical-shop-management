"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "@/src/components/icons";
import { PharmacyIllustration } from "@/src/components/auth/pharmacy-illustration";

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#f6f9ff] dark:bg-[#0b1220]">
      {/* Decorative healthcare background — behind card only, non-interactive */}
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none select-none">
        {/* 1. Overall wash: white → pale blue (light) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f3f8ff] to-[#e5efff] dark:opacity-0" />
        {/* Keep existing dark mesh */}
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(60rem_30rem_at_50%_-10%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_70%)] opacity-[0.15]" />
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(45rem_28rem_at_85%_85%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_65%)]" />
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(35rem_20rem_at_15%_90%,color-mix(in_oklab,var(--primary)_5%,transparent),transparent_65%)]" />

        {/* Light-only decorations, softened in dark */}
        <div className="absolute inset-0 dark:opacity-[0.12]">
          {/* 2a. Large soft glow bottom-right */}
          <div className="absolute -right-40 -bottom-48 hidden sm:block w-[620px] h-[620px] rounded-full bg-[#dbe8ff]/60 blur-3xl" />
          <div className="absolute right-[-140px] bottom-[-120px] hidden lg:block w-[440px] h-[440px] rounded-full bg-[#e2ecff]/70" />
          <div className="absolute right-[-40px] bottom-[-40px] hidden lg:block w-[300px] h-[300px] rounded-full bg-[#eaf1ff]/80" />

          {/* 2b. Overlapping waves bottom-left */}
          <svg className="absolute bottom-[-40px] left-[-80px] hidden sm:block w-[720px] text-[#e2ecff]" viewBox="0 0 720 260" fill="currentColor" opacity={0.7}>
            <path d="M0 150 C 140 110, 260 110, 380 160 S 600 220, 720 180 L720 260 L0 260 Z" opacity={0.9} />
            <path d="M0 190 C 150 150, 300 150, 430 200 S 620 250, 720 220 L720 260 L0 260 Z" fill="#d5e4ff" opacity={0.7} />
          </svg>

          {/* 3. Faint medical "+" symbols */}
          <svg className="absolute top-14 left-10 hidden md:block w-24 text-[#dbe7fb]" viewBox="0 0 64 64" fill="currentColor" opacity={0.9}>
            <path d="M24 6h16v18h18v16H40v18H24V40H6V24h18z" />
          </svg>
          <svg className="absolute top-[52%] right-[8%] hidden lg:block w-12 text-[#dbe7fb]" viewBox="0 0 64 64" fill="currentColor" opacity={0.9}>
            <path d="M24 6h16v18h18v16H40v18H24V40H6V24h18z" />
          </svg>

          {/* 3b. Capsule outline inside lower-right circle */}
          <svg className="absolute right-[52px] bottom-[72px] hidden lg:block w-36 text-[#b9cff2]" viewBox="0 0 144 120" fill="none" stroke="currentColor" strokeWidth={5} opacity={0.55}>
            <g transform="rotate(32 72 60)">
              <rect x="48" y="14" width="48" height="92" rx="24" />
              <line x1="48" y1="60" x2="96" y2="60" />
            </g>
            <circle cx="118" cy="96" r="16" fill="currentColor" stroke="none" opacity={0.55} />
            <line x1="110" y1="104" x2="126" y2="88" stroke="#eef4ff" strokeWidth={4} strokeLinecap="round" />
          </svg>

          {/* 4. Dotted grids */}
          <div className="absolute top-10 right-12 hidden md:block w-32 h-24 opacity-70 bg-[radial-gradient(#b9cff0_1.3px,transparent_1.3px)] bg-[size:16px_16px]" />
          <div className="absolute bottom-16 left-10 hidden md:block w-32 h-24 opacity-60 bg-[radial-gradient(#b9cff0_1.3px,transparent_1.3px)] bg-[size:16px_16px]" />

          {/* 5. Thin dashed curve upper-left → card */}
          <svg className="absolute top-0 left-0 hidden md:block w-[440px] text-[#c2d6f3]" viewBox="0 0 440 240" fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="7 7" opacity={0.8}>
            <path d="M-10 230 C 110 170, 210 130, 330 20" />
          </svg>

          {/* 6. Subtle tagline left of card */}
          <div className="absolute left-[4%] top-[36%] hidden xl:block -rotate-[6deg]">
            <p className="text-[22px] leading-[1.35] font-medium text-[#9db9e8]">
              Better Health
              <br />
              Brighter Tomorrow
            </p>
            <div className="mt-3 h-[3px] w-10 rounded-full bg-[#9db9e8]/60" />
          </div>
        </div>
      </div>

      {/* Center Auth Card — elevated in dark with ring + deep shadow */}
      <div className="relative z-10 w-full max-w-[880px] min-h-[480px] mx-auto flex flex-col lg:flex-row items-stretch border border-border dark:border-white/[0.08] rounded-xl overflow-hidden bg-card dark:bg-[#121b2e] shadow-card dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7),0_1px_0_0_rgba(255,255,255,0.06)_inset,0_0_0_1px_rgba(255,255,255,0.04)]">
        {/* Left Half: Pharmacy Vector Illustration — subtle tint separation in dark */}
        <div className="w-full lg:w-1/2 bg-muted/30 dark:bg-white/[0.03] flex items-center justify-center p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-border dark:border-white/[0.06] relative overflow-hidden">
          {/* subtle glow behind illustration in dark */}
          <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(30rem_20rem_at_50%_50%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_70%)] pointer-events-none" />
          <div className="relative z-10 w-full flex items-center justify-center dark:drop-shadow-[0_0_24px_rgba(59,130,246,0.12)]">
            <PharmacyIllustration />
          </div>
        </div>

        {/* Right Half: Clean Login Form — slightly elevated in dark */}
        <div className="w-full lg:w-1/2 bg-card dark:bg-[#1a2642]/40 dark:backdrop-blur-[1px] flex flex-col justify-center px-8 py-10 sm:px-8 sm:py-10">
          <div className="w-full max-w-[320px] mx-auto">
              {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary dark:bg-[#3b82f6] text-primary-foreground dark:text-white flex items-center justify-center shrink-0 shadow-sm dark:shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-6v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h6V3z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] tracking-tight text-foreground dark:text-white leading-tight">
                  MedSathi Pharmacy
                </span>
                <span className="text-[11px] text-muted-foreground dark:text-white/55">
                  Sign in to your account
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-lg bg-destructive/10 dark:bg-red-500/10 border border-destructive/20 dark:border-red-500/20 text-destructive dark:text-red-300 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Email Address Input */}
              <div className="relative flex items-center bg-muted/40 dark:bg-white/[0.06] border border-border dark:border-white/[0.08] rounded-lg px-3 py-2.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 dark:focus-within:border-primary/50 dark:focus-within:bg-white/[0.08] dark:focus-within:ring-primary/20 transition-all">
                <Mail className="w-4 h-4 text-muted-foreground dark:text-white/40 shrink-0" strokeWidth={2} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full bg-transparent outline-none pl-3 text-[13px] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center bg-muted/40 dark:bg-white/[0.06] border border-border dark:border-white/[0.08] rounded-lg px-3 py-2.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 dark:focus-within:border-primary/50 dark:focus-within:bg-white/[0.08] dark:focus-within:ring-primary/20 transition-all">
                <Lock className="w-4 h-4 text-muted-foreground dark:text-white/40 shrink-0" strokeWidth={2} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full bg-transparent outline-none px-3 text-[13px] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground dark:text-white/40 hover:text-foreground dark:hover:text-white/80 transition-colors p-1 -mr-1"
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
                <label className="inline-flex items-center gap-2 text-[13px] text-muted-foreground dark:text-white/60 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border dark:border-white/15 bg-card dark:bg-white/10 accent-primary cursor-pointer group-hover:border-primary/40 dark:group-hover:border-white/25 transition-colors"
                  />
                  <span className="group-hover:text-foreground dark:group-hover:text-white/90 transition-colors">Keep me logged in</span>
                </label>
              </div>

              {/* Sign in Button — transitions to a compact inline success state */}
              <button
                type="submit"
                disabled={loading || authSuccess}
                aria-live="polite"
                className={`w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-primary-foreground dark:text-white font-medium text-[13px] transition-all duration-200 ease-out flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-[0_4px_16px_rgba(59,130,246,0.35),0_1px_0_rgba(255,255,255,0.12)_inset] active:scale-[0.98] ${authSuccess ? "disabled:opacity-100 dark:disabled:opacity-100" : "disabled:opacity-50"}`}
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
              {/* Subtle secondary status — no layout shift theatrics */}
              <div aria-live="polite" className="min-h-[18px] text-center">
                {authSuccess && (
                  <p className="signin-fade-up text-[12px] text-muted-foreground dark:text-white/55 font-medium">
                    Opening your workspace…
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Inline success keyframes: stroke-draw check + gentle fade-up */}
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
