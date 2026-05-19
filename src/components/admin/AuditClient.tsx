"use client";

import { useMemo, useState } from "react";
import {
  Braces,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { AuditLogRow } from "@/lib/db/supabase-admin";

const actions = [
  "ALL",
  "RESOURCE_APPROVED",
  "RESOURCE_REJECTED",
  "RESOURCE_BLOCKED",
  "RESOURCE_DELETED",
  "USER_BLOCKED",
  "USER_UNBLOCKED",
  "REQUEST_DELETED",
  "DOWNLOAD_CREATED",
  "DUPLICATE_UPLOAD_ATTEMPT",
  "SUSPICIOUS_UPLOAD_BLOCKED",
  "RATE_LIMIT_EXCEEDED",
  "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT",
];

function safeMetadata(metadata: unknown) {
  try {
    return JSON.stringify(metadata || {}, null, 2);
  } catch {
    return "{}";
  }
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function actionClass(action: string) {
  if (action.includes("APPROVED")) return "bg-green-50 text-green-700 ring-green-100";
  if (action.includes("REJECTED")) return "bg-amber-50 text-amber-700 ring-amber-100";
  if (action.includes("BLOCKED") || action.includes("SUSPICIOUS")) {
    return "bg-red-50 text-red-700 ring-red-100";
  }
  if (action.includes("DOWNLOAD")) return "bg-blue-50 text-blue-700 ring-blue-100";
  if (action.includes("DUPLICATE")) return "bg-purple-50 text-purple-700 ring-purple-100";
  if (action.includes("RATE_LIMIT") || action.includes("UNAUTHORIZED")) {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function AuditClient({ logs }: { logs: AuditLogRow[] }) {
  const [action, setAction] = useState("ALL");
  const [query, setQuery] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 25;

  const activeFilterCount = [
    action !== "ALL" ? action : "",
    query,
    actorEmail,
    resourceId,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const actor = actorEmail.trim().toLowerCase();
    const resource = resourceId.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Infinity;

    return logs.filter((log) => {
      const created = new Date(log.created_at).getTime();
      const metadataText = safeMetadata(log.metadata).toLowerCase();

      const matchesAction = action === "ALL" || log.action === action;
      const matchesActor =
        !actor || String(log.actor_email || "").toLowerCase().includes(actor);
      const matchesResource =
        !resource ||
        String(log.resource_id || "").toLowerCase().includes(resource) ||
        metadataText.includes(resource);
      const matchesDate = created >= fromTs && created <= toTs;
      const matchesQuery =
        !q ||
        [
          log.action,
          log.reason || "",
          log.actor_email || "",
          log.actor_id || "",
          log.resource_id || "",
          metadataText,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      return matchesAction && matchesActor && matchesResource && matchesDate && matchesQuery;
    });
  }, [logs, action, query, actorEmail, resourceId, dateFrom, dateTo]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, maxPage);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function clearFilters() {
    setAction("ALL");
    setQuery("");
    setActorEmail("");
    setResourceId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              <Filter className="h-3.5 w-3.5" />
              Audit filters
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-950">
              Security event explorer
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Filter audit records by action, actor, resource, date range, reason, or metadata.
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Action
            </span>
            <select
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
              className="input"
            >
              {actions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block xl:col-span-2">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search reason, metadata, actor..."
                className="input pl-11"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Actor email
            </span>
            <input
              value={actorEmail}
              onChange={(event) => {
                setActorEmail(event.target.value);
                setPage(1);
              }}
              placeholder="user@email.com"
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              From
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              To
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className="input"
            />
          </label>

          <label className="block md:col-span-2 xl:col-span-6">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Resource ID / metadata reference
            </span>
            <input
              value={resourceId}
              onChange={(event) => {
                setResourceId(event.target.value);
                setPage(1);
              }}
              placeholder="Search by resource id or metadata value..."
              className="input"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-soft">
        <p>
          Showing <b className="text-slate-950">{visible.length}</b> of{" "}
          <b className="text-slate-950">{filtered.length}</b> audit logs
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <span className="text-xs font-bold text-slate-500">
            Page {currentPage} / {maxPage}
          </span>

          <button
            disabled={currentPage >= maxPage}
            onClick={() => setPage((value) => Math.min(maxPage, value + 1))}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
        <table className="w-full min-w-[1250px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-4">Time</th>
              <th className="px-5 py-4">Action</th>
              <th className="px-5 py-4">Actor</th>
              <th className="px-5 py-4">Reason</th>
              <th className="px-5 py-4">Resource</th>
              <th className="px-5 py-4">Metadata</th>
            </tr>
          </thead>

          <tbody>
            {visible.map((log) => (
              <tr
                key={log.id}
                className="border-t border-slate-100 align-top hover:bg-slate-50/70"
              >
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  <div className="inline-flex items-center gap-2 font-bold">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {formatDateTime(log.created_at)}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${actionClass(log.action)}`}
                  >
                    {log.action}
                  </span>
                </td>

                <td className="px-5 py-4 text-slate-600">
                  <div className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <div className="max-w-[240px] truncate font-bold">
                        {log.actor_email || "-"}
                      </div>
                      {log.actor_id ? (
                        <code className="mt-1 block max-w-[240px] truncate text-[10px] text-slate-400">
                          {log.actor_id}
                        </code>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="max-w-[300px] px-5 py-4 leading-6 text-slate-600">
                  {log.reason || "-"}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <code className="max-w-[230px] truncate text-xs text-slate-500">
                      {log.resource_id || "-"}
                    </code>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <Braces className="mt-3 h-4 w-4 shrink-0 text-slate-400" />
                    <pre className="max-h-36 max-w-[430px] overflow-auto rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 ring-1 ring-slate-100">
                      {safeMetadata(log.metadata)}
                    </pre>
                  </div>
                </td>
              </tr>
            ))}

            {!visible.length ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" />
                  <h3 className="mt-3 text-lg font-black text-slate-950">
                    No audit logs found
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try changing filters or clearing the search fields.
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