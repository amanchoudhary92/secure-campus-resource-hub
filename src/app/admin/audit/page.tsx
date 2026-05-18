import Link from "next/link";
import { ListChecks, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuditClient } from "@/components/admin/AuditClient";
import { getCurrentSession, isAdmin } from "@/lib/auth/session";
import { listAuditLogsForAdmin } from "@/lib/db/supabase-admin";

export default async function AdminAuditPage() {
  const session = await getCurrentSession();

  if (!isAdmin(session)) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-red-900 shadow-soft">
          <ShieldAlert className="mb-3 h-9 w-9" />
          <h1 className="text-3xl font-black">Access denied</h1>
          <p className="mt-2 text-sm leading-6">Only ADMIN users can access security audit logs.</p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Back to Dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const { logs } = await listAuditLogsForAdmin({ page: 1, pageSize: 250 });

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-slate-950"><ListChecks className="h-8 w-8 text-blue-600" /> Security Audit Logs</h1>
          <p className="mt-2 text-sm text-slate-500">Track moderation, downloads, duplicate attempts, limits, and admin security events.</p>
        </div>
        <AuditClient logs={logs} />
      </section>
    </AppShell>
  );
}
