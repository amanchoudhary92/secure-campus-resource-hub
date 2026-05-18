import Link from "next/link";
import { AlertTriangle, ShieldCheck, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { UploadForm } from "@/components/upload/UploadForm";
import { getCurrentSession } from "@/lib/auth/session";

export default async function UploadPage() {
  const session = await getCurrentSession();

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Upload Academic Resource</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Uploads are validated, saved securely, and sent to admin review. They become public only after approval.
          </p>
        </div>

        {!session ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-soft">
            <div className="flex items-start gap-4">
              <Lock className="mt-1 h-7 w-7" />
              <div>
                <h2 className="text-2xl font-black">Login required</h2>
                <p className="mt-2 text-sm leading-6">Please login before uploading resources so every upload can be linked to a verified student account.</p>
                <div className="mt-5 flex gap-3">
                  <Link href="/login" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Login</Link>
                  <Link href="/register" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700">Register</Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <UploadForm />

            <aside className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                  <h2 className="text-lg font-black text-slate-950">Security Checks</h2>
                </div>
                <ul className="space-y-3 text-sm leading-6 text-slate-600">
                  <li>✅ Login required</li>
                  <li>✅ File extension validation</li>
                  <li>✅ MIME type validation</li>
                  <li>✅ Magic number/signature check</li>
                  <li>✅ Duplicate file hash check</li>
                  <li>✅ Status = PENDING_REVIEW</li>
                  <li>✅ Admin approval before public visibility</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-red-800">
                <div className="mb-3 flex items-center gap-3 font-black">
                  <AlertTriangle className="h-6 w-6" /> Auto-Rejected
                </div>
                <p className="text-sm leading-6">Images, videos, ZIP/RAR/7Z archives, executables, scripts, duplicates, and suspicious adult/vulgar text are rejected automatically.</p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </AppShell>
  );
}
