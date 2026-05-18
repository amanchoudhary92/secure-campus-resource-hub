import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  countUserUploadsToday,
  createAuditLog,
  createResource,
  findResourceByHash,
  listResources,
} from "@/lib/db/supabase-admin";
import { getCurrentSessionFromRequest, isAdmin } from "@/lib/auth/session";
import { getUploadAccessDecision } from "@/lib/security/access-control";
import { scanTextForUnsafeTerms } from "@/lib/security/content-filter";
import { checkUploadRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { getFileExtension, validateMagicNumber, validateResourceFileBasics } from "@/lib/security/upload-policy";
import { uploadFileToSupabaseStorage } from "@/lib/storage/supabase-storage";
import { generateDocumentSummary } from "@/lib/ai/document-summary";
import { getUserAgent } from "@/lib/security/request-context";

export const runtime = "nodejs";

async function calculateFileHash(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return createHash("sha256").update(buffer).digest("hex");
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local-dev"
  );
}

export async function GET() {
  try {
    const resources = await listResources();
    return NextResponse.json({ ok: true, resources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch resources.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSessionFromRequest(request);
    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Please login before uploading a resource." },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;
    const currentUserName = session.profile.full_name;
    const currentUserEmail = session.profile.email;
    const isCurrentUserAdmin = isAdmin(session);

    const uploadsToday = !isCurrentUserAdmin ? await countUserUploadsToday(currentUserId) : 0;

    const uploadAccess = getUploadAccessDecision({
      profile: session.profile,
      uploadsToday,
    });

    if (!uploadAccess.allowed) {
      if (uploadAccess.status === 429) {
        await createAuditLog({
          action: "RATE_LIMIT_EXCEEDED",
          reason: uploadAccess.reason,
          ipAddress: ip,
          userAgent,
          actorId: currentUserId,
          actorEmail: currentUserEmail,
          metadata: { limit_type: "UPLOAD_DAILY", uploads_today: uploadsToday },
        }).catch(() => null);
      }

      return NextResponse.json({ ok: false, error: uploadAccess.reason }, { status: uploadAccess.status });
    }

    const rateLimit = await checkUploadRateLimit(ip);

    if (!rateLimit.allowed) {
      await createAuditLog({
        action: "RATE_LIMIT_EXCEEDED",
        reason: rateLimit.reason,
        ipAddress: ip,
        userAgent,
        actorId: currentUserId,
        actorEmail: currentUserEmail,
        metadata: { limit_type: "UPLOAD_IP" },
      }).catch(() => null);

      return NextResponse.json({ ok: false, error: rateLimit.reason }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const branch = String(formData.get("branch") || "CSE").trim();
    const semester = String(formData.get("semester") || "5th").trim();
    const subject = String(formData.get("subject") || "").trim();
    const resourceType = String(formData.get("resourceType") || "Notes").trim();
    const tagsRaw = String(formData.get("tags") || "").trim();
    const turnstileToken = String(formData.get("turnstileToken") || "").trim() || null;

    const botCheck = await verifyTurnstileToken(turnstileToken, ip);
    if (!botCheck.success) {
      return NextResponse.json({ ok: false, error: botCheck.reason }, { status: 403 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "File is required." }, { status: 400 });
    }

    if (!title || !description || !subject) {
      return NextResponse.json({ ok: false, error: "Title, description, and subject are required." }, { status: 400 });
    }

    const textScan = scanTextForUnsafeTerms(file.name, title, description, subject, tagsRaw);

    if (!textScan.safe) {
      await createResource({
        title: title || file.name,
        description: description || "Rejected upload",
        subject: subject || "Unknown",
        branch,
        semester,
        resource_type: resourceType,
        tags: [],
        file_name: file.name,
        file_type: getFileExtension(file.name),
        file_size: file.size,
        file_url: null,
        storage_key: null,
        file_hash: null,
        status: "BLOCKED",
        moderation_reason: textScan.reason || "Unsafe text detected.",
        uploaded_by_id: currentUserId,
        uploaded_by_name: currentUserName,
        uploaded_by_email: currentUserEmail,
      });

      await createAuditLog({
        action: "SUSPICIOUS_UPLOAD_BLOCKED",
        reason: textScan.reason || "Unsafe text detected.",
        ipAddress: ip,
        userAgent,
        actorId: currentUserId,
        actorEmail: currentUserEmail,
        metadata: { file_name: file.name, title, subject, branch, semester, block_type: "TEXT_FILTER" },
      }).catch(() => null);

      return NextResponse.json({ ok: false, error: textScan.reason }, { status: 400 });
    }

    const basicValidation = validateResourceFileBasics(file);

    if (!basicValidation.allowed) {
      await createResource({
        title: title || file.name,
        description: description || "Rejected upload",
        subject: subject || "Unknown",
        branch,
        semester,
        resource_type: resourceType,
        tags: [],
        file_name: file.name,
        file_type: basicValidation.extension || getFileExtension(file.name),
        file_size: file.size,
        file_url: null,
        storage_key: null,
        file_hash: null,
        status: "BLOCKED",
        moderation_reason: basicValidation.reason || "File blocked by upload policy.",
        uploaded_by_id: currentUserId,
        uploaded_by_name: currentUserName,
        uploaded_by_email: currentUserEmail,
      });

      await createAuditLog({
        action: "SUSPICIOUS_UPLOAD_BLOCKED",
        reason: basicValidation.reason || "File blocked by upload policy.",
        ipAddress: ip,
        userAgent,
        actorId: currentUserId,
        actorEmail: currentUserEmail,
        metadata: {
          file_name: file.name,
          file_type: basicValidation.extension || getFileExtension(file.name),
          block_type: "FILE_POLICY",
        },
      }).catch(() => null);

      return NextResponse.json({ ok: false, error: basicValidation.reason }, { status: 400 });
    }

    const magicValidation = await validateMagicNumber(file);

    if (!magicValidation.allowed) {
      await createResource({
        title: title || file.name,
        description: description || "Rejected upload",
        subject: subject || "Unknown",
        branch,
        semester,
        resource_type: resourceType,
        tags: [],
        file_name: file.name,
        file_type: basicValidation.extension || getFileExtension(file.name),
        file_size: file.size,
        file_url: null,
        storage_key: null,
        file_hash: null,
        status: "BLOCKED",
        moderation_reason: magicValidation.reason || "Invalid file signature.",
        uploaded_by_id: currentUserId,
        uploaded_by_name: currentUserName,
        uploaded_by_email: currentUserEmail,
      });

      await createAuditLog({
        action: "SUSPICIOUS_UPLOAD_BLOCKED",
        reason: magicValidation.reason || "Invalid file signature.",
        ipAddress: ip,
        userAgent,
        actorId: currentUserId,
        actorEmail: currentUserEmail,
        metadata: { file_name: file.name, block_type: "MAGIC_NUMBER" },
      }).catch(() => null);

      return NextResponse.json({ ok: false, error: magicValidation.reason }, { status: 400 });
    }

    const fileHash = await calculateFileHash(file);
    const duplicate = await findResourceByHash(fileHash);

    if (duplicate) {
      await createAuditLog({
        action: "DUPLICATE_UPLOAD_ATTEMPT",
        reason: `Duplicate file blocked. Existing resource: ${duplicate.title}`,
        ipAddress: ip,
        userAgent,
        actorId: currentUserId,
        actorEmail: currentUserEmail,
        resourceId: duplicate.id,
        metadata: {
          attempted_file_name: file.name,
          duplicate_file_hash: fileHash,
          existing_resource_id: duplicate.id,
          existing_resource_title: duplicate.title,
        },
      }).catch(() => null);

      return NextResponse.json(
        {
          ok: false,
          error: `Duplicate file blocked. This file already exists as "${duplicate.title}".`,
        },
        { status: 409 }
      );
    }

    const extension = basicValidation.extension || getFileExtension(file.name);

    const summaryResult = await generateDocumentSummary(file, extension, {
      title,
      description,
      subject,
      manualTags: tagsRaw,
    });

    if (summaryResult.unsafe) {
      await createResource({
        title: title || file.name,
        description: description || "Blocked upload",
        subject: subject || "Unknown",
        branch,
        semester,
        resource_type: resourceType,
        tags: [],
        file_name: file.name,
        file_type: extension,
        file_size: file.size,
        file_url: null,
        storage_key: null,
        file_hash: fileHash,
        status: "BLOCKED",
        moderation_reason: summaryResult.unsafeReason || "Unsafe document content detected.",
        uploaded_by_id: currentUserId,
        uploaded_by_name: currentUserName,
        uploaded_by_email: currentUserEmail,
        summary: null,
        keywords: [],
        extracted_text: summaryResult.extractedText,
        summary_status: "FAILED",
        summary_generated_at: new Date().toISOString(),
      });

      await createAuditLog({
        action: "SUSPICIOUS_UPLOAD_BLOCKED",
        reason: summaryResult.unsafeReason || "Unsafe document content detected.",
        ipAddress: ip,
        userAgent,
        actorId: currentUserId,
        actorEmail: currentUserEmail,
        metadata: { file_name: file.name, file_hash: fileHash, block_type: "DOCUMENT_TEXT" },
      }).catch(() => null);

      return NextResponse.json(
        { ok: false, error: summaryResult.unsafeReason || "Unsafe document content detected." },
        { status: 400 }
      );
    }

    const storage = await uploadFileToSupabaseStorage(file);

    const manualTags = tagsRaw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 10);

    const tags = [...new Set([...manualTags, ...summaryResult.keywords])].slice(0, 12);

    const resource = await createResource({
      title,
      description,
      subject,
      branch,
      semester,
      resource_type: resourceType,
      tags,
      file_name: file.name,
      file_type: extension,
      file_size: file.size,
      file_url: storage.fileUrl,
      storage_key: storage.storageKey,
      file_hash: fileHash,
      status: "PENDING_REVIEW",
      moderation_reason:
        storage.mode === "supabase-storage"
          ? `Waiting for admin review. Summary status: ${summaryResult.status}. ${summaryResult.reason}`
          : "Waiting for admin review. Running in demo mode because storage is not configured.",
      uploaded_by_id: currentUserId,
      uploaded_by_name: currentUserName,
      uploaded_by_email: currentUserEmail,
      summary: summaryResult.summary,
      keywords: summaryResult.keywords,
      extracted_text: summaryResult.extractedText,
      summary_status: summaryResult.status,
      summary_generated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message:
        storage.mode === "supabase-storage"
          ? "Resource uploaded successfully and sent for admin review. It will become public after approval."
          : "Resource passed validation and was sent for admin review in demo mode.",
      resource,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}