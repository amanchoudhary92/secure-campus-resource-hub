import { BookOpenCheck, FileText, ShieldCheck, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ResourceBrowser } from "@/components/resources/ResourceBrowser";
import { listResources } from "@/lib/db/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResourcesPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

function countUniqueSubjects(resources: Awaited<ReturnType<typeof listResources>>) {
  return new Set(
    resources
      .map((resource) => resource.subject)
      .filter(Boolean)
  ).size;
}

function countPdfResources(resources: Awaited<ReturnType<typeof listResources>>) {
  return resources.filter((resource) =>
    String(resource.file_type || "").toLowerCase().includes("pdf")
  ).length;
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const resources = await listResources();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";

  const totalResources = resources.length;
  const totalSubjects = countUniqueSubjects(resources);
  const pdfResources = countPdfResources(resources);

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-950 p-6 text-white shadow-soft md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-50 ring-1 ring-white/20">
                <ShieldCheck className="h-4 w-4" />
                Admin-approved resources only
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
                Discover verified academic resources for your semester.
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-50/90 md:text-base">
                Browse approved notes, PYQs, lab files, and academic documents.
                Every public resource goes through server-side validation and admin review before visibility.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/upload"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <UploadCloud className="h-5 w-5" />
                  Upload New Resource
                </a>

                <a
                  href="/requests"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Request Missing Resource
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <BookOpenCheck className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">{totalResources}</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Approved</p>
              </div>

              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <FileText className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">{totalSubjects}</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">Subjects</p>
              </div>

              <div className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur">
                <FileText className="mb-3 h-5 w-5 text-blue-100" />
                <p className="text-2xl font-black">{pdfResources}</p>
                <p className="mt-1 text-xs font-bold text-blue-50/80">PDFs</p>
              </div>
            </div>
          </div>
        </div>

        <ResourceBrowser resources={resources} initialQuery={initialQuery} />
      </section>
    </AppShell>
  );
}