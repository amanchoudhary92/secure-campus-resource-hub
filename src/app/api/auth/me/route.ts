import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getCurrentSessionFromRequest(request);
  if (!session) return NextResponse.json({ ok: false, user: null, profile: null }, { status: 401 });
  return NextResponse.json({ ok: true, user: { id: session.user.id, email: session.user.email }, profile: session.profile });
}
