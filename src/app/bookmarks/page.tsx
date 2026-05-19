import Link from "next/link";
import {
  Bookmark,
  BookOpenCheck,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function BookmarksPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-700 to-indigo-600 p-6 text-white shadow-soft md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-50 ring-1 ring-white/20">
                <Bookmark className="h-4 w-4" />
                Future upgrade
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight md:text-4xl">
                Personal bookmarks will be added in a future release.
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-blue-50/90 md:text-base">
                This section is reserved for saved academic resources. Once implemented,
                students will be able to bookmark approved notes, PYQs, lab files, and
                syllabus documents for quick access.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <Search className="h-5 w-5" />
                  Browse Resources
                </Link>

                <Link
                  href="/upload"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Upload Resource
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white/12 p-5 ring-1 ring-white/15 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-blue-50">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-black">Planned safe design</h2>
                  <p className="mt-2 text-sm leading-6 text-blue-50/85">
                    Bookmarks should be private to each logged-in student and should only
                    point to admin-approved public resources.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm font-bold">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  User-specific saved resources
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Approved resources only
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Add/remove bookmark controls
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Bookmark className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-950">
              Save resources
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Students will be able to save useful approved resources from the
              Resources page.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-100">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-950">
              Quick access
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Saved resources will appear here for faster access during study,
              labs, and exam preparation.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-purple-700 ring-1 ring-purple-100">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-950">
              Private to user
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Each student should only see their own bookmarks. Other students
              should not be able to view someone else&apos;s saved list.
            </p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-blue-100 bg-blue-50 p-6 text-blue-900 shadow-soft">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-6 w-6 shrink-0 text-blue-700" />
            <div>
              <h2 className="text-lg font-black text-blue-950">
                Why this is not active yet
              </h2>
              <p className="mt-2 text-sm leading-6">
                Real bookmarks need a dedicated database table, add/remove APIs,
                row-level ownership checks, and resource-card controls. Until then,
                this page intentionally does not show fake saved resources.
              </p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}