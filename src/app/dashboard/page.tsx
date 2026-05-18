import { Download, FileText, ShieldCheck, UploadCloud, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { getPlatformStats, listResources } from "@/lib/db/supabase-admin";


export default async function DashboardPage() {
  const [resources, stats] = await Promise.all([listResources(), getPlatformStats()]);

  const statCards = [
    { title: "Registered Users", value: String(stats.registeredUsers), icon: Users, color: "bg-blue-50 text-blue-700" },
    { title: "Approved Resources", value: String(stats.approvedResources), icon: FileText, color: "bg-teal-50 text-teal-700" },
    { title: "Pending Reviews", value: String(stats.pendingResources), icon: UploadCloud, color: "bg-amber-50 text-amber-700" },
    { title: "Rejected/Blocked", value: String(stats.rejectedOrBlockedResources), icon: ShieldCheck, color: "bg-red-50 text-red-700" },
  ];

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-teal-500 p-8 text-white shadow-soft">
            <p className="text-sm font-bold text-blue-50">Welcome back 👋</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
              Safer academic resource sharing for your campus.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50 md:text-base">
              Students can share PDF, DOCX, PPTX, and TXT resources. Unsafe file types are blocked automatically and academic documents remain pending until admin approval.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/upload" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700">
                <UploadCloud className="h-5 w-5" /> Upload Resource
              </a>
              <a href="/resources" className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white ring-1 ring-white/30">
                <Download className="h-5 w-5" /> Explore Resources
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-black text-slate-950">Moderation-first Safety Policy</h2>
            <div className="mt-4 space-y-3 text-sm leading-6">
              <p className="rounded-2xl bg-green-50 p-4 font-bold text-green-700">Allowed: PDF, DOCX, PPTX, TXT</p>
              <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">Blocked: images, videos, ZIP/RAR/7Z, executables, scripts</p>
              <p className="rounded-2xl bg-blue-50 p-4 font-bold text-blue-700">Approved resources are visible publicly only after admin review.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500">{stat.title}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{stat.value}</p>
                  </div>
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl ${stat.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Recent Resources</h2>
              <p className="mt-1 text-sm text-slate-500">Latest approved academic files.</p>
            </div>
            <a href="/resources" className="text-sm font-black text-blue-700">View all</a>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resources.slice(0, 3).map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
