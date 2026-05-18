"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, ShieldCheck } from "lucide-react";
import { validateResourceFileBasics } from "@/lib/security/upload-policy";

type UploadState = {
  status: "idle" | "validating" | "success" | "error";
  message: string;
};

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ status: "idle", message: "" });

  const filePreview = useMemo(() => {
    if (!file) return null;
    const result = validateResourceFileBasics(file);
    return { file, result };
  }, [file]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentFile = formData.get("file");

    if (!(currentFile instanceof File) || currentFile.size === 0) {
      setState({ status: "error", message: "Please select a file before uploading." });
      return;
    }

    const frontendValidation = validateResourceFileBasics(currentFile);
    if (!frontendValidation.allowed) {
      setState({ status: "error", message: frontendValidation.reason || "File rejected." });
      return;
    }

    setState({ status: "validating", message: "Running server validation and moderation checks..." });

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { ok: boolean; message?: string; error?: string };

      if (!response.ok || !data.ok) {
        setState({ status: "error", message: data.error || "Upload rejected." });
        return;
      }

      form.reset();
      setFile(null);
      setState({
        status: "success",
        message: data.message || "Resource uploaded and approved successfully.",
      });
    } catch (error) {
      setState({ status: "error", message: "Network/server error. Please try again." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div>
        <h2 className="text-xl font-black text-slate-950">Resource Details</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Strict free safety mode: only PDF, DOCX, PPTX, and TXT are allowed. Images, videos, ZIPs, and scripts are blocked automatically.
        </p>
      </div>

      <label className="grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-blue-500 hover:bg-blue-50">
        <FileUp className="mb-3 h-10 w-10 text-blue-600" />
        <span className="text-lg font-black text-slate-950">Click to choose academic file</span>
        <span className="mt-2 text-sm text-slate-500">PDF, DOCX, PPTX, TXT only</span>
        <input
          type="file"
          name="file"
          className="hidden"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] || null;
            setFile(selectedFile);
            if (selectedFile) {
              const result = validateResourceFileBasics(selectedFile);
              setState({
                status: result.allowed ? "success" : "error",
                message: result.allowed ? "Frontend validation passed. Submit to run server checks." : result.reason || "File rejected.",
              });
            }
          }}
        />
      </label>

      {filePreview && (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <strong>Selected:</strong> {filePreview.file.name} ({(filePreview.file.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}

      {state.message && (
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-semibold leading-6 ${
            state.status === "success"
              ? "bg-green-50 text-green-700"
              : state.status === "error"
                ? "bg-red-50 text-red-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {state.status === "validating" ? (
            <Loader2 className="mt-0.5 h-5 w-5 animate-spin" />
          ) : state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5" />
          )}
          <span>{state.message}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">Title</label>
          <input
            required
            name="title"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4"
            placeholder="Example: DBMS Unit 2 Notes"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">Description</label>
          <textarea
            required
            name="description"
            rows={4}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4"
            placeholder="Describe this resource..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">Branch</label>
          <select name="branch" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4">
            <option>CSE</option>
            <option>IT</option>
            <option>ECE</option>
            <option>ME</option>
            <option>CE</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">Semester</label>
          <select name="semester" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4">
            <option>1st</option>
            <option>2nd</option>
            <option>3rd</option>
            <option>4th</option>
            <option>5th</option>
            <option>6th</option>
            <option>7th</option>
            <option>8th</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">Subject</label>
          <input
            required
            name="subject"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4"
            placeholder="Database Management Systems"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">Resource Type</label>
          <select name="resourceType" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4">
            <option>Notes</option>
            <option>PYQ</option>
            <option>Lab File</option>
            <option>Assignment</option>
            <option>Syllabus</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">Tags</label>
          <input
            name="tags"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4"
            placeholder="DBMS, SQL, Normalization"
          />
        </div>

        <input type="hidden" name="turnstileToken" value="" />
      </div>

      <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
        <div className="mb-1 flex items-center gap-2 font-black">
          <ShieldCheck className="h-5 w-5" /> Automatic Safety Rules
        </div>
        Direct images/videos/ZIPs are rejected. Suspicious file names, titles, and descriptions are rejected. Server-side validation always runs again after frontend checks.
      </div>

      <button
        type="submit"
        disabled={state.status === "validating"}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state.status === "validating" ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}
        Upload Resource
      </button>
    </form>
  );
}
