import { CalendarDays, FileText, GraduationCap, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import type { ResourceRow } from "@/lib/db/supabase-admin";
import { DownloadButton } from "@/components/resources/DownloadButton";

const fileColors: Record<string, string> = {
  pdf: "bg-red-50 text-red-700 ring-red-100",
  docx: "bg-blue-50 text-blue-700 ring-blue-100",
  pptx: "bg-orange-50 text-orange-700 ring-orange-100",
  txt: "bg-slate-100 text-slate-700 ring-slate-200",
};

function formatDate(value?: string | null) {
  if (!value) return "Recently added";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Recently added";
  }
}

function getFileTypeLabel(type?: string | null) {
  const normalized = String(type || "file").toLowerCase();
  return normalized.replace(".", "").toUpperCase();
}

export function ResourceCard({ resource }: { resource: ResourceRow }) {
  const type = String(resource.file_type || "txt").toLowerCase();
  const summary = resource.summary || resource.description;
  const keywords = resource.keywords?.length ? resource.keywords : resource.tags;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-5">
        <div className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-green-700 ring-1 ring-green-100">
          {resource.status}
        </div>

        <div className="grid h-28 place-items-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100 transition group-hover:scale-105">
            <FileText className="h-10 w-10" />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ring-1 ${fileColors[type] || fileColors.txt}`}>
            {getFileTypeLabel(type)}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified
          </span>

          {resource.summary_status === "GENERATED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-100">
              <Sparkles className="h-3.5 w-3.5" />
              Summary
            </span>
          )}
        </div>

        <div>
          <h3 className="line-clamp-2 text-lg font-black leading-snug text-slate-950">
            {resource.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {summary}
          </p>
        </div>

        {keywords?.length ? (
          <div className="flex flex-wrap gap-2">
            {keywords.slice(0, 4).map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <span>{resource.subject}</span>
            <span className="text-slate-300">•</span>
            <span>{resource.branch}</span>
            <span className="text-slate-300">•</span>
            <span>{resource.semester} Semester</span>
          </div>

          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-slate-500" />
            <span>Uploaded by {resource.uploaded_by_name || "Student"}</span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <span>{formatDate(resource.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-black uppercase tracking-wide text-green-700">
            Approved resource
          </span>

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