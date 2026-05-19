"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function DownloadButton({ resourceId }: { resourceId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/resources/${resourceId}/download`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.signedUrl) {
        throw new Error(data.error || "Download failed.");
      }

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={download}
        aria-busy={loading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {loading ? "Preparing..." : "Download"}
      </button>

      {message ? (
        <span className="max-w-[220px] text-right text-[11px] font-bold leading-4 text-red-600">
          {message}
        </span>
      ) : null}
    </div>
  );
}