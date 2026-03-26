"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  CalendarCheck, Flame, BarChart3, ArrowRight, Eye, EyeOff,
  Sparkles, CheckCircle2, Mail, ArrowLeft,
} from "lucide-react";

type View = "login" | "signup" | "forgot";

export default function LoginPage() {
  const { login, signup, resetPassword } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => { setError(""); setSuccessMsg(""); };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setIsSubmitting(true);

    try {
      if (view === "signup") {
        if (!name.trim()) { setError("Name is required"); setIsSubmitting(false); return; }
        await signup(email, password, name);
        setSuccessMsg("Account created! Check your email to confirm, then sign in.");
        setIsSubmitting(false);
        return;
      }
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    if (!email.trim()) { setError("Enter your email address"); return; }
    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setSuccessMsg("Password reset link sent! Check your email inbox.");
      setIsSubmitting(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const switchView = (v: View) => { setView(v); resetForm(); };

  const features = [
    { icon: CalendarCheck, title: "Daily Planning", desc: "Organize tasks day by day" },
    { icon: Flame, title: "Streak Tracking", desc: "Build consistency habits" },
    { icon: BarChart3, title: "Progress Reports", desc: "Weekly insights & analytics" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-brand-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">PlanFlow</h1>
          </div>
          <h2 className="text-5xl font-extrabold leading-tight mb-6">
            Plan your days.<br />
            <span className="text-brand-200">Track your growth.</span>
          </h2>
          <p className="text-lg text-brand-100 mb-12 max-w-md">
            Stay on top of your goals with daily planning, streak tracking,
            and beautiful progress visualization.
          </p>
          <div className="space-y-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-brand-200">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-brand-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">PlanFlow</h1>
          </div>

          {/* ─── Forgot Password View ─── */}
          {view === "forgot" ? (
            <>
              <button onClick={() => switchView("login")} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </button>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Reset password</h2>
                <p className="text-surface-500">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 text-base">
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send Reset Link<ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* ─── Login / Signup View ─── */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">
                  {view === "signup" ? "Create account" : "Welcome back"}
                </h2>
                <p className="text-surface-500">
                  {view === "signup" ? "Start your productivity journey today" : "Sign in to continue planning your success"}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-scale-in">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Account created!</p>
                    <p className="mt-0.5">Check your email to confirm, then sign in.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {view === "signup" && (
                  <div className="animate-slide-up">
                    <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="John Doe" required={view === "signup"} />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Password</label>
                    {view === "login" && (
                      <button type="button" onClick={() => switchView("forgot")} className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder={view === "signup" ? "Min 6 characters" : "Enter your password"}
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 text-base">
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {view === "signup" ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-surface-500">
                  {view === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button onClick={() => switchView(view === "signup" ? "login" : "signup")} className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
                    {view === "signup" ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </div>

              {view === "login" && (
                <div className="mt-10 p-4 bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 rounded-xl">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-surface-600 dark:text-surface-400">
                      <p className="font-medium text-surface-800 dark:text-surface-200 mb-1">30-day sessions</p>
                      <p>Your session stays active for 30 days. No need to log in every time.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
