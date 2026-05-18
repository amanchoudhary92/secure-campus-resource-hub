"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResourceRow } from "@/lib/db/supabase-admin";

function statusClass(status: string) {
  if (status === "APPROVED") return "bg-green-50 text-green-700";
  if (status === "PENDING_REVIEW") return "bg-amber-50 text-amber-700";
  if (status === "BLOCKED") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-700";
}

function summaryStatusClass(status: string) {
  if (status === "GENERATED") return "bg-green-50 text-green-700";
  if (status === "PARTIAL") return "bg-blue-50 text-blue-700";
  if (status === "NO_TEXT") return "bg-amber-50 text-amber-700";
  if (status === "FAILED") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

export function AdminTable({ resources }: { resources: ResourceRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function getReviewReason(type: "approve" | "reject" | "block") {
    if (type === "approve") return window.prompt("Approval note", "Approved by admin after manual review.") || "Approved by admin after manual review.";

    const defaultReason =
      type === "block"
        ? "Adult / inappropriate content or serious policy violation."
        : "Low quality / wrong subject / duplicate / copyright concern.";

    return window.prompt(
      type === "block"
        ? "Block reason (example: Adult / inappropriate content)"
        : "Reject reason (example: Low quality / wrong subject / duplicate / copyright issue)",
      defaultReason,
    ) || defaultReason;
  }

  async function action(id: string, type: "approve" | "reject" | "block") {
    const reason = getReviewReason(type);
    setLoadingId(id);
    setMessage(null);
    try {
      const url = type === "approve" ? `/api/admin/resources/${id}/approve` : `/api/admin/resources/${id}/reject`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type === "approve" ? { reason } : { block: type === "block", reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      setMessage(data.message || "Action completed.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setLoadingId(null);
    }
  }

  async function blockUploader(userId: string | null, uploaderName: string) {
    if (!userId) {
      setMessage("This upload has no linked user profile to block.");
      return;
    }

    const reason = window.prompt(`Block uploader ${uploaderName}? Reason:`, "Repeated unsafe/spam upload activity.");
    if (!reason) return;

    setLoadingId(userId);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "User block failed.");
      setMessage(data.message || "User blocked.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User block failed.");
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteResource(id: string, title: string) {
    const confirmed = window.confirm(`Permanently delete "${title}"? This will remove the database record and the stored file.`);
    if (!confirmed) return;

    setLoadingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setMessage(data.message || "Resource deleted.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Upload Moderation Queue</h2>
          <p className="mt-1 text-sm text-slate-500">Approve safe academic resources, reject unsafe files, or permanently delete test/spam uploads.</p>
        </div>
        {message ? <p className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">{message}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1320px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">Resource</th>
              <th className="px-5 py-4">Uploader</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">AI Summary</th>
              <th className="px-5 py-4">Reason</th>
              <th className="px-5 py-4">File</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-5 py-4">
                  <p className="font-black text-slate-950">{resource.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{resource.subject} • {resource.semester} Sem • {resource.branch}</p>
                  {resource.keywords?.length ? (
                    <div className="mt-2 flex max-w-[280px] flex-wrap gap-1">
                      {resource.keywords.slice(0, 5).map((keyword) => (
                        <span key={keyword} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{keyword}</span>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-slate-600"><div>{resource.uploaded_by_name}</div><div className="text-xs text-slate-400">{resource.uploaded_by_email || "-"}</div></td>
                <td className="px-5 py-4 uppercase text-slate-600">{resource.file_type}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(resource.status)}`}>{resource.status}</span></td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${summaryStatusClass(resource.summary_status)}`}>{resource.summary_status}</span>
                  <p className="mt-2 line-clamp-4 max-w-[360px] text-xs leading-5 text-slate-600">{resource.summary || "No summary generated. Review the file manually."}</p>
                </td>
                <td className="px-5 py-4 max-w-[280px] text-slate-600">{resource.moderation_reason}</td>
                <td className="px-5 py-4">{resource.storage_key ? <a href={`/api/admin/resources/${resource.id}/download`} target="_blank" className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Open file</a> : <span className="text-xs text-slate-400">No file</span>}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {resource.status === "PENDING_REVIEW" ? (
                      <>
                        <button disabled={loadingId === resource.id} onClick={() => action(resource.id, "approve")} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Approve</button>
                        <button disabled={loadingId === resource.id} onClick={() => action(resource.id, "reject")} className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-800 disabled:opacity-60">Reject</button>
                        <button disabled={loadingId === resource.id} onClick={() => action(resource.id, "block")} className="rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-60">Block</button>
                      </>
                    ) : (
                      <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">Reviewed</span>
                    )}
                    <button disabled={loadingId === resource.id} onClick={() => deleteResource(resource.id, resource.title)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Delete</button>
                    {resource.uploaded_by_id ? (
                      <button
                        disabled={loadingId === resource.uploaded_by_id}
                        onClick={() => blockUploader(resource.uploaded_by_id, resource.uploaded_by_name)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                      >
                        Block User
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!resources.length ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">No upload records found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
