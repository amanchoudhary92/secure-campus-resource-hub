"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  Loader2,
  Lock,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UploadCloud,
  UserRound,
} from "lucide-react";
import type { ProfileRow } from "@/lib/auth/session";
import type { ResourceRequestRow } from "@/lib/db/supabase-admin";

const branches = ["CSE", "IT", "ECE", "ME", "CE"];
const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const resourceTypes = ["Notes", "PYQ", "Lab File", "Assignment", "Syllabus"];

function statusClass(status: string) {
  if (status === "OPEN") return "bg-green-50 text-green-700 ring-green-100";
  if (status === "FULFILLED") return "bg-blue-50 text-blue-700 ring-blue-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getExpiryDate(request: ResourceRequestRow) {
  return request.expires_at
    ? new Date(request.expires_at)
    : new Date(new Date(request.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
}

function daysLeft(request: ResourceRequestRow) {
  const diff = getExpiryDate(request).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function searchableText(request: ResourceRequestRow) {
  return [
    request.title,
    request.description,
    request.subject,
    request.branch,
    request.semester,
    request.resource_type,
    request.requested_by_name,
  ]
    .join(" ")
    .toLowerCase();
}

function SelectFilter({
  value,
  onChange,
  options,
  allLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="input"
    >
      <option>{allLabel}</option>
      {options.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  );
}

export function RequestsClient({
  initialRequests,
  profile,
}: {
  initialRequests: ResourceRequestRow[];
  profile: ProfileRow | null;
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("All Branches");
  const [semester, setSemester] = useState("All Semesters");
  const [type, setType] = useState("All Types");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesQuery = !q || searchableText(request).includes(q);
      const matchesBranch = branch === "All Branches" || request.branch === branch;
      const matchesSemester = semester === "All Semesters" || request.semester === semester;
      const matchesType = type === "All Types" || request.resource_type === type;

      return matchesQuery && matchesBranch && matchesSemester && matchesType;
    });
  }, [requests, query, branch, semester, type]);

  const activeFilterCount = [
    query,
    branch !== "All Branches" ? branch : "",
    semester !== "All Semesters" ? semester : "",
    type !== "All Types" ? type : "",
  ].filter(Boolean).length;

  function clearFilters() {
    setQuery("");
    setBranch("All Branches");
    setSemester("All Semesters");
    setType("All Types");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      setMessage({ tone: "error", text: "Please login before submitting a request." });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      title: String(formData.get("title") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      branch: String(formData.get("branch") || "CSE"),
      semester: String(formData.get("semester") || "5th"),
      resourceType: String(formData.get("resourceType") || "Notes"),
      description: String(formData.get("description") || "").trim(),
    };

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Request submission failed.");
      }

      setRequests((current) => [data.request, ...current]);
      setMessage({ tone: "success", text: data.message || "Request posted successfully." });
      form.reset();
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Request submission failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteRequest(request: ResourceRequestRow) {
    const confirmed = window.confirm(`Delete request "${request.title}"?`);
    if (!confirmed) return;

    setDeletingId(request.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      setRequests((current) => current.filter((item) => item.id !== request.id));
      setMessage({ tone: "success", text: data.message || "Request deleted." });
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Delete failed.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (!profile) {
    return (
      <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-8 shadow-soft">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-amber-950">Login required</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900">
          Resource requests are visible only to logged-in students and admins.
          Please login to view existing requests or post a new request.
        </p>
        <a
          href="/login"
          className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
        >
          Login to Continue
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft md:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Post a Resource Request
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Ask classmates or seniors for missing notes, PYQs, lab files,
                assignments, or syllabus documents. Requests auto-expire after 7 days.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            {message ? (
              <div
                className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-bold leading-6 ${
                  message.tone === "success"
                    ? "bg-green-50 text-green-700 ring-1 ring-green-100"
                    : "bg-red-50 text-red-700 ring-1 ring-red-100"
                }`}
              >
                {message.tone === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                Request title
              </label>
              <input
                name="title"
                required
                className="input"
                placeholder="Example: Operating Systems PYQs 2020-2024"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Subject
                </label>
                <input
                  name="subject"
                  required
                  className="input"
                  placeholder="Operating Systems"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Resource Type
                </label>
                <select name="resourceType" className="input">
                  {resourceTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Branch
                </label>
                <select name="branch" className="input">
                  {branches.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Semester
                </label>
                <select name="semester" className="input">
                  {semesters.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                What do you need?
              </label>
              <textarea
                name="description"
                required
                rows={5}
                className="input resize-none"
                placeholder="Example: I need OS unit-wise notes and PYQs from 2020-2024 with solutions."
              />
            </div>

            <button
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft md:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              <FileQuestion className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">
                How requests work
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                A lightweight workflow for missing academic material.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
            {[
              "A logged-in student posts a request for missing notes, PYQs, or lab files.",
              "Other students can upload the matching resource from the Upload page.",
              "Uploaded files still go through validation and admin review before public visibility.",
              "Requests automatically expire after 7 days to keep the board clean.",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4">
                <b className="mr-2 text-blue-700">{index + 1}.</b>
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800 ring-1 ring-blue-100">
            Posting and viewing requests both require login. Request records stay tied to student accounts for accountability.
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
              <ClipboardList className="h-3.5 w-3.5" />
              Open board
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-950">
              Open Resource Requests
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Logged-in students can view requests and upload matching academic
              resources. Old requests are removed automatically after 7 days.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input pl-11"
              placeholder="Search requests..."
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <SelectFilter
            value={branch}
            onChange={setBranch}
            options={branches}
            allLabel="All Branches"
          />
          <SelectFilter
            value={semester}
            onChange={setSemester}
            options={semesters}
            allLabel="All Semesters"
          />
          <SelectFilter
            value={type}
            onChange={setType}
            options={resourceTypes}
            allLabel="All Types"
          />
          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            Clear filters
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <p>
            Showing <b className="text-slate-950">{filteredRequests.length}</b> of{" "}
            <b className="text-slate-950">{requests.length}</b> requests
          </p>
          <p className="text-xs font-black text-slate-600">
            {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          {filteredRequests.map((request) => {
            const canDelete =
              profile.role === "ADMIN" || profile.id === request.requested_by_id;
            const remainingDays = daysLeft(request);

            return (
              <article
                key={request.id}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-soft"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                        {request.resource_type}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                        {request.branch} • {request.semester}
                      </span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                        Expires in {remainingDays} day{remainingDays === 1 ? "" : "s"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-slate-950">
                      {request.title}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {request.subject}
                    </p>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                      {request.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="h-3.5 w-3.5" />
                        Requested by {request.requested_by_name}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Posted: {formatDate(request.created_at)}
                      </span>
                      <span>
                        Expires: {formatDate(getExpiryDate(request).toISOString())}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <a
                      href="/upload"
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      Upload
                    </a>

                    {canDelete ? (
                      <button
                        disabled={deletingId === request.id}
                        onClick={() => deleteRequest(request)}
                        className="inline-flex items-center gap-1 rounded-2xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletingId === request.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          {!filteredRequests.length ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950">
                No requests found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search/filter or submit the first request.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}