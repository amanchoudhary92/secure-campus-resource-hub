import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredResourceRequests, countUserRequestsToday, createAuditLog, createResourceRequest, listResourceRequests } from "@/lib/db/supabase-admin";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { getRequestAccessDecision } from "@/lib/security/access-control";
import { getClientIp, getUserAgent } from "@/lib/security/request-context";
import { scanTextForUnsafeTerms } from "@/lib/security/content-filter";

const allowedSemesters = new Set(["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]);
const allowedBranches = new Set(["CSE", "IT", "ECE", "ME", "CE"]);
const allowedTypes = new Set(["Notes", "PYQ", "Lab File", "Assignment", "Syllabus"]);

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ ok: false, error: "Please login to view resource requests." }, { status: 401 });
    }

    await cleanupExpiredResourceRequests();
    const requests = await listResourceRequests();
    return NextResponse.json({ ok: true, requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch requests.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ ok: false, error: "Please login before submitting a resource request." }, { status: 401 });
    }

    const requestsToday = !isAdmin(session) ? await countUserRequestsToday(session.user.id) : 0;
    const requestAccess = getRequestAccessDecision({ profile: session.profile, requestsToday });
    if (!requestAccess.allowed) {
      if (requestAccess.status === 429) {
        await createAuditLog({
          action: "RATE_LIMIT_EXCEEDED",
          reason: requestAccess.reason,
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
          actorId: session.user.id,
          actorEmail: session.profile.email,
          metadata: { limit_type: "REQUEST_DAILY", requests_today: requestsToday },
        }).catch(() => null);
      }

      return NextResponse.json({ ok: false, error: requestAccess.reason }, { status: requestAccess.status });
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const subject = String(body.subject || "").trim();
    const branch = String(body.branch || "CSE").trim();
    const semester = String(body.semester || "5th").trim();
    const resourceType = String(body.resourceType || "Notes").trim();

    if (!title || !description || !subject) {
      return NextResponse.json({ ok: false, error: "Title, subject, and description are required." }, { status: 400 });
    }

    if (title.length < 4 || description.length < 10) {
      return NextResponse.json({ ok: false, error: "Please write a clearer request with more details." }, { status: 400 });
    }

    if (!allowedBranches.has(branch)) {
      return NextResponse.json({ ok: false, error: "Invalid branch selected." }, { status: 400 });
    }

    if (!allowedSemesters.has(semester)) {
      return NextResponse.json({ ok: false, error: "Invalid semester selected." }, { status: 400 });
    }

    if (!allowedTypes.has(resourceType)) {
      return NextResponse.json({ ok: false, error: "Invalid resource type selected." }, { status: 400 });
    }

    const textScan = scanTextForUnsafeTerms(title, description, subject);
    if (!textScan.safe) {
      return NextResponse.json({ ok: false, error: textScan.reason || "Unsafe request text detected." }, { status: 400 });
    }

    await cleanupExpiredResourceRequests();

    const created = await createResourceRequest({
      title,
      description,
      subject,
      branch,
      semester,
      resource_type: resourceType,
      status: "OPEN",
      requested_by_id: session.user.id,
      requested_by_name: session.profile.full_name,
      requested_by_email: session.profile.email,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({ ok: true, message: "Request posted successfully. It will automatically expire after 7 days.", request: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request submission failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
