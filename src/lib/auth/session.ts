import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/db/supabase-admin";
import { getRoleForEmail } from "@/lib/auth/admin";

export const ACCESS_COOKIE = "crh_access_token";
export const REFRESH_COOKIE = "crh_refresh_token";

export type ProfileRole = "STUDENT" | "ADMIN";

export type ProfileRow = {
  id: string;
  full_name: string;
  username: string | null;
  email: string;
  role: ProfileRole;
  branch: string | null;
  semester: string | null;
  enrollment_no: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
  warning_count: number;
  created_at: string;
};

export type AuthSession = {
  user: User;
  profile: ProfileRow;
};

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken?: string | null) {
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  if (refreshToken) {
    response.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function ensureProfile(input: {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
  branch?: string;
  semester?: string;
  enrollmentNo?: string;
}): Promise<ProfileRow> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const role = getRoleForEmail(input.email);

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing) {
    // Keep admin role synced with ADMIN_EMAILS, but do not downgrade manually promoted admins.
    const nextRole = role === "ADMIN" ? "ADMIN" : existing.role || "STUDENT";
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as ProfileRow;
  }

  const profile = {
    id: input.id,
    full_name: input.fullName || input.email.split("@")[0],
    username: input.username || input.email.split("@")[0],
    email: input.email,
    role,
    branch: input.branch || null,
    semester: input.semester || null,
    enrollment_no: input.enrollmentNo || null,
    is_blocked: false,
    warning_count: 0,
  };

  const { data, error } = await supabase.from("profiles").insert(profile).select("*").single();
  if (error) throw new Error(error.message);
  return data as ProfileRow;
}

async function getSessionFromAccessToken(accessToken?: string | null): Promise<AuthSession | null> {
  if (!accessToken) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.email) return null;

  const profile = await ensureProfile({
    id: data.user.id,
    email: data.user.email,
    fullName: String(data.user.user_metadata?.full_name || data.user.email.split("@")[0]),
    username: String(data.user.user_metadata?.username || data.user.email.split("@")[0]),
    branch: String(data.user.user_metadata?.branch || ""),
    semester: String(data.user.user_metadata?.semester || ""),
    enrollmentNo: String(data.user.user_metadata?.enrollment_no || ""),
  });

  // Keep blocked users logged in so they can view profile/resources,
  // but block risky actions like upload/request at API level.
  return { user: data.user, profile };
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  return getSessionFromAccessToken(cookieStore.get(ACCESS_COOKIE)?.value);
}

export async function getCurrentSessionFromRequest(request: NextRequest): Promise<AuthSession | null> {
  return getSessionFromAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
}

export function isAdmin(session: AuthSession | null): boolean {
  return session?.profile.role === "ADMIN";
}
