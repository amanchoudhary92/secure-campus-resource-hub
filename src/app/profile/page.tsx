import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  FileText,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentSession } from "@/lib/auth/session";
import { listResourcesByUploader } from "@/lib/db/supabase-admin";
import { MyUploadsTable } from "@/components/profile/MyUploadsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    return (
      <AppShell>
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm">
            <Lock className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-3xl font-black">Login required</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            Please login to view your profile, account details, upload history,
            and admin review status.
          </p>

          <Link
            href="/login"
            className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
          >
            Login
          </Link>
        </div>
      </AppShell>
    );
  }

  const uploads = await listResourcesByUploader(session.user.id);

  const approved = uploads.filter((item) => item.status === "APPROVED").length;
  const pending = uploads.filter(
    (item) => item.status === "PENDING_REVIEW",
  ).length;
  const rejected = uploads.filter(
    (item) => item.status === "REJECTED" || item.status === "BLOCKED",
  ).length;
  const generatedSummaries = uploads.filter(
    (item) =>
      item.summary_status === "GENERATED" || item.summary_status === "PARTIAL",
  ).length;

  const profileLabel =
    session.profile.role === "ADMIN" ? "Admin profile" : "Student profile";

  const stats = [
    {
      label: "Total Uploads",
      value: uploads.length,
      icon: UploadCloud,
      tone: "text-blue-700 bg-blue-50 ring-blue-100",
      description: "Your submitted resources",
    },
    {
      label: "Approved",
      value: approved,
      icon: BadgeCheck,
      tone: "text-green-700 bg-green-50 ring-green-100",
      description: "Visible to students",
    },
    {
      label: "Pending Review",
      value: pending,
      icon: Clock,
      tone: "text-amber-700 bg-amber-50 ring-amber-100",
      description: "Waiting for admin action",
    },
    {
      label: "Rejected / Blocked",
      value: rejected,
      icon: AlertTriangle,
      tone: "text-red-700 bg-red-50 ring-red-100",
      description: "Not publicly visible",
    },
  ];

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-950 p-6 text-white shadow-soft md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-50 ring-1 ring-white/20">
                <UserRound className="h-4 w-4" />
                {profileLabel}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/20 text-2xl font-black ring-1 ring-white/30">
                  {getInitials(session.profile.full_name)}
                </div>

                <div>
                  <h1 className="text-3xl font-black leading-tight md:text-4xl">
                    {session.profile.full_name}
                  </h1>
                  <p className="mt-2 text-sm font-medium text-blue-50/90">
                    {session.profile.branch || "Branch not set"} •{" "}
                    {session.profile.semester || "Semester not set"}
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-sm font-medium leading-6 text-blue-50/90 md:text-base">
                Track your account details, upload history, review status,
                feedback, and resource activity from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/upload"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <UploadCloud className="h-5 w-5" />
                  Upload Resource
                </Link>

                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  <FileText className="h-5 w-5" />
                  Browse Resources
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white/12 p-5 ring-1 ring-white/15 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-blue-50">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-black">Account status</h2>
                  <p className="mt-2 text-sm leading-6 text-blue-50/85">
                    Your uploads remain private until admin approval. Approved
                    resources become available through secure downloads.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm font-bold">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Role: {session.profile.role}
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Generated summaries: {generatedSummaries}/{uploads.length}
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  Warnings: {session.profile.warning_count || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-3 ring-1 ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  Account Details
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Your personal details are visible only to you and admins.
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100 text-sm">
              <p className="py-3">
                <UserRound className="mr-2 inline h-4 w-4 text-blue-600" />
                <b>Name:</b> {session.profile.full_name}
              </p>
              <p className="py-3">
                <Mail className="mr-2 inline h-4 w-4 text-blue-600" />
                <b>Email:</b> {session.profile.email}
              </p>
              <p className="py-3">
                <GraduationCap className="mr-2 inline h-4 w-4 text-blue-600" />
                <b>Branch/Semester:</b> {session.profile.branch || "-"} /{" "}
                {session.profile.semester || "-"}
              </p>
              <p className="py-3">
                <ShieldCheck className="mr-2 inline h-4 w-4 text-blue-600" />
                <b>Warnings:</b> {session.profile.warning_count || 0}
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  Upload Status Guide
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Understand what each upload status means.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <p className="rounded-2xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-100">
                <b>PENDING_REVIEW:</b> Your file is uploaded but not public yet.
                Admin will review it.
              </p>
              <p className="rounded-2xl bg-green-50 p-4 text-green-800 ring-1 ring-green-100">
                <b>APPROVED:</b> File is public on Resources and can be
                downloaded by students.
              </p>
              <p className="rounded-2xl bg-red-50 p-4 text-red-800 ring-1 ring-red-100">
                <b>REJECTED / BLOCKED:</b> File is not public. Check admin
                feedback in My Uploads.
              </p>
              <p className="rounded-2xl bg-blue-50 p-4 text-blue-800 ring-1 ring-blue-100">
                <b>Delete rule:</b> You can delete your own pending, rejected,
                or blocked uploads. Approved files are admin-controlled.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
                <UploadCloud className="h-3.5 w-3.5" />
                My submissions
              </div>

              <h2 className="mt-3 text-2xl font-black text-slate-950">
                My Uploads
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Track uploaded resources, review status, generated summaries,
                and admin feedback.
              </p>
            </div>

            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              <UploadCloud className="h-5 w-5" />
              New Upload
            </Link>
          </div>

          <MyUploadsTable uploads={uploads} />
        </div>
      </section>
    </AppShell>
  );
}
