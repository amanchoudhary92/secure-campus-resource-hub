import Link from "next/link";
import {
  CopyX,
  DatabaseZap,
  FileWarning,
  Hash,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DuplicatesClient } from "@/components/admin/DuplicatesClient";
import { getCurrentSession, isAdmin } from "@/lib/auth/session";
import { listDuplicateFileGroups } from "@/lib/db/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDuplicatesPage() {
  const session = await getCurrentSession();

  if (!isAdmin(session)) {
    return (
      <AppShell>
        <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-8 text-red-900 shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-red-700 shadow-sm">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-3xl font-black">Access denied</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Only ADMIN users can access duplicate upload intelligence.
          </p>

          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  const groups = await listDuplicateFileGroups();

  const duplicateResourceCount = groups.reduce(
    (total, group) => total + (group.resources?.length || 0),
    0
  );

  const highestDuplicateCount = groups.reduce(
    (max, group) => Math.max(max, group.resources?.length || 0),
    0
  );

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-700 to-indigo-600 p-6 text-white shadow-soft md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-50 ring-1 ring-white/20">
                <CopyX className="h-4 w-4" />
                Duplicate file intelligence
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight md:text-4xl">
                Review repeated file hashes and duplicate upload patterns.
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-blue-50/90 md:text-base">
                Duplicate detection uses stored file hashes to identify repeated
                uploads without creating a separate table. Admins can compare
                related records and decide whether to keep, reject, block, or delete.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Moderation Queue
                </Link>

                <Link
                  href="/admin/audit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Audit Logs
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <Hash className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">{groups.length}</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Hash groups</p>
              </div>

              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <FileWarning className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">{duplicateResourceCount}</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Records</p>
              </div>

              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <DatabaseZap className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">{highestDuplicateCount}</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Max repeats</p>
              </div>
            </div>
          </div>
        </div>

        <DuplicatesClient groups={groups} />
      </section>
    </AppShell>
  );
}