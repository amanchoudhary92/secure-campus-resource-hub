import { AppShell } from "@/components/layout/AppShell";
import { ResourceBrowser } from "@/components/resources/ResourceBrowser";
import { listResources } from "@/lib/db/supabase-admin";

type ResourcesPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const resources = await listResources();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Academic Resources</h1>
            <p className="mt-2 text-sm text-slate-500">Approved notes, PYQs, lab files, and academic documents.</p>
          </div>
          <a href="/upload" className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
            Upload New Resource
          </a>
        </div>

        <ResourceBrowser resources={resources} initialQuery={initialQuery} />
      </section>
    </AppShell>
  );
}
