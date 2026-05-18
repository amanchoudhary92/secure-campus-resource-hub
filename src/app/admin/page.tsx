import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AdminTable } from "@/components/admin/AdminTable";
import { getPlatformStats, listAllResourcesForAdmin } from "@/lib/db/supabase-admin";
import { getCurrentSession, isAdmin } from "@/lib/auth/session";
import { ShieldAlert, Users } from "lucide-react";

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!isAdmin(session)) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-900 shadow-soft">
          <ShieldAlert className="mb-3 h-9 w-9" />
          <h1 className="text-3xl font-black">Access denied</h1>
          <p className="mt-2 text-sm leading-6">Only ADMIN users can access moderation tools.</p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Back to Dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const [resources, stats] = await Promise.all([listAllResourcesForAdmin(), getPlatformStats()]);
  const pending = resources.filter((r) => r.status === "PENDING_REVIEW").length;
  const approved = resources.filter((r) => r.status === "APPROVED").length;
  const blocked = resources.filter((r) => r.status === "BLOCKED" || r.status === "REJECTED").length;

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Admin Moderation Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">Review pending uploads before they become public.</p>
          </div>
          <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-soft">
            <Users className="h-4 w-4" /> Manage Users
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Registered Users</p><p className="mt-2 text-3xl font-black text-blue-700">{stats.registeredUsers}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Total Upload Records</p><p className="mt-2 text-3xl font-black text-slate-950">{resources.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Pending Review</p><p className="mt-2 text-3xl font-black text-amber-700">{pending}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Approved</p><p className="mt-2 text-3xl font-black text-green-700">{approved}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Rejected/Blocked</p><p className="mt-2 text-3xl font-black text-red-700">{blocked}</p></div>
        </div>

        <AdminTable resources={resources} />
      </section>
    </AppShell>
  );
}
