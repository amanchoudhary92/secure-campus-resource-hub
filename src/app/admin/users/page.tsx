import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { getCurrentSession, isAdmin } from "@/lib/auth/session";
import { getPlatformStats, listProfilesForAdmin } from "@/lib/db/supabase-admin";
import { ShieldAlert, UploadCloud } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await getCurrentSession();

  if (!isAdmin(session)) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-900 shadow-soft">
          <ShieldAlert className="mb-3 h-9 w-9" />
          <h1 className="text-3xl font-black">Access denied</h1>
          <p className="mt-2 text-sm leading-6">Only ADMIN users can manage users.</p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Back to Dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const [profiles, stats] = await Promise.all([listProfilesForAdmin(), getPlatformStats()]);
  const blockedUsers = profiles.filter((profile) => profile.is_blocked).length;
  const activeUsers = profiles.length - blockedUsers;

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Admin User Management</h1>
            <p className="mt-2 text-sm text-slate-500">Block or unblock upload/request access for students.</p>
          </div>
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-soft">
            <UploadCloud className="h-4 w-4" /> Back to Moderation
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Registered Users</p><p className="mt-2 text-3xl font-black text-blue-700">{stats.registeredUsers}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Students</p><p className="mt-2 text-3xl font-black text-slate-950">{stats.studentUsers}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Admins</p><p className="mt-2 text-3xl font-black text-purple-700">{stats.adminUsers}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Active</p><p className="mt-2 text-3xl font-black text-green-700">{activeUsers}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Blocked</p><p className="mt-2 text-3xl font-black text-red-700">{blockedUsers}</p></div>
        </div>

        <AdminUsersTable profiles={profiles} currentAdminId={session!.user.id} />
      </section>
    </AppShell>
  );
}
