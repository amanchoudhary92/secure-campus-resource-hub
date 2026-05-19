import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Download,
  FileText,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { getPlatformStats, listResources } from "@/lib/db/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [resources, stats] = await Promise.all([
    listResources(),
    getPlatformStats(),
  ]);

  const recentResources = resources.slice(0, 3);

  const statCards = [
    {
      title: "Registered Users",
      value: String(stats.registeredUsers),
      description: "Students and admins on the platform",
      icon: Users,
      color: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
      title: "Approved Resources",
      value: String(stats.approvedResources),
      description: "Visible to students after review",
      icon: FileText,
      color: "bg-teal-50 text-teal-700 ring-teal-100",
    },
    {
      title: "Pending Reviews",
      value: String(stats.pendingResources),
      description: "Waiting for admin moderation",
      icon: Clock3,
      color: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    {
      title: "Rejected / Blocked",
      value: String(stats.rejectedOrBlockedResources),
      description: "Unsafe or invalid upload records",
      icon: ShieldCheck,
      color: "bg-red-50 text-red-700 ring-red-100",
    },
  ];

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-950 p-6 text-white shadow-soft md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-50 ring-1 ring-white/20">
              <ShieldCheck className="h-4 w-4" />
              Moderation-first campus sharing
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight tracking-tight md:text-5xl">
              Safer academic resource sharing for students and admins.
            </h1>

            <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-blue-50/90 md:text-base">
              Students can upload academic documents, request missing materials,
              and download only approved resources. Every upload is validated,
              checked for duplicates, and reviewed before public visibility.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                <UploadCloud className="h-5 w-5" />
                Upload Resource
              </a>

              <a
                href="/resources"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                <Download className="h-5 w-5" />
                Explore Resources
              </a>

              <a
                href="/requests"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                Request Material
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Safety Policy
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Public resources are always admin-approved.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6">
              <p className="rounded-2xl bg-green-50 p-4 font-bold text-green-700 ring-1 ring-green-100">
                Allowed: PDF, DOCX, PPTX, TXT academic documents
              </p>
              <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700 ring-1 ring-red-100">
                Blocked: images, videos, archives, executables, scripts, duplicates, and unsafe text
              </p>
              <p className="rounded-2xl bg-blue-50 p-4 font-bold text-blue-700 ring-1 ring-blue-100">
                Downloads use short-lived signed URLs from private storage
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ${stat.color}`}>
                    <Icon className="h-7 w-7" />
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
                <FileText className="h-3.5 w-3.5" />
                Recently approved
              </div>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Recent Resources
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest approved academic files available for students.
              </p>
            </div>

            <a
              href="/resources"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              View all resources
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {recentResources.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recentResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-lg font-black text-slate-950">
                No approved resources yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload academic material and wait for admin approval before it appears here.
              </p>
              <a
                href="/upload"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
              >
                <UploadCloud className="h-5 w-5" />
                Upload Resource
              </a>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}