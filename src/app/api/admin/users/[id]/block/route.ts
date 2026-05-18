import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { blockUserById, createAuditLog } from "@/lib/db/supabase-admin";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local-dev"
  );
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSessionFromRequest(request);
    if (!isAdmin(session)) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });

    const { id } = await context.params;
    if (id === session!.user.id) {
      return NextResponse.json({ ok: false, error: "You cannot block your own admin account." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = String(body.reason || "Blocked by admin due to unsafe/spam activity.").trim();

    await blockUserById({ userId: id, reason });

    await createAuditLog({
      action: "USER_BLOCKED",
      reason,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      actorId: session!.user.id,
      actorEmail: session!.profile.email,
      targetUserId: id,
      metadata: {
        blocked_user_id: id,
        blocked_by_id: session!.user.id,
        blocked_by_email: session!.profile.email,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, message: "User blocked successfully. They can still login/view resources, but cannot upload or post requests." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "User block failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
