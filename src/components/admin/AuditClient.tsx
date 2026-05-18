"use client";

import { useMemo, useState } from "react";
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

export function AuditClient({ logs }: { logs: AuditLogRow[] }) {
  const [action, setAction] = useState("ALL");
  const [query, setQuery] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

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
      const matchesActor = !actor || String(log.actor_email || "").toLowerCase().includes(actor);
      const matchesResource = !resource || String(log.resource_id || "").toLowerCase().includes(resource) || metadataText.includes(resource);
      const matchesDate = created >= fromTs && created <= toTs;
      const matchesQuery = !q || [log.action, log.reason || "", log.actor_email || "", metadataText].join(" ").toLowerCase().includes(q);
      return matchesAction && matchesActor && matchesResource && matchesDate && matchesQuery;
    });
  }, [logs, action, query, actorEmail, resourceId, dateFrom, dateTo]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, maxPage);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-3 xl:grid-cols-6">
        <select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none">
          {actions.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search reason/metadata..." className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <input value={actorEmail} onChange={(event) => { setActorEmail(event.target.value); setPage(1); }} placeholder="Actor email..." className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <input value={resourceId} onChange={(event) => { setResourceId(event.target.value); setPage(1); }} placeholder="Resource id..." className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <p>Showing <b className="text-slate-900">{visible.length}</b> of <b className="text-slate-900">{filtered.length}</b> audit logs</p>
        <div className="flex items-center gap-2">
          <button disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">Prev</button>
          <span className="text-xs font-bold">Page {currentPage} / {maxPage}</span>
          <button disabled={currentPage >= maxPage} onClick={() => setPage((value) => Math.min(maxPage, value + 1))} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">Next</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-soft">
        <table className="min-w-[1200px] w-full text-left text-sm">
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
              <tr key={log.id} className="border-t border-slate-100 align-top">
                <td className="px-5 py-4 whitespace-nowrap text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{log.action}</span></td>
                <td className="px-5 py-4 text-slate-600"><div>{log.actor_email || "-"}</div><code className="text-[10px] text-slate-400">{log.actor_id || ""}</code></td>
                <td className="px-5 py-4 max-w-[280px] text-slate-600">{log.reason || "-"}</td>
                <td className="px-5 py-4"><code className="text-xs text-slate-500">{log.resource_id || "-"}</code></td>
                <td className="px-5 py-4"><pre className="max-h-36 max-w-[420px] overflow-auto rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{safeMetadata(log.metadata)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
