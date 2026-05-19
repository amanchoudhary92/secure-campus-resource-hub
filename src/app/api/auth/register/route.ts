import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db/supabase-admin";
import { ensureProfile, setAuthCookies } from "@/lib/auth/session";

function clean(value: unknown) {
  return String(value || "").trim();
}

function friendlyAuthError(message?: string) {
  const text = String(message || "").toLowerCase();

  if (
    text.includes("already registered") ||
    text.includes("already been registered") ||
    text.includes("already exists") ||
    text.includes("user already")
  ) {
    return "Email already exists. Please login or use forgot password.";
  }

  if (text.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (text.includes("password")) {
    return "Password is too weak or invalid. Please use at least 8 characters.";
  }

  return message || "Could not create account.";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const fullName = clean(body.fullName);
    const username = clean(body.username);
    const email = clean(body.email).toLowerCase();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    const branch = clean(body.branch || "CSE");
    const semester = clean(body.semester || "5th");
    const enrollmentNo = clean(body.enrollmentNo);

    if (!fullName || !username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          ok: false,
          error: "Full name, username, email, password, and confirm password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { ok: false, error: "Password and Confirm Password do not match." },
        { status: 400 }
      );
    }

    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (usernameCheckError) {
      return NextResponse.json(
        { ok: false, error: "Could not validate username. Please try again." },
        { status: 500 }
      );
    }

    if (existingUsername) {
      return NextResponse.json(
        { ok: false, error: "Username already exists. Please choose another username." },
        { status: 409 }
      );
    }

    const { data: existingEmail, error: emailCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailCheckError) {
      return NextResponse.json(
        { ok: false, error: "Could not validate email. Please try again." },
        { status: 500 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { ok: false, error: "Email already exists. Please login or use forgot password." },
        { status: 409 }
      );
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username,
        branch,
        semester,
        enrollment_no: enrollmentNo,
      },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { ok: false, error: friendlyAuthError(createError?.message) },
        { status: 400 }
      );
    }

    const profile = await ensureProfile({
      id: created.user.id,
      email,
      fullName,
      username,
      branch,
      semester,
      enrollmentNo,
    });

    const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !login.session?.access_token) {
      return NextResponse.json({
        ok: true,
        message: "Account created. Please login.",
        profile,
      });
    }

    const response = NextResponse.json({
      ok: true,
      message: "Account created successfully.",
      profile,
    });

    setAuthCookies(response, login.session.access_token, login.session.refresh_token);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}