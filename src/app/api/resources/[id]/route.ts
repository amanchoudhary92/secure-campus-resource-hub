import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { createAuditLog, deleteResourceRecord, getResourceById } from "@/lib/db/supabase-admin";
import { canDeleteResource } from "@/lib/security/access-control";
import { deleteFileFromSupabaseStorage } from "@/lib/storage/supabase-storage";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSessionFromRequest(request);
    if (!session) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });

    const { id } = await context.params;
    const resource = await getResourceById(id);
    if (!resource) return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });

    if (!canDeleteResource({ profile: session.profile, userId: session.user.id, resource })) {
      return NextResponse.json(
        {
          ok: false,
          error: "You do not have permission to delete this resource. Students can delete only their own pending/rejected uploads.",
        },
        { status: 403 },
      );
    }

    await deleteFileFromSupabaseStorage(resource.storage_key);
    const deleted = await deleteResourceRecord(id);

    await createAuditLog({
      action: "RESOURCE_DELETED",
      reason: isAdmin(session) ? "Deleted by admin from dashboard." : "Deleted by uploader from profile.",
      ipAddress:
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "local-dev",
      userAgent: request.headers.get("user-agent"),
      actorId: session.user.id,
      actorEmail: session.profile.email,
      resourceId: id,
      metadata: {
        resource_id: id,
        title: resource.title,
        storage_key: resource.storage_key,
        deleted_by_id: session.user.id,
        deleted_by_email: session.profile.email,
        deleted_by_role: session.profile.role,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, message: "Resource deleted successfully.", resource: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
