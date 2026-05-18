import Link from "next/link";
import { CopyX, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DuplicatesClient } from "@/components/admin/DuplicatesClient";
import { getCurrentSession, isAdmin } from "@/lib/auth/session";
import { listDuplicateFileGroups } from "@/lib/db/supabase-admin";

export default async function AdminDuplicatesPage() {
  const session = await getCurrentSession();

  if (!isAdmin(session)) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-red-900 shadow-soft">
          <ShieldAlert className="mb-3 h-9 w-9" />
          <h1 className="text-3xl font-black">Access denied</h1>
          <p className="mt-2 text-sm leading-6">Only ADMIN users can access duplicate upload intelligence.</p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Back to Dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const groups = await listDuplicateFileGroups();

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-slate-950"><CopyX className="h-8 w-8 text-blue-600" /> Duplicate File Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Review repeated file hashes and duplicate-upload patterns.</p>
        </div>
        <DuplicatesClient groups={groups} />
      </section>
    </AppShell>
  );
}
