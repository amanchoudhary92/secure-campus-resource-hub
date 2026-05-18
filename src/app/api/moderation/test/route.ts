import { NextRequest, NextResponse } from "next/server";
import { scanTextForUnsafeTerms } from "@/lib/security/content-filter";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { text?: string };
  const result = scanTextForUnsafeTerms(body.text || "");
  return NextResponse.json({ ok: result.safe, result });
}
