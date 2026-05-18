"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Lock, Search, Trash2, UserRound } from "lucide-react";
import type { ProfileRow } from "@/lib/auth/session";
import type { ResourceRequestRow } from "@/lib/db/supabase-admin";

const branches = ["CSE", "IT", "ECE", "ME", "CE"];
const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const resourceTypes = ["Notes", "PYQ", "Lab File", "Assignment", "Syllabus"];

function statusClass(status: string) {
  if (status === "OPEN") return "bg-green-50 text-green-700";
  if (status === "FULFILLED") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function getExpiryDate(request: ResourceRequestRow) {
  return request.expires_at ? new Date(request.expires_at) : new Date(new Date(request.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
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
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Request submission failed." });
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
      const response = await fetch(`/api/requests/${request.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      setRequests((current) => current.filter((item) => item.id !== request.id));
      setMessage({ tone: "success", text: data.message || "Request deleted." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Delete failed." });
    } finally {
      setDeletingId(null);
    }
  }


  if (!profile) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-soft">
        <Lock className="h-8 w-8 text-amber-700" />
        <h2 className="mt-4 text-2xl font-black text-amber-950">Login required</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900">
          Resource requests are visible only to logged-in students and admins. Please login to view existing requests or post a new request.
        </p>
        <a href="/login" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700">
          Login to Continue
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Post a Resource Request</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Ask seniors/classmates for missing notes, PYQs, lab files, or assignments. Your request will be visible only to logged-in users and will auto-expire after 7 days.
              </p>
            </div>
          </div>

          {!profile ? (
            <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <Lock className="mb-2 h-6 w-6" />
              <p className="font-black">Login required</p>
              <p className="mt-1 text-sm leading-6">You must login before viewing or submitting resource requests.</p>
              <a href="/login" className="mt-4 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
                Login to Request
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
              {message ? (
                <div className={`rounded-2xl p-4 text-sm font-bold ${message.tone === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {message.text}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">Request title</label>
                <input name="title" required className="input" placeholder="Example: Operating Systems PYQs 2020-2024" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Subject</label>
                  <input name="subject" required className="input" placeholder="Operating Systems" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Resource Type</label>
                  <select name="resourceType" className="input">
                    {resourceTypes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Branch</label>
                  <select name="branch" className="input">
                    {branches.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Semester</label>
                  <select name="semester" className="input">
                    {semesters.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">What do you need?</label>
                <textarea name="description" required rows={5} className="input" placeholder="Example: I need OS unit-wise notes and PYQs from 2020-2024 with solutions." />
              </div>

              <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-70">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-slate-950">How requests work</h2>
          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
            <p><b>1.</b> A logged-in student posts a request for missing notes, PYQs, or lab files.</p>
            <p><b>2.</b> Other students can see the request and upload the required resource from the Upload page.</p>
            <p><b>3.</b> Uploaded files still go to admin review before they become public.</p>
            <p><b>4.</b> Requests automatically disappear after 7 days to keep the board clean.</p>
          </div>
          <div className="mt-5 rounded-3xl bg-blue-50 p-5 text-sm font-bold leading-6 text-blue-800">
            Posting and viewing requests both require login. Requests are automatically removed after 7 days.
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Open Resource Requests</h2>
            <p className="mt-1 text-sm text-slate-500">Logged-in students can view these requests and upload matching academic resources. Old requests are removed automatically after 7 days.</p>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-11" placeholder="Search requests..." />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <select value={branch} onChange={(event) => setBranch(event.target.value)} className="input">
            <option>All Branches</option>
            {branches.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={semester} onChange={(event) => setSemester(event.target.value)} className="input">
            <option>All Semesters</option>
            {semesters.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value)} className="input">
            <option>All Types</option>
            {resourceTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button onClick={() => { setQuery(""); setBranch("All Branches"); setSemester("All Semesters"); setType("All Types"); }} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">
            Clear filters
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing <b className="text-slate-900">{filteredRequests.length}</b> of <b className="text-slate-900">{requests.length}</b> requests
        </p>

        <div className="mt-5 grid gap-4">
          {filteredRequests.map((request) => {
            const canDelete = profile?.role === "ADMIN" || profile?.id === request.requested_by_id;
            return (
              <article key={request.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(request.status)}`}>{request.status}</span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{request.resource_type}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{request.branch} • {request.semester}</span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Expires in {daysLeft(request)} day{daysLeft(request) === 1 ? "" : "s"}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-slate-950">{request.title}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-600">{request.subject}</p>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{request.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> Requested by {request.requested_by_name}</span>
                      <span>Posted: {formatDate(request.created_at)}</span>
                      <span>Expires: {formatDate(getExpiryDate(request).toISOString())}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a href="/upload" className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700">Upload Resource</a>
                    {canDelete ? (
                      <button disabled={deletingId === request.id} onClick={() => deleteRequest(request)} className="inline-flex items-center gap-1 rounded-2xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          {!filteredRequests.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-lg font-black text-slate-950">No requests found</h3>
              <p className="mt-2 text-sm text-slate-500">Try a different search/filter or submit the first request.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
