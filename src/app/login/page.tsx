"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        // Redirect to dashboard on successful login
        router.push("/");
        router.refresh(); // Refresh to update UI based on auth status
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="max-w-md w-full p-8 space-y-8 bg-card border border-border rounded-2xl shadow-2xl relative z-10 mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
            <span className="text-3xl font-bold bg-gradient-to-br from-primary to-indigo-600 bg-clip-text text-transparent">M</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            MedSaathi Admin
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your pharmacy 🚀
          </p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email-address" className="text-xs font-semibold text-muted-foreground uppercase ml-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase ml-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processing...
              </>
            ) : "Sign in to Dashboard"}
          </button>
        </form>
        
        <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 text-center tracking-wider">Authorized Access Only</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono text-foreground font-medium">medsaathi@admin.com</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Password:</span>
              <span className="font-mono text-foreground font-medium">himadri@26</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}