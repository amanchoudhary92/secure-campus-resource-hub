import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { testDatabaseConnection } from "@/lib/db/supabase-admin";
import { getCurrentSession, isAdmin } from "@/lib/auth/session";

const steps = [
  "Run npm install and npm run dev",
  "Run database/schema.sql in Supabase SQL Editor",
  "Create Supabase Storage bucket named resource-files",
  "Create .env.local with Supabase URL, service_role key, and SUPABASE_STORAGE_BUCKET=resource-files",
  "Check /api/health/db and /api/health/storage",
  "Upload PDF/DOCX/PPTX/TXT from /upload",
  "Verify file appears in Supabase Storage → resource-files → resources",
  "Test duplicate blocking by uploading the same file again",
];

export default async function SetupPage() {
  const session = await getCurrentSession();

  if (!isAdmin(session)) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-900 shadow-soft">
          <ShieldAlert className="mb-3 h-9 w-9" />
          <h1 className="text-3xl font-black">Setup page is admin-only</h1>
          <p className="mt-2 text-sm leading-6">This page is for development checks only and is hidden from the sidebar.</p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Back to Dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const db = await testDatabaseConnection();

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Development Setup Checklist</h1>
          <p className="mt-2 text-sm text-slate-500">
            This admin-only page is for local development checks. It is hidden from the sidebar and is not needed for students.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-black text-slate-950">Database Status</h2>
            <p className={`mt-3 rounded-2xl p-4 text-sm font-bold ${db.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {db.message} Mode: {db.mode}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-black text-slate-950">Storage Status</h2>
            <p className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
              Open /api/health/storage to verify your resource-files bucket.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">Operations</h2>
          <div className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-xs text-white">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
