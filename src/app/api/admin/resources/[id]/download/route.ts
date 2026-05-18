import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { createAuditLog, getResourceById } from "@/lib/db/supabase-admin";
import { getClientIp, getUserAgent } from "@/lib/security/request-context";
import { createSignedDownloadUrl } from "@/lib/storage/supabase-storage";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSessionFromRequest(request);
    if (!isAdmin(session)) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });

    const { id } = await context.params;
    const resource = await getResourceById(id);
    if (!resource) return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });

    if (resource.storage_key) {
      const expiresIn = 300;
      const signedUrl = await createSignedDownloadUrl(resource.storage_key, expiresIn);

      await createAuditLog({
        action: "DOWNLOAD_CREATED",
        reason: "Admin signed preview URL generated.",
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        actorId: session!.user.id,
        actorEmail: session!.profile.email,
        resourceId: resource.id,
        metadata: {
          resource_id: resource.id,
          title: resource.title,
          storage_key: resource.storage_key,
          admin_preview: true,
          expires_in_seconds: expiresIn,
        },
      }).catch(() => null);

      return NextResponse.redirect(signedUrl);
    }

    return NextResponse.json({ ok: false, error: "File is not available." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin download failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
