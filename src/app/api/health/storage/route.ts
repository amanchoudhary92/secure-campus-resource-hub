import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/db/supabase-admin";

export async function GET() {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({
        ok: true,
        mode: "demo-memory",
        message: "Supabase env is missing, so storage is running in demo mode.",
      });
    }

    const supabase = getSupabaseAdmin();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "resource-files";

    if (!supabase) {
      return NextResponse.json({ ok: false, mode: "supabase-storage", message: "Supabase client not available." }, { status: 500 });
    }

    const { error } = await supabase.storage.from(bucket).list("resources", { limit: 1 });

    if (error) {
      return NextResponse.json(
        { ok: false, mode: "supabase-storage", bucket, message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "supabase-storage",
      bucket,
      message: "Supabase Storage bucket connected successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage health check failed.";
    return NextResponse.json({ ok: false, mode: "supabase-storage", message }, { status: 500 });
  }
}
