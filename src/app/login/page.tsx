"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Plus } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2f6] to-[#d9e2f0] p-4 relative overflow-hidden">
      
      {/* Background decorations if any, but keeping it clean like the mockup */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[100px]" />
         <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-100/50 blur-[100px]" />
      </div>

      <div className="max-w-[420px] w-full p-10 bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative z-10 border border-white/60">
        
        {/* Branding Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center border-green-50  mb-4">
            <Plus className="w-8 h-8 text-green-500" strokeWidth={4} />
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-[26px] font-black leading-[1.05] tracking-tight">
              <span className="text-[#f97316]">MEDSATHI</span>
              <br />
              <span className="text-[#11327c]">PHARMACY</span>
            </h1>
          </div>
        </div>
        
        {/* Form Section */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
               {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[11px] font-extrabold text-[#11327c] uppercase tracking-wider ml-0.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-[18px] w-[18px] text-gray-500" strokeWidth={1.8} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#11327c]/20 focus:border-[#11327c] transition-all text-sm font-medium"
                  placeholder="spark@gmail.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[11px] font-extrabold text-[#11327c] uppercase tracking-wider ml-0.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px] text-gray-400" strokeWidth={1.8} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#11327c]/20 focus:border-[#11327c] transition-all text-sm font-medium tracking-widest"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#0d2a6a] to-[#1644a8] hover:to-[#11327c] text-white font-semibold rounded-xl transition-all shadow-[0_8px_16px_-4px_rgba(17,50,124,0.4)] flex items-center justify-center gap-2.5 text-[15px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-[18px] h-[18px] mb-[1px]" strokeWidth={2.2} />
                Sign in to Dashboard
              </>
            )}
          </button>
        </form>
        
        {/* Footer section */}
        <div className="mt-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">
                <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] uppercase font-extrabold text-[#11327c] mb-4 tracking-widest">Authorized Access Only</p>
            <div className="space-y-2.5 px-1">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900 font-medium tracking-tight">medsaathi@admin.com</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-600 font-medium">Password:</span>
                <span className="text-gray-900 font-medium tracking-tight">himadri@26</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}