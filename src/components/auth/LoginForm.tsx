"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setMessage(data.error || "Login failed.");
        return;
      }
      router.push(data.profile?.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-md gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Login</h1>
        <p className="mt-2 text-sm text-slate-500">Login as student or admin using email and password.</p>
      </div>
      {message && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}
      <div>
        <label className="mb-2 block text-sm font-black text-slate-700">Email</label>
        <input name="email" type="email" required className="input" placeholder="you@example.com" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-black text-slate-700">Password</label>
        <input name="password" type="password" required className="input" placeholder="Your password" />
      </div>
      <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-70">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
        Login
      </button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/register" className="font-black text-blue-700">Create account</Link>
        <Link href="/forgot-password" className="font-black text-blue-700">Forgot password?</Link>
      </div>
    </form>
  );
}
