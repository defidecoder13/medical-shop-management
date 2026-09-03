"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ReceiptText,
  PackageSearch,
  BarChart3,
} from "lucide-react";
import { BrandMark } from "@/src/components/ui/brand-mark";

const features = [
  {
    icon: ReceiptText,
    title: "Lightning Billing",
    desc: "GST-ready invoicing with autocomplete in seconds",
  },
  {
    icon: PackageSearch,
    title: "Smart Inventory",
    desc: "Batch & expiry tracking with low-stock alerts",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    desc: "Revenue, profit and report insights in real time",
  },
];

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
    <div className="min-h-screen flex bg-background">
      {/* ---------- Brand panel (desktop) ---------- */}
      <div className="hidden lg:flex w-[46%] xl:w-[44%] relative flex-col justify-between p-12 overflow-hidden bg-[linear-gradient(160deg,oklch(0.24_0.09_262)_0%,oklch(0.3_0.105_262)_40%,oklch(0.42_0.19_255)_100%)] text-white">
        {/* decorative cross grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255 255 255 / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full bg-white/10 blur-[110px]" />
        <div className="absolute top-24 -left-24 w-[360px] h-[360px] rounded-full bg-success/25 blur-[100px]" />

        <div className="relative">
          <div className="flex items-center gap-3.5">
            <BrandMark size={48} />
            <div className="leading-none">
              <div className="font-display font-extrabold text-[20px] tracking-tight text-warning">
                MEDSATHI
              </div>
              <div className="font-display font-extrabold text-[15px] tracking-[0.12em] text-white/90 mt-1">
                PHARMACY
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-[34px] font-extrabold leading-[1.15] tracking-tight">
            Your pharmacy,
            <br />
            fully in control.
          </h2>
          <p className="mt-4 text-[15px] font-medium text-white/70 leading-relaxed">
            Everything your medical shop needs — billing, inventory, expiry
            tracking, patient care and sales reports — in one fast, reliable
            dashboard.
          </p>

          <div className="mt-10 space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15 flex items-center justify-center shrink-0">
                  <f.icon size={20} strokeWidth={2.2} className="text-white/90" />
                </div>
                <div>
                  <div className="text-[15px] font-bold">{f.title}</div>
                  <div className="text-[13px] font-medium text-white/60 mt-0.5">
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[12px] font-semibold text-white/45">
          © {new Date().getFullYear()} Medsathi Pharmacy · Pharmacy Management System
        </div>
      </div>

      {/* ---------- Form panel ---------- */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] -right-[10%] w-[45%] h-[55%] rounded-full bg-success/10 blur-[110px]" />
        </div>

        <div className="w-full max-w-[440px] relative">
          {/* Mobile brand */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <BrandMark size={56} withGlow />
            <div className="text-center mt-4">
              <h1 className="font-display text-[24px] font-black tracking-tight leading-tight">
                <span className="text-warning">MEDSATHI</span>
                <br />
                <span className="text-brand">PHARMACY</span>
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground mt-2">
                Sign in to manage your pharmacy
              </p>
            </div>
          </div>

          {/* Desktop greeting */}
          <div className="hidden lg:block mb-8 animate-fade-in">
            <h1 className="font-display text-[28px] font-extrabold tracking-tight text-foreground">
              Welcome back 👋
            </h1>
            <p className="text-[14px] font-medium text-muted-foreground mt-1.5">
              Sign in to your pharmacy dashboard to continue.
            </p>
          </div>

          <div className="bg-card border border-border rounded-3xl shadow-pop p-7 sm:p-9 animate-slide-up">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div
                  role="alert"
                  className="bg-destructive/10 border border-destructive/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-[13px] font-semibold flex items-center gap-2 animate-fade-in"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="label">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@pharmacy.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10 pr-11"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" strokeWidth={1.8} />
                      ) : (
                        <Eye className="h-5 w-5" strokeWidth={1.8} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-lg w-full"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in to Dashboard
                    <ArrowRight size={17} strokeWidth={2.4} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
