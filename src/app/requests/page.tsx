import { ClipboardList, FileQuestion, Lock, MessageSquarePlus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RequestsClient } from "@/components/requests/RequestsClient";
import { getCurrentSession } from "@/lib/auth/session";
import { listResourceRequests } from "@/lib/db/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RequestsPage() {
  const session = await getCurrentSession();
  const requests = session ? await listResourceRequests() : [];

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-700 to-indigo-600 p-6 text-white shadow-soft md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-50 ring-1 ring-white/20">
                <MessageSquarePlus className="h-4 w-4" />
                Student request board
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
                Request missing notes, PYQs, assignments, and lab files.
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-50/90 md:text-base">
                Students can ask for missing academic material. Other students and admins can track open requests and help fill resource gaps.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#request-board"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <ClipboardList className="h-5 w-5" />
                  View Requests
                </a>

                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Browse Resources
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <FileQuestion className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">{requests.length}</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Requests</p>
              </div>

              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <ShieldCheck className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">Login</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Required</p>
              </div>

              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <ClipboardList className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">Open</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Board</p>
              </div>
            </div>
          </div>
        </div>

        {!session ? (
          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm">
                <Lock className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-2xl font-black">Login required</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6">
                  Please login to view the request board or submit a missing resource request. This keeps requests linked to student accounts.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="request-board">
            <RequestsClient initialRequests={requests} profile={session.profile || null} />
          </div>
        )}
      </section>
    </AppShell>
  );
}