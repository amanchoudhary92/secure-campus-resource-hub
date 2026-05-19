"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileUp,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { validateResourceFileBasics } from "@/lib/security/upload-policy";

type UploadState = {
  status: "idle" | "validating" | "success" | "error";
  message: string;
};

function formatFileSize(size: number) {
  if (!size) return "0 MB";
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({
    status: "idle",
    message: "",
  });

  const filePreview = useMemo(() => {
    if (!file) return null;
    const result = validateResourceFileBasics(file);
    return { file, result };
  }, [file]);

  const canSubmit = state.status !== "validating" && (!filePreview || filePreview.result.allowed);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentFile = formData.get("file");

    if (!(currentFile instanceof File) || currentFile.size === 0) {
      setState({
        status: "error",
        message: "Please select a file before uploading.",
      });
      return;
    }

    const frontendValidation = validateResourceFileBasics(currentFile);

    if (!frontendValidation.allowed) {
      setState({
        status: "error",
        message: frontendValidation.reason || "File rejected.",
      });
      return;
    }

    setState({
      status: "validating",
      message: "Running server-side validation, duplicate detection, and moderation checks...",
    });

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setState({
          status: "error",
          message: data.error || "Upload rejected.",
        });
        return;
      }

      form.reset();
      setFile(null);

      setState({
        status: "success",
        message:
          data.message ||
          "Resource uploaded successfully and sent for admin review.",
      });
    } catch {
      setState({
        status: "error",
        message: "Network/server error. Please try again.",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
            <UploadCloud className="h-3.5 w-3.5" />
            Academic upload
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-950">
            Resource Details
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Upload academic documents only. Files are validated on the frontend first, then checked again on the server before being sent for admin approval.
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 px-4 py-3 text-xs font-black text-green-700 ring-1 ring-green-100">
          Status after upload: PENDING_REVIEW
        </div>
      </div>

      <label className="group grid cursor-pointer place-items-center rounded-[1.5rem] border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-blue-500 hover:bg-blue-50">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100 transition group-hover:scale-105">
          <FileUp className="h-8 w-8" />
        </div>

        <span className="mt-4 text-lg font-black text-slate-950">
          Click to choose academic file
        </span>
        <span className="mt-2 text-sm font-medium text-slate-500">
          PDF, DOCX, PPTX, TXT only
        </span>

        <input
          type="file"
          name="file"
          className="hidden"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] || null;
            setFile(selectedFile);

            if (!selectedFile) {
              setState({ status: "idle", message: "" });
              return;
            }

            const result = validateResourceFileBasics(selectedFile);

            setState({
              status: result.allowed ? "success" : "error",
              message: result.allowed
                ? "Frontend validation passed. Submit to run server-side checks."
                : result.reason || "File rejected.",
            });
          }}
        />
      </label>

      {filePreview && (
        <div
          className={`rounded-2xl p-4 text-sm ${
            filePreview.result.allowed
              ? "bg-green-50 text-green-800 ring-1 ring-green-100"
              : "bg-red-50 text-red-800 ring-1 ring-red-100"
          }`}
        >
          <div className="flex items-start gap-3">
            {filePreview.result.allowed ? (
              <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <div>
              <p className="font-black">
                {filePreview.file.name}
              </p>
              <p className="mt-1 text-xs font-bold opacity-80">
                {formatFileSize(filePreview.file.size)}
              </p>
              {!filePreview.result.allowed && (
                <p className="mt-2 font-bold">
                  {filePreview.result.reason || "This file is not allowed."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {state.message && (
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-semibold leading-6 ${
            state.status === "success"
              ? "bg-green-50 text-green-700 ring-1 ring-green-100"
              : state.status === "error"
                ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                : "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
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
          <label className="mb-2 block text-sm font-black text-slate-700">
            Title
          </label>
          <input
            required
            name="title"
            className="input"
            placeholder="Example: DBMS Unit 2 Notes"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">
            Description
          </label>
          <textarea
            required
            name="description"
            rows={4}
            className="input resize-none"
            placeholder="Describe what this resource contains and who it is useful for..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">
            Branch
          </label>
          <select name="branch" className="input">
            <option>CSE</option>
            <option>IT</option>
            <option>ECE</option>
            <option>ME</option>
            <option>CE</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">
            Semester
          </label>
          <select name="semester" className="input">
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
          <label className="mb-2 block text-sm font-black text-slate-700">
            Subject
          </label>
          <input
            required
            name="subject"
            className="input"
            placeholder="Database Management Systems"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">
            Resource Type
          </label>
          <select name="resourceType" className="input">
            <option>Notes</option>
            <option>PYQ</option>
            <option>Lab File</option>
            <option>Assignment</option>
            <option>Syllabus</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-black text-slate-700">
            Tags
          </label>
          <input
            name="tags"
            className="input"
            placeholder="DBMS, SQL, Normalization"
          />
          <p className="mt-2 text-xs font-bold text-slate-500">
            Separate tags with commas. The system may also add keywords from the existing document summary flow.
          </p>
        </div>

        <input type="hidden" name="turnstileToken" value="" />
      </div>

      <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-800 ring-1 ring-blue-100">
        <div className="mb-1 flex items-center gap-2 font-black">
          <ShieldCheck className="h-5 w-5" />
          Automatic Safety Rules
        </div>
        Direct images/videos/ZIPs are rejected. Suspicious file names, titles, and descriptions are rejected. Server-side validation always runs again after frontend checks.
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state.status === "validating" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FileUp className="h-5 w-5" />
        )}
        {state.status === "validating" ? "Validating..." : "Upload Resource"}
      </button>
    </form>
  );
}