import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { createAuditLog, updateResourceStatus } from "@/lib/db/supabase-admin";

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

    const body = await request.json().catch(() => ({}));
    const reason = String(body.reason || "Approved by admin after manual review.").trim();

    const { id } = await context.params;
    const resource = await updateResourceStatus({
      id,
      status: "APPROVED",
      reason,
      reviewedById: session!.user.id,
    });

    await createAuditLog({
      action: "RESOURCE_APPROVED",
      reason,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      actorId: session!.user.id,
      actorEmail: session!.profile.email,
      resourceId: id,
      metadata: {
        resource_id: id,
        title: resource.title,
        reviewed_by_id: session!.user.id,
        reviewed_by_email: session!.profile.email,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, message: "Resource approved.", resource });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
