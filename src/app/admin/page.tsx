import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AdminTable } from "@/components/admin/AdminTable";
import { getPlatformStats, listAllResourcesForAdmin } from "@/lib/db/supabase-admin";
import { getCurrentSession, isAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!isAdmin(session)) {
    return (
      <AppShell>
        <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-red-900 shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-red-700 shadow-sm">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-3xl font-black">Access denied</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Only ADMIN users can access moderation tools, user controls, audit logs, and duplicate review workflows.
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

  const [resources, stats] = await Promise.all([
    listAllResourcesForAdmin(),
    getPlatformStats(),
  ]);

  const pending = resources.filter((resource) => resource.status === "PENDING_REVIEW").length;
  const approved = resources.filter((resource) => resource.status === "APPROVED").length;
  const blocked = resources.filter(
    (resource) => resource.status === "BLOCKED" || resource.status === "REJECTED"
  ).length;

  const statCards = [
    {
      title: "Registered Users",
      value: stats.registeredUsers,
      description: "Students and admins",
      icon: Users,
      color: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
      title: "Total Upload Records",
      value: resources.length,
      description: "All resource submissions",
      icon: ListChecks,
      color: "bg-slate-100 text-slate-700 ring-slate-200",
    },
    {
      title: "Pending Review",
      value: pending,
      description: "Waiting for moderation",
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    {
      title: "Approved",
      value: approved,
      description: "Visible to students",
      icon: CheckCircle2,
      color: "bg-green-50 text-green-700 ring-green-100",
    },
    {
      title: "Rejected / Blocked",
      value: blocked,
      description: "Unsafe or invalid records",
      icon: ShieldAlert,
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
                <ShieldCheck className="h-4 w-4" />
                Admin moderation control
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight md:text-4xl">
                Review uploads, protect students, and keep resources trustworthy.
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-blue-50/90 md:text-base">
                Admins can approve safe academic resources, reject unsafe uploads, monitor duplicate submissions, manage users, and review audit logs for accountability.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin/users"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <Users className="h-5 w-5" />
                  Manage Users
                </Link>

                <Link
                  href="/admin/duplicates"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  <FileWarning className="h-5 w-5" />
                  Duplicate Review
                </Link>

                <Link
                  href="/admin/audit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  <Activity className="h-5 w-5" />
                  Audit Logs
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white/12 p-5 ring-1 ring-white/15 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-blue-50">
                  <ClipboardCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-black">Moderation workflow</h2>
                  <p className="mt-2 text-sm leading-6 text-blue-50/85">
                    Uploads stay private until approval. Unsafe files, duplicates, and blocked content are reviewed before students can access them.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm font-bold">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Pending uploads require admin action.
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Approved resources become visible to students.
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Audit logs preserve moderation accountability.
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
                    <p className="text-sm font-black text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{stat.value}</p>
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
                <ClipboardCheck className="h-3.5 w-3.5" />
                Upload moderation queue
              </div>

              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Resource Review Queue
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Review pending uploads before they become public. Approved files are available to students through signed downloads.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 ring-1 ring-blue-100">
              {pending} pending review{pending === 1 ? "" : "s"}
            </div>
          </div>

          <AdminTable resources={resources} />
        </div>
      </section>
    </AppShell>
  );
}