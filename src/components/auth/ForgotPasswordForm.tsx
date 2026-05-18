"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const email = String(new FormData(event.currentTarget).get("email") || "");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setOk(Boolean(data.ok));
      setMessage(data.message || data.error || "Request completed.");
    } catch {
      setOk(false);
      setMessage("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-md gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h1 className="text-3xl font-black text-slate-950">Forgot password</h1>
      <p className="text-sm text-slate-500">Enter your account email. Supabase will send a password reset link.</p>
      {message && <div className={`rounded-2xl p-4 text-sm font-bold ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</div>}
      <input name="email" type="email" required className="input" placeholder="you@example.com" />
      <button disabled={loading} className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-70">{loading ? "Sending..." : "Send reset link"}</button>
      <Link href="/login" className="text-center text-sm font-black text-blue-700">Back to login</Link>
    </form>
  );
}
