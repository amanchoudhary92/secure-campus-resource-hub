"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
} from "lucide-react";
import type { AdminProfileRow } from "@/lib/db/supabase-admin";

type UserFilter = "ALL" | "ACTIVE" | "BLOCKED" | "ADMIN" | "STUDENT";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function roleClass(role: string) {
  return role === "ADMIN"
    ? "bg-purple-50 text-purple-700 ring-purple-100"
    : "bg-blue-50 text-blue-700 ring-blue-100";
}

function statusClass(isBlocked: boolean) {
  return isBlocked
    ? "bg-red-50 text-red-700 ring-red-100"
    : "bg-green-50 text-green-700 ring-green-100";
}

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

export function AdminUsersTable({
  profiles,
  currentAdminId,
}: {
  profiles: AdminProfileRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<UserFilter>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const filteredProfiles = useMemo(() => {
    const q = normalize(query);

    return profiles.filter((profile) => {
      const searchableText = normalize([
        profile.full_name,
        profile.email,
        profile.username,
        profile.branch,
        profile.semester,
        profile.enrollment_no,
        profile.role,
        profile.is_blocked ? "blocked" : "active",
      ].join(" "));

      const matchesQuery = !q || searchableText.includes(q);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "ACTIVE" && !profile.is_blocked) ||
        (filter === "BLOCKED" && profile.is_blocked) ||
        profile.role === filter;

      return matchesQuery && matchesFilter;
    });
  }, [profiles, query, filter]);

  const activeFilterCount = [
    query,
    filter !== "ALL" ? filter : "",
  ].filter(Boolean).length;

  function clearFilters() {
    setQuery("");
    setFilter("ALL");
  }

  async function blockUser(profile: AdminProfileRow) {
    if (profile.id === currentAdminId) {
      setMessage({
        tone: "error",
        text: "You cannot block your own admin account.",
      });
      return;
    }

    if (profile.role === "ADMIN") {
      setMessage({
        tone: "error",
        text: "Admin accounts are protected and cannot be blocked from this screen.",
      });
      return;
    }

    const reason = window.prompt(
      `Block ${profile.full_name}? Reason:`,
      "Repeated unsafe/spam activity."
    );

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

      if (!res.ok) {
        throw new Error(data.error || "User block failed.");
      }

      setMessage({
        tone: "success",
        text: data.message || "User blocked.",
      });

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

  async function unblockUser(profile: AdminProfileRow) {
    const confirmed = window.confirm(
      `Unblock ${profile.full_name}? Their upload/request access will be restored and warnings will be reset.`
    );

    if (!confirmed) return;

    setLoadingId(profile.id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${profile.id}/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Manual unblock by admin.",
          resetWarnings: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "User unblock failed.");
      }

      setMessage({
        tone: "success",
        text: data.message || "User unblocked.",
      });

      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "User unblock failed.",
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
              User Access Control
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Search users, review roles, and block or unblock student access for uploads and requests.
              Admin accounts remain protected.
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
              placeholder="Search name, email, username, branch, semester..."
              className="input pl-11"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as UserFilter)}
            className="input"
          >
            <option value="ALL">All users</option>
            <option value="ACTIVE">Active users</option>
            <option value="BLOCKED">Blocked users</option>
            <option value="STUDENT">Students</option>
            <option value="ADMIN">Admins</option>
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
            Showing <b className="text-slate-950">{filteredProfiles.length}</b>{" "}
            of <b className="text-slate-950">{profiles.length}</b> users
          </p>
          <p className="text-xs font-black text-slate-600">
            {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Branch / Semester</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Warnings</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProfiles.map((profile) => {
              const isCurrentAdmin = profile.id === currentAdminId;
              const isLoading = loadingId === profile.id;

              return (
                <tr
                  key={profile.id}
                  className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="font-black text-slate-950">
                          {profile.full_name}
                          {isCurrentAdmin ? (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                              YOU
                            </span>
                          ) : null}
                        </p>

                        <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">
                          {profile.email}
                        </p>

                        {profile.username ? (
                          <p className="mt-1 text-xs font-bold text-slate-400">
                            @{profile.username}
                          </p>
                        ) : null}

                        {profile.enrollment_no ? (
                          <p className="mt-1 text-[11px] text-slate-400">
                            Enrollment: {profile.enrollment_no}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${roleClass(profile.role)}`}
                    >
                      {profile.role}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    <p className="font-bold">{profile.branch || "-"}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {profile.semester || "-"} Semester
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(
                        profile.is_blocked
                      )}`}
                    >
                      {profile.is_blocked ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      {profile.is_blocked ? "BLOCKED" : "ACTIVE"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                      {profile.warning_count || 0}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(profile.created_at)}
                  </td>

                  <td className="px-5 py-4">
                    {profile.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Protected admin
                      </span>
                    ) : profile.is_blocked ? (
                      <button
                        disabled={isLoading}
                        onClick={() => unblockUser(profile)}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        Unblock
                      </button>
                    ) : (
                      <button
                        disabled={isLoading}
                        onClick={() => blockUser(profile)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserX className="h-3.5 w-3.5" />
                        )}
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {!filteredProfiles.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <UserRound className="mx-auto h-8 w-8 text-slate-400" />
                  <h3 className="mt-3 text-lg font-black text-slate-950">
                    No users found
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try changing the search query or clearing filters.
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