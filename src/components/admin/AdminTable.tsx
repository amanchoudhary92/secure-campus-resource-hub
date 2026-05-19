"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  Search,
  ShieldAlert,
  Trash2,
  UserX,
  XCircle,
} from "lucide-react";
import type { ResourceRow } from "@/lib/db/supabase-admin";

const statuses = ["All Status", "PENDING_REVIEW", "APPROVED", "REJECTED", "BLOCKED"];

function statusClass(status: string) {
  if (status === "APPROVED") return "bg-green-50 text-green-700 ring-green-100";
  if (status === "PENDING_REVIEW") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "BLOCKED") return "bg-red-50 text-red-700 ring-red-100";
  if (status === "REJECTED") return "bg-orange-50 text-orange-700 ring-orange-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function summaryStatusClass(status?: string | null) {
  if (status === "GENERATED") return "bg-green-50 text-green-700 ring-green-100";
  if (status === "PARTIAL") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (status === "NO_TEXT") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "FAILED") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function searchableText(resource: ResourceRow) {
  return normalize([
    resource.title,
    resource.description,
    resource.subject,
    resource.branch,
    resource.semester,
    resource.resource_type,
    resource.file_name,
    resource.file_type,
    resource.uploaded_by_name,
    resource.uploaded_by_email,
    resource.status,
    ...(resource.keywords || []),
    ...(resource.tags || []),
  ].join(" "));
}

export function AdminTable({ resources }: { resources: ResourceRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Status");

  const filteredResources = useMemo(() => {
    const q = normalize(query);

    return resources.filter((resource) => {
      const matchesQuery = !q || searchableText(resource).includes(q);
      const matchesStatus = status === "All Status" || resource.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [resources, query, status]);

  function clearFilters() {
    setQuery("");
    setStatus("All Status");
  }

  function getReviewReason(type: "approve" | "reject" | "block") {
    if (type === "approve") {
      return (
        window.prompt(
          "Approval note",
          "Approved by admin after manual review."
        ) || "Approved by admin after manual review."
      );
    }

    const defaultReason =
      type === "block"
        ? "Adult / inappropriate content or serious policy violation."
        : "Low quality / wrong subject / duplicate / copyright concern.";

    return (
      window.prompt(
        type === "block"
          ? "Block reason"
          : "Reject reason",
        defaultReason
      ) || defaultReason
    );
  }

  async function action(id: string, type: "approve" | "reject" | "block") {
    const reason = getReviewReason(type);

    setLoadingId(id);
    setMessage(null);

    try {
      const url =
        type === "approve"
          ? `/api/admin/resources/${id}/approve`
          : `/api/admin/resources/${id}/reject`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "approve"
            ? { reason }
            : { block: type === "block", reason }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Action failed.");
      }

      setMessage({ tone: "success", text: data.message || "Action completed." });
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Action failed.",
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function blockUploader(userId: string | null, uploaderName: string) {
    if (!userId) {
      setMessage({
        tone: "error",
        text: "This upload has no linked user profile to block.",
      });
      return;
    }

    const reason = window.prompt(
      `Block uploader ${uploaderName}? Reason:`,
      "Repeated unsafe/spam upload activity."
    );

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

      if (!res.ok) {
        throw new Error(data.error || "User block failed.");
      }

      setMessage({ tone: "success", text: data.message || "User blocked." });
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "User block failed.",
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteResource(id: string, title: string) {
    const confirmed = window.confirm(
      `Permanently delete "${title}"? This will remove the database record and the stored file.`
    );

    if (!confirmed) return;

    setLoadingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      setMessage({ tone: "success", text: data.message || "Resource deleted." });
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Delete failed.",
      });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Upload Moderation Queue
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Approve safe academic resources, reject unsafe files, block serious policy violations, or delete spam/test uploads.
            </p>
          </div>

          {message ? (
            <div
              className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${
                message.tone === "success"
                  ? "bg-green-50 text-green-700 ring-1 ring-green-100"
                  : "bg-red-50 text-red-700 ring-1 ring-red-100"
              }`}
            >
              {message.tone === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_140px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input pl-11"
              placeholder="Search resource, uploader, email, subject..."
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="input"
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            Clear
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing{" "}
          <b className="text-slate-950">{filteredResources.length}</b> of{" "}
          <b className="text-slate-950">{resources.length}</b> upload records
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">Resource</th>
              <th className="px-5 py-4">Uploader</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Summary</th>
              <th className="px-5 py-4">Moderation Reason</th>
              <th className="px-5 py-4">File</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredResources.map((resource) => {
              const isLoading =
                loadingId === resource.id || loadingId === resource.uploaded_by_id;

              return (
                <tr
                  key={resource.id}
                  className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <p className="line-clamp-2 max-w-[280px] font-black text-slate-950">
                      {resource.title}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {resource.subject} • {resource.semester} Sem • {resource.branch}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Uploaded: {formatDate(resource.created_at)}
                    </p>

                    {resource.keywords?.length ? (
                      <div className="mt-2 flex max-w-[280px] flex-wrap gap-1">
                        {resource.keywords.slice(0, 5).map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <div className="font-bold text-slate-700">
                      {resource.uploaded_by_name || "Unknown"}
                    </div>
                    <div className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                      {resource.uploaded_by_email || "-"}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700 ring-1 ring-slate-200">
                      {resource.file_type || "file"}
                    </span>
                    <p className="mt-2 max-w-[160px] truncate text-xs text-slate-400">
                      {resource.file_name || "-"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(resource.status)}`}
                    >
                      {resource.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${summaryStatusClass(resource.summary_status)}`}
                    >
                      {resource.summary_status || "NOT_RUN"}
                    </span>
                    <p className="mt-2 line-clamp-4 max-w-[340px] text-xs leading-5 text-slate-600">
                      {resource.summary || "No summary generated. Review the file manually."}
                    </p>
                  </td>

                  <td className="max-w-[280px] px-5 py-4 text-sm leading-6 text-slate-600">
                    {resource.moderation_reason || "No moderation note yet."}
                  </td>

                  <td className="px-5 py-4">
                    {resource.storage_key ? (
                      <a
                        href={`/api/admin/resources/${resource.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Open
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No file</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex max-w-[260px] flex-wrap gap-2">
                      {resource.status === "PENDING_REVIEW" ? (
                        <>
                          <button
                            disabled={isLoading}
                            onClick={() => action(resource.id, "approve")}
                            className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            {loadingId === resource.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </button>

                          <button
                            disabled={isLoading}
                            onClick={() => action(resource.id, "reject")}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-200 disabled:opacity-60"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>

                          <button
                            disabled={isLoading}
                            onClick={() => action(resource.id, "block")}
                            className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-200 disabled:opacity-60"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Block
                          </button>
                        </>
                      ) : (
                        <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
                          Reviewed
                        </span>
                      )}

                      <button
                        disabled={isLoading}
                        onClick={() => deleteResource(resource.id, resource.title)}
                        className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>

                      {resource.uploaded_by_id ? (
                        <button
                          disabled={isLoading}
                          onClick={() =>
                            blockUploader(
                              resource.uploaded_by_id,
                              resource.uploaded_by_name || "this user"
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Block User
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filteredResources.length ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-slate-500"
                >
                  No upload records found for the selected filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}