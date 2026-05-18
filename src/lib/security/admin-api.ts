import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/db/supabase-admin";
import { getClientIp, getUserAgent } from "@/lib/security/request-context";

export async function requireAdminSession(request: NextRequest, actionLabel: string) {
  const session = await getCurrentSessionFromRequest(request);

  if (!isAdmin(session)) {
    await createAuditLog({
      action: "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT",
      reason: `Unauthorized access attempt: ${actionLabel}`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      actorId: session?.user.id || null,
      actorEmail: session?.profile.email || null,
      metadata: {
        action_label: actionLabel,
        path: request.nextUrl.pathname,
        user_id: session?.user.id || null,
        user_email: session?.profile.email || null,
      },
    }).catch(() => null);

    return {
      session: null,
      response: NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 }),
    };
  }

  return { session, response: null };
}
