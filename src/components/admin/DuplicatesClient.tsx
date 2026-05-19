"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CopyX,
  FileText,
  Hash,
  Info,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { DuplicateFileGroup } from "@/lib/db/supabase-admin";

const statuses = ["ALL", "PENDING_REVIEW", "APPROVED", "REJECTED", "BLOCKED"];

function statusClass(status: string) {
  if (status === "APPROVED") return "bg-green-50 text-green-700 ring-green-100";
  if (status === "PENDING_REVIEW") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "BLOCKED") return "bg-red-50 text-red-700 ring-red-100";
  if (status === "REJECTED") return "bg-orange-50 text-orange-700 ring-orange-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

export function DuplicatesClient({ groups }: { groups: DuplicateFileGroup[] }) {
  const [status, setStatus] = useState("ALL");
  const [email, setEmail] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const emailQuery = email.trim().toLowerCase();
    const searchQuery = query.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : 0;

    return groups
      .map((group) => ({
        ...group,
        resources: group.resources.filter((resource) => {
          const matchesStatus = status === "ALL" || resource.status === status;
          const matchesEmail =
            !emailQuery ||
            String(resource.uploaded_by_email || "").toLowerCase().includes(emailQuery);

          const matchesDate =
            !fromTs || new Date(resource.created_at).getTime() >= fromTs;

          const searchableText = normalize([
            group.file_hash,
            resource.title,
            resource.subject,
            resource.branch,
            resource.semester,
            resource.status,
            resource.file_name,
            resource.uploaded_by_name,
            resource.uploaded_by_email,
            resource.id,
          ].join(" "));

          const matchesQuery = !searchQuery || searchableText.includes(searchQuery);

          return matchesStatus && matchesEmail && matchesDate && matchesQuery;
        }),
      }))
      .filter((group) => group.resources.length > 1);
  }, [groups, status, email, dateFrom, query]);

  const visibleDuplicateRecords = filtered.reduce(
    (total, group) => total + group.resources.length,
    0
  );

  const activeFilterCount = [
    status !== "ALL" ? status : "",
    email,
    dateFrom,
    query,
  ].filter(Boolean).length;

  function clearFilters() {
    setStatus("ALL");
    setEmail("");
    setDateFrom("");
    setQuery("");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-900 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm">
            <Info className="h-5 w-5" />
          </div>

          <div>
            <p className="font-black text-blue-950">
              Duplicate dashboard is analysis-only by design.
            </p>
            <p className="mt-1">
              Deleting one resource never deletes other resources with the same hash.
              Use the main Admin moderation page to delete a specific resource after
              reviewing its status, uploader, and moderation context.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
              <CopyX className="h-3.5 w-3.5" />
              Duplicate filters
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-950">
              Review duplicate file groups
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Filter duplicate records by hash, title, uploader, status, email, or upload date.
            </p>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search hash, title, file, uploader..."
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

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Filter uploader email..."
            className="input"
          />

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="input"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <p>
            Showing <b className="text-slate-950">{filtered.length}</b> duplicate hash groups
            with <b className="text-slate-950">{visibleDuplicateRecords}</b> matching records
          </p>
          <p className="text-xs font-black text-slate-600">
            {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {filtered.length ? (
        filtered.map((group) => (
          <div
            key={group.file_hash}
            className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft"
          >
            <div className="border-b border-slate-100 bg-white p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Duplicate hash
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <code className="max-w-full rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                      {group.file_hash}
                    </code>

                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-100">
                      <CopyX className="h-3.5 w-3.5" />
                      {group.resources.length} uploads
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-800 ring-1 ring-blue-100">
                  Same hash means same file content. Review each record separately.
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Uploader</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">File</th>
                    <th className="px-5 py-3">Resource ID</th>
                  </tr>
                </thead>

                <tbody>
                  {group.resources.map((resource) => (
                    <tr
                      key={resource.id}
                      className="border-t border-slate-100 align-top hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="max-w-[280px] font-black text-slate-950">
                          {resource.title}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {resource.subject} • {resource.semester} Sem • {resource.branch}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-start gap-2">
                          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <div className="font-bold text-slate-700">
                              {resource.uploaded_by_name || "Unknown"}
                            </div>
                            <div className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                              {resource.uploaded_by_email || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        <div className="inline-flex items-center gap-2 font-bold">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {formatDate(resource.created_at)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(resource.status)}`}
                        >
                          {resource.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="max-w-[260px] truncate font-bold">
                              {resource.file_name || "-"}
                            </p>
                            <p className="mt-1 text-xs uppercase text-slate-400">
                              {resource.file_type || "file"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <Hash className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <code className="max-w-[240px] truncate text-xs text-slate-500">
                            {resource.id}
                          </code>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-50 text-green-700">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-950">
            No duplicate hashes found
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            The active duplicate blocker is keeping repeated uploads out of the system, or the current filters do not match any duplicate group.
          </p>
        </div>
      )}
    </div>
  );
}