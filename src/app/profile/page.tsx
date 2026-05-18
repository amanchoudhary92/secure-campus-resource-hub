import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ShieldCheck, UploadCloud, FileText, AlertTriangle, UserRound, Mail, GraduationCap, Lock, Clock, BadgeCheck } from "lucide-react";
import { getCurrentSession } from "@/lib/auth/session";
import { listResourcesByUploader } from "@/lib/db/supabase-admin";
import { MyUploadsTable } from "@/components/profile/MyUploadsTable";

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-soft">
          <Lock className="mb-3 h-8 w-8" />
          <h1 className="text-3xl font-black">Login required</h1>
          <p className="mt-2 text-sm leading-6">Please login to view your profile and upload history.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Login</Link>
        </div>
      </AppShell>
    );
  }

  const uploads = await listResourcesByUploader(session.user.id);
  const approved = uploads.filter((item) => item.status === "APPROVED").length;
  const pending = uploads.filter((item) => item.status === "PENDING_REVIEW").length;
  const rejected = uploads.filter((item) => item.status === "REJECTED" || item.status === "BLOCKED").length;
  const generatedSummaries = uploads.filter((item) => item.summary_status === "GENERATED" || item.summary_status === "PARTIAL").length;

  const stats = [
    { label: "Total Uploads", value: uploads.length, icon: UploadCloud, tone: "text-blue-600 bg-blue-50" },
    { label: "Approved", value: approved, icon: BadgeCheck, tone: "text-green-700 bg-green-50" },
    { label: "Pending Review", value: pending, icon: Clock, tone: "text-amber-700 bg-amber-50" },
    { label: "Rejected/Blocked", value: rejected, icon: AlertTriangle, tone: "text-red-700 bg-red-50" },
  ];

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Profile & My Uploads</h1>
          <p className="mt-2 text-sm text-slate-500">Track your account, upload status, admin feedback, and generated summaries.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-600 to-teal-500 p-6 text-white shadow-soft">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/20 text-2xl font-black ring-1 ring-white/30">
                {session.profile.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-blue-50">{session.profile.role} Account</p>
                <h2 className="mt-1 text-2xl font-black">{session.profile.full_name}</h2>
                <p className="mt-1 text-sm text-blue-50">{session.profile.branch || "Branch not set"} • {session.profile.semester || "Semester not set"}</p>
              </div>
            </div>
            <div className="grid gap-2 text-sm font-bold md:text-right">
              <div className="rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/25"><ShieldCheck className="mr-2 inline h-4 w-4" /> Role: {session.profile.role}</div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/25">AI summaries: {generatedSummaries}/{uploads.length}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{item.value}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${item.tone}`}><Icon className="h-5 w-5" /></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-black text-slate-950">Account Details</h3>
            <div className="mt-4 divide-y divide-slate-100 text-sm">
              <p className="py-3"><UserRound className="mr-2 inline h-4 w-4 text-blue-600" /> <b>Name:</b> {session.profile.full_name}</p>
              <p className="py-3"><Mail className="mr-2 inline h-4 w-4 text-blue-600" /> <b>Email:</b> {session.profile.email}</p>
              <p className="py-3"><GraduationCap className="mr-2 inline h-4 w-4 text-blue-600" /> <b>Branch/Semester:</b> {session.profile.branch || "-"} / {session.profile.semester || "-"}</p>
              <p className="py-3"><ShieldCheck className="mr-2 inline h-4 w-4 text-blue-600" /> <b>Warnings:</b> {session.profile.warning_count}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-black text-slate-950">Status Guide</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p><b className="text-amber-700">PENDING_REVIEW:</b> Your file is uploaded but not public yet. Admin will check it.</p>
              <p><b className="text-green-700">APPROVED:</b> File is public on Resources and can be downloaded by students.</p>
              <p><b className="text-red-700">REJECTED/BLOCKED:</b> File is not public. Check admin feedback/reason in My Uploads.</p>
              <p><b>Delete rule:</b> You can delete your own pending/rejected/blocked uploads. Approved files are admin-controlled.</p>
            </div>
          </div>
        </div>

        <MyUploadsTable uploads={uploads} />
      </section>
    </AppShell>
  );
}
