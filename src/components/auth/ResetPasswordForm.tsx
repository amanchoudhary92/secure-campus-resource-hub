"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ResetPasswordForm() {
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setAccessToken(hash.get("access_token") || "");
    setRefreshToken(hash.get("refresh_token") || "");
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const password = String(new FormData(event.currentTarget).get("password") || "");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, refreshToken, password }),
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
      <h1 className="text-3xl font-black text-slate-950">Reset password</h1>
      <p className="text-sm text-slate-500">Enter your new password after opening the reset link from email.</p>
      {!accessToken && <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">Reset token not found. Open the link from your email.</div>}
      {message && <div className={`rounded-2xl p-4 text-sm font-bold ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</div>}
      <input name="password" type="password" required minLength={8} className="input" placeholder="New password" />
      <button disabled={loading || !accessToken} className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-70">{loading ? "Updating..." : "Update password"}</button>
      <Link href="/login" className="text-center text-sm font-black text-blue-700">Back to login</Link>
    </form>
  );
}
