import { NextRequest, NextResponse } from "next/server";
import { listDuplicateFileGroups } from "@/lib/db/supabase-admin";
import { requireAdminSession } from "@/lib/security/admin-api";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdminSession(request, "GET /api/admin/duplicates");
    if (guard.response) return guard.response;

    const search = request.nextUrl.searchParams;
    const groups = await listDuplicateFileGroups({
      status: search.get("status") || "ALL",
      uploaderEmail: search.get("uploaderEmail") || undefined,
      dateFrom: search.get("dateFrom") || undefined,
      dateTo: search.get("dateTo") || undefined,
    });

    return NextResponse.json({ ok: true, groups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch duplicates.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
