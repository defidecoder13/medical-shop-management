"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "@/src/components/icons";
import { PharmacyIllustration } from "@/src/components/auth/pharmacy-illustration";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-background dark:bg-[#0b1220]">
      {/* Layered background — light: soft radial, dark: deep mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_70%)] dark:opacity-[0.15]" />
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(45rem_28rem_at_85%_85%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_65%)]" />
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(35rem_20rem_at_15%_90%,color-mix(in_oklab,var(--primary)_5%,transparent),transparent_65%)]" />
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

              {/* Sign in Button — stronger in dark with glow */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-primary-foreground dark:text-white font-medium text-[13px] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-sm dark:shadow-[0_4px_16px_rgba(59,130,246,0.35),0_1px_0_rgba(255,255,255,0.12)_inset] active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
