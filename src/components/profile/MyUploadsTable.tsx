"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { ResourceRow } from "@/lib/db/supabase-admin";
import { DownloadButton } from "@/components/resources/DownloadButton";

const statuses = ["ALL", "PENDING_REVIEW", "APPROVED", "REJECTED", "BLOCKED"];

function statusStyle(status: string) {
  if (status === "APPROVED") return "bg-green-50 text-green-700 ring-green-100";
  if (status === "PENDING_REVIEW") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "BLOCKED") return "bg-red-50 text-red-700 ring-red-100";
  if (status === "REJECTED") return "bg-orange-50 text-orange-700 ring-orange-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function summaryStatusStyle(status?: string | null) {
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
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function canStudentDelete(resource: ResourceRow) {
  return (
    resource.status === "PENDING_REVIEW" ||
    resource.status === "REJECTED" ||
    resource.status === "BLOCKED"
  );
}

export function MyUploadsTable({ uploads }: { uploads: ResourceRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const filteredUploads = useMemo(() => {
    const q = normalize(query);

    return uploads.filter((resource) => {
      const searchableText = normalize([
        resource.title,
        resource.description,
        resource.summary,
        resource.subject,
        resource.branch,
        resource.semester,
        resource.resource_type,
        resource.file_type,
        resource.file_name,
        resource.status,
        ...(resource.keywords || []),
        ...(resource.tags || []),
      ].join(" "));

      const matchesQuery = !q || searchableText.includes(q);
      const matchesStatus = status === "ALL" || resource.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [uploads, query, status]);

  const activeFilterCount = [
    query,
    status !== "ALL" ? status : "",
  ].filter(Boolean).length;

  function clearFilters() {
    setQuery("");
    setStatus("ALL");
  }

  async function deleteUpload(resource: ResourceRow) {
    const confirmed = window.confirm(
      `Delete "${resource.title}"? This will remove the uploaded file and its record.`
    );

    if (!confirmed) return;

    setLoadingId(resource.id);
    setMessage(null);

    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      setMessage({
        tone: "success",
        text: data.message || "Upload deleted successfully.",
      });

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
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-950">
              Upload History
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Search your submissions, check review status, read summary output,
              and view admin feedback.
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
              placeholder="Search title, subject, tags, file name..."
              className="input pl-11"
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <p>
            Showing <b className="text-slate-950">{filteredUploads.length}</b>{" "}
            of <b className="text-slate-950">{uploads.length}</b> uploads
          </p>
          <p className="text-xs font-black text-slate-600">
            {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">Resource</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Summary</th>
              <th className="px-5 py-4">Feedback</th>
              <th className="px-5 py-4">Uploaded</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUploads.map((resource) => {
              const isLoading = loadingId === resource.id;

              return (
                <tr
                  key={resource.id}
                  className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="max-w-[300px] font-black text-slate-950">
                          {resource.title}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {resource.subject} • {resource.resource_type} •{" "}
                          {String(resource.file_type || "file").toUpperCase()}
                        </p>
                        <p className="mt-1 max-w-[280px] truncate text-xs text-slate-400">
                          {resource.file_name || "No file name"}
                        </p>

                        {resource.keywords?.length ? (
                          <div className="mt-2 flex max-w-[300px] flex-wrap gap-1">
                            {resource.keywords.slice(0, 6).map((keyword) => (
                              <span
                                key={keyword}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyle(
                        resource.status
                      )}`}
                    >
                      {resource.status === "APPROVED" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : resource.status === "PENDING_REVIEW" ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      {resource.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${summaryStatusStyle(
                        resource.summary_status
                      )}`}
                    >
                      {resource.summary_status || "NOT_RUN"}
                    </span>

                    <p className="mt-2 line-clamp-4 max-w-[360px] text-xs leading-5 text-slate-600">
                      {resource.summary || "No summary generated for this file."}
                    </p>
                  </td>

                  <td className="max-w-[280px] px-5 py-4 text-sm leading-6 text-slate-600">
                    {resource.moderation_reason || "No admin feedback yet."}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {formatDate(resource.created_at)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex max-w-[240px] flex-wrap gap-2">
                      {resource.status === "APPROVED" ? (
                        <DownloadButton resourceId={resource.id} />
                      ) : null}

                      {canStudentDelete(resource) ? (
                        <button
                          disabled={isLoading}
                          onClick={() => deleteUpload(resource)}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Admin controlled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filteredUploads.length ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                  <h3 className="mt-3 text-lg font-black text-slate-950">
                    No uploads found
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try clearing filters or upload your first academic resource.
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}