import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  Lock,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { UploadForm } from "@/components/upload/UploadForm";
import { getCurrentSession } from "@/lib/auth/session";

export default async function UploadPage() {
  const session = await getCurrentSession();

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-700 to-teal-600 p-6 text-white shadow-soft md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-50 ring-1 ring-white/20">
                <UploadCloud className="h-4 w-4" />
                Secure upload workflow
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
                Upload academic resources for admin review.
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-50/90 md:text-base">
                Your file is validated, stored securely, checked for duplicates, and kept private until an admin approves it.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#upload-form"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <FileCheck2 className="h-5 w-5" />
                  Start Upload
                </a>

                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Browse Resources
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <ShieldCheck className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">Private</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Storage</p>
              </div>

              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <FileText className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">Hash</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Duplicate check</p>
              </div>

              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <CheckCircle2 className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">Review</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Admin approval</p>
              </div>
            </div>
          </div>
        </div>

        {!session ? (
          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm">
                <Lock className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-2xl font-black">Login required</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6">
                  Please login before uploading resources so every upload can be linked to a student account and reviewed safely.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="upload-form" className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <UploadForm />

            <aside className="space-y-5">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Security Checks</h2>
                    <p className="text-xs font-bold text-slate-500">Before admin review</p>
                  </div>
                </div>

                <ul className="space-y-3 text-sm leading-6 text-slate-600">
                  {[
                    "Login required",
                    "File extension validation",
                    "MIME type validation",
                    "Magic number/signature check",
                    "Duplicate file hash check",
                    "Status set to PENDING_REVIEW",
                    "Admin approval before public visibility",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-green-700">
                    <FileCheck2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Allowed files</h2>
                    <p className="text-xs font-bold text-slate-500">Academic documents only</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["PDF", "DOCX", "PPTX", "TXT"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Upload notes, previous year questions, lab files, assignments, and syllabus documents related to academics.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-6 text-red-800 shadow-soft">
                <div className="mb-3 flex items-center gap-3 font-black">
                  <AlertTriangle className="h-6 w-6" />
                  Auto-rejected uploads
                </div>
                <p className="text-sm leading-6">
                  Images, videos, ZIP/RAR/7Z archives, executables, scripts, duplicates, and suspicious adult/vulgar text are rejected automatically.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </AppShell>
  );
}