"use client";

import { useMemo, useState } from "react";
import type { DuplicateFileGroup } from "@/lib/db/supabase-admin";

const statuses = ["ALL", "PENDING_REVIEW", "APPROVED", "REJECTED", "BLOCKED"];

export function DuplicatesClient({ groups }: { groups: DuplicateFileGroup[] }) {
  const [status, setStatus] = useState("ALL");
  const [email, setEmail] = useState("");
  const [dateFrom, setDateFrom] = useState("");

  const filtered = useMemo(() => {
    const emailQuery = email.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : 0;

    return groups
      .map((group) => ({
        ...group,
        resources: group.resources.filter((resource) => {
          const matchesStatus = status === "ALL" || resource.status === status;
          const matchesEmail = !emailQuery || String(resource.uploaded_by_email || "").toLowerCase().includes(emailQuery);
          const matchesDate = !fromTs || new Date(resource.created_at).getTime() >= fromTs;
          return matchesStatus && matchesEmail && matchesDate;
        }),
      }))
      .filter((group) => group.resources.length > 1);
  }, [groups, status, email, dateFrom]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
        <p className="font-black text-blue-950">Duplicate dashboard is analysis-only by design.</p>
        <p className="mt-1">Deleting one resource never deletes other resources with the same hash. Use the main Admin moderation page to delete a specific resource after reviewing its status and uploader.</p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-3">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none">
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Filter uploader email..." className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
      </div>

      {filtered.length ? filtered.map((group) => (
        <div key={group.file_hash} className="rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-100 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Duplicate hash</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">{group.file_hash}</code>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{group.resources.length} uploads</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-sm">
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
                  <tr key={resource.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-black text-slate-950">{resource.title}</td>
                    <td className="px-5 py-4 text-slate-600"><div>{resource.uploaded_by_name}</div><div className="text-xs text-slate-400">{resource.uploaded_by_email || "-"}</div></td>
                    <td className="px-5 py-4 text-slate-600">{new Date(resource.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{resource.status}</span></td>
                    <td className="px-5 py-4 text-slate-600">{resource.file_name}</td>
                    <td className="px-5 py-4"><code className="text-xs text-slate-500">{resource.id}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
          <h3 className="text-xl font-black text-slate-950">No duplicate hashes found</h3>
          <p className="mt-2 text-sm text-slate-500">The active duplicate blocker is keeping repeated uploads out of the system.</p>
        </div>
      )}
    </div>
  );
}
