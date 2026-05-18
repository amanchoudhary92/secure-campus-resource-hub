import { AppShell } from "@/components/layout/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { listResources } from "@/lib/db/supabase-admin";

export default async function BookmarksPage() {
  const resources = await listResources();

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Bookmarks</h1>
          <p className="mt-2 text-sm text-slate-500">Demo saved resources. Real user bookmarks will be added after authentication setup.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {resources.slice(0, 2).map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
