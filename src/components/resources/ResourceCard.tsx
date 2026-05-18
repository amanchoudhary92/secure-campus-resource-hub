import { FileText, Sparkles, Star } from "lucide-react";
import type { ResourceRow } from "@/lib/db/supabase-admin";
import { DownloadButton } from "@/components/resources/DownloadButton";

const fileColors: Record<string, string> = {
  pdf: "bg-red-50 text-red-700",
  docx: "bg-blue-50 text-blue-700",
  pptx: "bg-orange-50 text-orange-700",
  txt: "bg-slate-100 text-slate-700",
};

export function ResourceCard({ resource }: { resource: ResourceRow }) {
  const type = resource.file_type.toLowerCase();
  const summary = resource.summary || resource.description;
  const keywords = resource.keywords?.length ? resource.keywords : resource.tags;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="grid h-40 place-items-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white text-blue-600 shadow-sm">
          <FileText className="h-10 w-10" />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${fileColors[type] || fileColors.txt}`}>
            {type}
          </span>
          {resource.summary_status === "GENERATED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
              <Sparkles className="h-3 w-3" /> AI Summary
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-black text-slate-950">{resource.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{summary}</p>

        {keywords?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.slice(0, 4).map((keyword) => (
              <span key={keyword} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {keyword}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{resource.subject}</span>
          <span>•</span>
          <span>{resource.semester} Sem</span>
          <span>•</span>
          <span>{resource.branch}</span>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>By {resource.uploaded_by_name}</span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.7
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-bold text-green-700">{resource.status}</span>
          {resource.storage_key ? (
            <DownloadButton resourceId={resource.id} />
          ) : (
            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
              Demo file
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
