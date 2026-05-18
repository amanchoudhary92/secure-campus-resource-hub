import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase is not configured." }, { status: 500 });

    const body = await request.json();
    const accessToken = String(body.accessToken || "");
    const refreshToken = String(body.refreshToken || "");
    const password = String(body.password || "");

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ ok: false, error: "Reset token missing. Open the reset link from your email again." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionError) return NextResponse.json({ ok: false, error: sessionError.message }, { status: 400 });

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, message: "Password updated. Please login." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
