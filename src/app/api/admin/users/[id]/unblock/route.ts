import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { createAuditLog, unblockUserById } from "@/lib/db/supabase-admin";

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
    const body = await request.json().catch(() => ({}));
    const reason = String(body.reason || "User unblocked by admin.").trim();
    const resetWarnings = body.resetWarnings !== false;

    await unblockUserById({ userId: id, resetWarnings });

    await createAuditLog({
      action: "USER_UNBLOCKED",
      reason,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      actorId: session!.user.id,
      actorEmail: session!.profile.email,
      targetUserId: id,
      metadata: {
        unblocked_user_id: id,
        unblocked_by_id: session!.user.id,
        unblocked_by_email: session!.profile.email,
        reset_warnings: resetWarnings,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, message: "User unblocked successfully. Upload/request access has been restored." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "User unblock failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
