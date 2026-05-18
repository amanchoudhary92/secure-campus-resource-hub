import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Logged out." });
  clearAuthCookies(response);
  return response;
}
