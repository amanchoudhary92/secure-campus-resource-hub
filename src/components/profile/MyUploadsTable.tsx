"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResourceRow } from "@/lib/db/supabase-admin";
import { DownloadButton } from "@/components/resources/DownloadButton";

function statusStyle(status: string) {
  if (status === "APPROVED") return "bg-green-50 text-green-700 ring-green-100";
  if (status === "PENDING_REVIEW") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "BLOCKED") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function canStudentDelete(resource: ResourceRow) {
  return resource.status === "PENDING_REVIEW" || resource.status === "REJECTED" || resource.status === "BLOCKED";
}

export function MyUploadsTable({ uploads }: { uploads: ResourceRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function deleteUpload(resource: ResourceRow) {
    const confirmed = window.confirm(`Delete "${resource.title}"? This will remove the uploaded file and its record.`);
    if (!confirmed) return;

    setLoadingId(resource.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setMessage(data.message || "Upload deleted successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">My Uploads</h3>
          <p className="mt-1 text-sm text-slate-500">Track your submissions, review status, summaries, and rejection reasons.</p>
        </div>
        {message ? <p className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">{message}</p> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">Resource</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Summary</th>
              <th className="px-5 py-4">Reason / Feedback</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((resource) => (
              <tr key={resource.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-5 py-4">
                  <p className="font-black text-slate-950">{resource.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{resource.subject} • {resource.resource_type} • {resource.file_type.toUpperCase()}</p>
                  {resource.keywords?.length ? (
                    <div className="mt-2 flex max-w-[300px] flex-wrap gap-1">
                      {resource.keywords.slice(0, 6).map((keyword) => (
                        <span key={keyword} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{keyword}</span>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyle(resource.status)}`}>{resource.status}</span></td>
                <td className="px-5 py-4 max-w-[360px] text-xs leading-5 text-slate-600">{resource.summary || "No summary generated for this file."}</td>
                <td className="px-5 py-4 max-w-[280px] text-slate-600">{resource.moderation_reason}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {resource.status === "APPROVED" ? (
                      <DownloadButton resourceId={resource.id} />
                    ) : null}
                    {canStudentDelete(resource) ? (
                      <button disabled={loadingId === resource.id} onClick={() => deleteUpload(resource)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Delete</button>
                    ) : (
                      <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">Admin controlled</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!uploads.length ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">You have not uploaded any resources yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
