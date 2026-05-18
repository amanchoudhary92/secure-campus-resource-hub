import { NextRequest, NextResponse } from "next/server";
import { listAuditLogsForAdmin } from "@/lib/db/supabase-admin";
import { requireAdminSession } from "@/lib/security/admin-api";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdminSession(request, "GET /api/admin/audit");
    if (guard.response) return guard.response;

    const search = request.nextUrl.searchParams;
    const result = await listAuditLogsForAdmin({
      action: search.get("action") || "ALL",
      query: search.get("q") || undefined,
      actorEmail: search.get("actorEmail") || undefined,
      resourceId: search.get("resourceId") || undefined,
      dateFrom: search.get("dateFrom") || undefined,
      dateTo: search.get("dateTo") || undefined,
      page: Number(search.get("page") || 1),
      pageSize: Number(search.get("pageSize") || 25),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch audit logs.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
