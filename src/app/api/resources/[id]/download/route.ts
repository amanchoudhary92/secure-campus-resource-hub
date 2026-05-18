import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest } from "@/lib/auth/session";
import { createAuditLog, getResourceById } from "@/lib/db/supabase-admin";
import { canDownloadResource } from "@/lib/security/access-control";
import { getClientIp, getUserAgent } from "@/lib/security/request-context";
import { createSignedDownloadUrl } from "@/lib/storage/supabase-storage";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSessionFromRequest(request);
    if (!session) return NextResponse.json({ ok: false, error: "Login required to download resources." }, { status: 401 });

    const { id } = await context.params;
    const resource = await getResourceById(id);

    if (!resource) {
      return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
    }

    if (!canDownloadResource({ profile: session.profile, userId: session.user.id, resource })) {
      return NextResponse.json({ ok: false, error: "This resource is not approved for your account." }, { status: 403 });
    }

    if (!resource.storage_key) {
      return NextResponse.json({ ok: false, error: "Stored file is not available." }, { status: 404 });
    }

    const expiresIn = 180;
    const signedUrl = await createSignedDownloadUrl(resource.storage_key, expiresIn);

    await createAuditLog({
      action: "DOWNLOAD_CREATED",
      reason: "Signed download URL generated.",
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      actorId: session.user.id,
      actorEmail: session.profile.email,
      resourceId: resource.id,
      metadata: {
        resource_id: resource.id,
        title: resource.title,
        storage_key: resource.storage_key,
        resource_status: resource.status,
        expires_in_seconds: expiresIn,
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, signedUrl, expiresIn });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
