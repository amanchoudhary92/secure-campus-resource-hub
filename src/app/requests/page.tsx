import { AppShell } from "@/components/layout/AppShell";
import { RequestsClient } from "@/components/requests/RequestsClient";
import { getCurrentSession } from "@/lib/auth/session";
import { listResourceRequests } from "@/lib/db/supabase-admin";

export default async function RequestsPage() {
  const session = await getCurrentSession();
  const requests = session ? await listResourceRequests() : [];

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Request Resources</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ask for missing notes, PYQs, assignments, and lab files. Login is required to view and submit requests.
          </p>
        </div>

        <RequestsClient initialRequests={requests} profile={session?.profile || null} />
      </section>
    </AppShell>
  );
}
