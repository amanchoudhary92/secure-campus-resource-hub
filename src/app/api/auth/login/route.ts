import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase-admin";
import { ensureProfile, setAuthCookies } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase is not configured." }, { status: 500 });

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session?.access_token || !data.user?.email) {
      return NextResponse.json({ ok: false, error: error?.message || "Invalid email or password." }, { status: 401 });
    }

    const profile = await ensureProfile({
      id: data.user.id,
      email: data.user.email,
      fullName: String(data.user.user_metadata?.full_name || data.user.email.split("@")[0]),
      username: String(data.user.user_metadata?.username || data.user.email.split("@")[0]),
      branch: String(data.user.user_metadata?.branch || ""),
      semester: String(data.user.user_metadata?.semester || ""),
      enrollmentNo: String(data.user.user_metadata?.enrollment_no || ""),
    });

    if (profile.is_blocked) {
      return NextResponse.json({ ok: false, error: "Your account is blocked. Contact admin." }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true, message: "Login successful.", profile });
    setAuthCookies(response, data.session.access_token, data.session.refresh_token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
