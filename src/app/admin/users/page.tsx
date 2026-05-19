import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  UserCheck,
  UserCog,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { getCurrentSession, isAdmin } from "@/lib/auth/session";
import { getPlatformStats, listProfilesForAdmin } from "@/lib/db/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await getCurrentSession();

  if (!session || !isAdmin(session)) {
    return (
      <AppShell>
        <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-red-900 shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-red-700 shadow-sm">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-3xl font-black">Access denied</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Only ADMIN users can manage student accounts, block upload/request access, and review user activity.
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

  const [profiles, stats] = await Promise.all([
    listProfilesForAdmin(),
    getPlatformStats(),
  ]);

  const currentAdminId = session.user.id;
  const blockedUsers = profiles.filter((profile) => profile.is_blocked).length;
  const activeUsers = profiles.length - blockedUsers;

  const statCards = [
    {
      title: "Registered Users",
      value: stats.registeredUsers,
      description: "Total accounts",
      icon: Users,
      color: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
      title: "Students",
      value: stats.studentUsers,
      description: "Public registered users",
      icon: UserRound,
      color: "bg-slate-100 text-slate-700 ring-slate-200",
    },
    {
      title: "Admins",
      value: stats.adminUsers,
      description: "Protected admin accounts",
      icon: UserCog,
      color: "bg-purple-50 text-purple-700 ring-purple-100",
    },
    {
      title: "Active",
      value: activeUsers,
      description: "Allowed to upload/request",
      icon: UserCheck,
      color: "bg-green-50 text-green-700 ring-green-100",
    },
    {
      title: "Blocked",
      value: blockedUsers,
      description: "Restricted accounts",
      icon: UserX,
      color: "bg-red-50 text-red-700 ring-red-100",
    },
  ];

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-700 to-indigo-600 p-6 text-white shadow-soft md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-50 ring-1 ring-white/20">
                <Users className="h-4 w-4" />
                Admin user controls
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight md:text-4xl">
                Manage student access and protect the resource-sharing workflow.
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-blue-50/90 md:text-base">
                Admins can review registered accounts, block unsafe/spam users,
                unblock resolved accounts, and keep upload/request access accountable.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <UploadCloud className="h-5 w-5" />
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

            <div className="rounded-3xl bg-white/12 p-5 ring-1 ring-white/15 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-blue-50">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-black">Access policy</h2>
                  <p className="mt-2 text-sm leading-6 text-blue-50/85">
                    Admin accounts are protected. Blocked students lose upload and request access, while approved resources remain controlled by moderation rules.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm font-bold">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Students can be blocked or unblocked by admins.
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Admin accounts cannot be blocked from this screen.
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  User actions stay connected to audit and moderation records.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-500">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                      {stat.description}
                    </p>
                  </div>

                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
                <Users className="h-3.5 w-3.5" />
                User access table
              </div>

              <h2 className="mt-3 text-2xl font-black text-slate-950">
                User Management
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Block or unblock student access for uploads and resource requests. Admin accounts remain protected.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 ring-1 ring-blue-100">
              {profiles.length} total account{profiles.length === 1 ? "" : "s"}
            </div>
          </div>

          <AdminUsersTable profiles={profiles} currentAdminId={currentAdminId} />
        </div>
      </section>
    </AppShell>
  );
}