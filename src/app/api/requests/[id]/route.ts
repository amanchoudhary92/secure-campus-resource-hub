import { NextRequest, NextResponse } from "next/server";
import { createAuditLog, deleteResourceRequest } from "@/lib/db/supabase-admin";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { getClientIp, getUserAgent } from "@/lib/security/request-context";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getCurrentSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ ok: false, error: "Please login before deleting a request." }, { status: 401 });
    }

    const params = await context.params;

    const deletedRequest = await deleteResourceRequest({
      id: params.id,
      userId: session.user.id,
      isAdmin: isAdmin(session),
    });

    await createAuditLog({
      action: "REQUEST_DELETED",
      reason: isAdmin(session) ? "Request deleted by admin." : "Request deleted by owner.",
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      actorId: session.user.id,
      actorEmail: session.profile.email,
      requestId: params.id,
      metadata: {
        request_id: params.id,
        title: deletedRequest.title,
        requested_by_id: deletedRequest.requested_by_id,
        deleted_by_role: session.profile.role,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, message: "Request deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    const status = message.includes("only your own") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
