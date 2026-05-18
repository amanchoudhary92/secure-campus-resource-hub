import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase is not configured." }, { status: 500 });

    const { email } = await request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail) return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, message: "Password reset link sent. Check your email." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send reset email.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
