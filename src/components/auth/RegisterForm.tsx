"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserPlus } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setMessage(data.error || "Registration failed.");
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
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-2xl gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Create account</h1>
        <p className="mt-2 text-sm text-slate-500">Public registration creates a STUDENT account. Admin role is assigned only to fixed admin emails.</p>
      </div>

      {message && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">Full name</label>
          <input name="fullName" required className="input" placeholder="Rahul Sharma" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">Username</label>
          <input name="username" required className="input" placeholder="rahul_cse" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">Email</label>
          <input name="email" required type="email" className="input" placeholder="you@example.com" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">Password</label>
          <input name="password" required type="password" minLength={8} className="input" placeholder="Minimum 8 characters" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">Branch</label>
          <select name="branch" className="input"><option>CSE</option><option>IT</option><option>ECE</option><option>ME</option><option>CE</option></select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">Semester</label>
          <select name="semester" className="input"><option>1st</option><option>2nd</option><option>3rd</option><option>4th</option><option>5th</option><option>6th</option><option>7th</option><option>8th</option></select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">Enrollment number</label>
          <input name="enrollmentNo" className="input" placeholder="Optional" />
        </div>
      </div>

      <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-70">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
        Register
      </button>

      <p className="text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-black text-blue-700">Login</Link></p>
    </form>
  );
}
