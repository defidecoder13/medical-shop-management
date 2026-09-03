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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-white">
      {/* Background Split: Left White, Right Pastel Blue */}
      <div className="absolute inset-0 pointer-events-none flex">
        <div className="w-1/2 bg-white" />
        <div className="w-1/2 bg-[#eaf2fd]" />
      </div>

      {/* Decorative Dot Matrix in Top-Left Corner */}
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12 grid grid-cols-3 gap-3.5 sm:gap-4 pointer-events-none">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#6ba4f8]/80"
          />
        ))}
      </div>

      {/* Center Auth Card Container */}
      <div className="relative z-10 w-full max-w-[880px] min-h-[480px] mx-auto flex flex-col lg:flex-row items-stretch">
        {/* Left Half: Pharmacy Vector Illustration with Crisp Blue Border */}
        <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 sm:p-10 border-2 border-[#5295f7] rounded-t-[28px] lg:rounded-t-none lg:rounded-l-[28px] lg:border-r-0">
          <PharmacyIllustration />
        </div>

        {/* Right Half: Clean Login Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 py-10 sm:px-12 sm:py-12 border border-[#d8e6fb] rounded-b-[28px] lg:rounded-b-none lg:rounded-r-[28px] lg:border-l-0 shadow-[0_20px_50px_rgba(59,130,246,0.06)]">
          <div className="w-full max-w-[320px] mx-auto">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3.5 mb-7">
              <div className="w-11 h-11 rounded-[14px] bg-[#1d6eed] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-6v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h6V3z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[19px] tracking-[0.06em] text-[#1d6eed] leading-tight">
                  MEDSATHI
                </span>
                <span className="text-[8.5px] font-semibold tracking-[0.42em] text-[#1d6eed]/80 uppercase mt-0.5">
                  PHARMACY
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-fade-in">
                  {error}
                </div>
              )}

              {/* Email Address Input */}
              <div className="relative flex items-center bg-white border border-[#dce7f6] rounded-xl px-4 py-3 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <Mail className="w-[18px] h-[18px] text-[#94a3b8] shrink-0" strokeWidth={1.8} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-transparent outline-none pl-3 text-[13.5px] text-slate-800 placeholder-[#94a3b8]"
                />
              </div>

              {/* Password Input */}
              <div className="relative flex items-center bg-white border border-[#dce7f6] rounded-xl px-4 py-3 focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <Lock className="w-[18px] h-[18px] text-[#94a3b8] shrink-0" strokeWidth={1.8} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-transparent outline-none px-3 text-[13.5px] text-slate-800 placeholder-[#94a3b8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#94a3b8] hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  )}
                </button>
              </div>

              {/* Keep me logged in Checkbox */}
              <div className="pt-0.5 pb-1">
                <label className="inline-flex items-center gap-2.5 text-[13px] text-[#64748b] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-[4px] border-[#cbd5e1] text-[#2563eb] focus:ring-blue-400 cursor-pointer"
                  />
                  <span>Keep me logged in</span>
                </label>
              </div>

              {/* Log in Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-medium text-[14.5px] tracking-wide transition-all shadow-md shadow-blue-600/20 flex items-center justify-center cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Log in"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
