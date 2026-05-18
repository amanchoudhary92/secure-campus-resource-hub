"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function DownloadButton({ resourceId }: { resourceId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/resources/${resourceId}/download`);
      const data = await response.json();
      if (!response.ok || !data.signedUrl) throw new Error(data.error || "Download failed.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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
        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
      >
        <Download className="h-4 w-4" /> {loading ? "Preparing..." : "Download"}
      </button>
      {message ? <span className="max-w-[220px] text-right text-[11px] font-bold text-red-600">{message}</span> : null}
    </div>
  );
}
