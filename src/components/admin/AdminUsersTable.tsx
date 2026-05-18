"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AdminProfileRow } from "@/lib/db/supabase-admin";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return "-";
  }
}

function roleClass(role: string) {
  return role === "ADMIN" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700";
}

export function AdminUsersTable({ profiles, currentAdminId }: { profiles: AdminProfileRow[]; currentAdminId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED" | "ADMIN" | "STUDENT">("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      const matchesQuery = !q || [profile.full_name, profile.email, profile.username, profile.branch, profile.semester, profile.enrollment_no]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "ACTIVE" && !profile.is_blocked) ||
        (filter === "BLOCKED" && profile.is_blocked) ||
        profile.role === filter;

      return matchesQuery && matchesFilter;
    });
  }, [profiles, query, filter]);

  async function blockUser(profile: AdminProfileRow) {
    if (profile.id === currentAdminId) {
      setMessage("You cannot block your own admin account.");
      return;
    }

    const reason = window.prompt(`Block ${profile.full_name}? Reason:`, "Repeated unsafe/spam activity.");
    if (!reason) return;

    setLoadingId(profile.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/block`, {
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

  async function unblockUser(profile: AdminProfileRow) {
    const confirmed = window.confirm(`Unblock ${profile.full_name}? Their upload/request access will be restored and warnings will be reset.`);
    if (!confirmed) return;

    setLoadingId(profile.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manual unblock by admin.", resetWarnings: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "User unblock failed.");
      setMessage(data.message || "User unblocked.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User unblock failed.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">User Management</h2>
          <p className="mt-1 text-sm text-slate-500">Block/unblock student access for uploads and requests. Admin accounts cannot be blocked.</p>
        </div>
        {message ? <p className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">{message}</p> : null}
      </div>

      <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users by name, email, branch, semester..."
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4"
        >
          <option value="ALL">All users</option>
          <option value="ACTIVE">Active users</option>
          <option value="BLOCKED">Blocked users</option>
          <option value="STUDENT">Students</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Branch/Semester</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Warnings</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((profile) => (
              <tr key={profile.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-5 py-4">
                  <p className="font-black text-slate-950">{profile.full_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{profile.email}</p>
                  {profile.username ? <p className="mt-1 text-xs text-slate-400">@{profile.username}</p> : null}
                </td>
                <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${roleClass(profile.role)}`}>{profile.role}</span></td>
                <td className="px-5 py-4 text-slate-600">{profile.branch || "-"} / {profile.semester || "-"}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${profile.is_blocked ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    {profile.is_blocked ? "BLOCKED" : "ACTIVE"}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600">{profile.warning_count || 0}</td>
                <td className="px-5 py-4 text-slate-600">{formatDate(profile.created_at)}</td>
                <td className="px-5 py-4">
                  {profile.role === "ADMIN" ? (
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">Protected admin</span>
                  ) : profile.is_blocked ? (
                    <button
                      disabled={loadingId === profile.id}
                      onClick={() => unblockUser(profile)}
                      className="rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      disabled={loadingId === profile.id}
                      onClick={() => blockUser(profile)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                    >
                      Block
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!filteredProfiles.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">No users found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
