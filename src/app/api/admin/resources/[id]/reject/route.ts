import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { createAuditLog, getResourceById, incrementUserWarning, updateResourceStatus } from "@/lib/db/supabase-admin";

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
    const reason = String(body.reason || "Rejected by admin after manual review.").trim();
    const status = body.block ? "BLOCKED" : "REJECTED";

    const { id } = await context.params;
    const before = await getResourceById(id);
    const resource = await updateResourceStatus({
      id,
      status,
      reason,
      reviewedById: session!.user.id,
    });

    if (status === "BLOCKED" && before?.uploaded_by_id) {
      await incrementUserWarning(before.uploaded_by_id).catch(() => null);
    }

    await createAuditLog({
      action: status === "BLOCKED" ? "RESOURCE_BLOCKED" : "RESOURCE_REJECTED",
      reason,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      actorId: session!.user.id,
      actorEmail: session!.profile.email,
      resourceId: id,
      targetUserId: before?.uploaded_by_id || null,
      metadata: {
        resource_id: id,
        title: resource.title,
        uploader_id: before?.uploaded_by_id || null,
        reviewed_by_id: session!.user.id,
        reviewed_by_email: session!.profile.email,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, message: status === "BLOCKED" ? "Resource blocked." : "Resource rejected.", resource });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rejection failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
