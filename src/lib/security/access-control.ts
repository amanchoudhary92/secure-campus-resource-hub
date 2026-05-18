import type { ProfileRow } from "@/lib/auth/session";
import type { ResourceRow } from "@/lib/db/supabase-admin";

export const STUDENT_DAILY_UPLOAD_LIMIT = 5;
export const STUDENT_DAILY_REQUEST_LIMIT = 10;

export function profileIsAdmin(profile?: Pick<ProfileRow, "role"> | null) {
  return profile?.role === "ADMIN";
}

export function canAccessAdmin(profile?: Pick<ProfileRow, "role"> | null) {
  return profileIsAdmin(profile);
}

export function getUploadAccessDecision(input: {
  profile?: Pick<ProfileRow, "role" | "is_blocked"> | null;
  uploadsToday: number;
}) {
  const { profile, uploadsToday } = input;

  if (!profile) {
    return { allowed: false, status: 401, reason: "Please login before uploading a resource." };
  }

  if (profile.is_blocked) {
    return {
      allowed: false,
      status: 403,
      reason: "Your upload access has been blocked by admin. You can still view approved resources.",
    };
  }

  if (!profileIsAdmin(profile) && uploadsToday >= STUDENT_DAILY_UPLOAD_LIMIT) {
    return {
      allowed: false,
      status: 429,
      reason: `Daily upload limit reached. Students can upload up to ${STUDENT_DAILY_UPLOAD_LIMIT} resources per day.`,
    };
  }

  return { allowed: true, status: 200, reason: null };
}

export function getRequestAccessDecision(input: {
  profile?: Pick<ProfileRow, "role" | "is_blocked"> | null;
  requestsToday: number;
}) {
  const { profile, requestsToday } = input;

  if (!profile) {
    return { allowed: false, status: 401, reason: "Please login before submitting a resource request." };
  }

  if (profile.is_blocked) {
    return { allowed: false, status: 403, reason: "Your account is blocked from submitting requests." };
  }

  if (!profileIsAdmin(profile) && requestsToday >= STUDENT_DAILY_REQUEST_LIMIT) {
    return {
      allowed: false,
      status: 429,
      reason: `Daily request limit reached. Students can post up to ${STUDENT_DAILY_REQUEST_LIMIT} resource requests per day.`,
    };
  }

  return { allowed: true, status: 200, reason: null };
}

export function canDownloadResource(input: {
  profile?: Pick<ProfileRow, "role"> | null;
  userId?: string | null;
  resource?: Pick<ResourceRow, "status" | "uploaded_by_id"> | null;
  allowOwnerNonApproved?: boolean;
}) {
  const { profile, userId, resource, allowOwnerNonApproved = true } = input;
  if (!profile || !resource) return false;
  if (profileIsAdmin(profile)) return true;
  if (resource.status === "APPROVED") return true;
  if (allowOwnerNonApproved && userId && resource.uploaded_by_id === userId) return true;
  return false;
}

export function canDeleteResource(input: {
  profile?: Pick<ProfileRow, "role"> | null;
  userId?: string | null;
  resource?: Pick<ResourceRow, "status" | "uploaded_by_id"> | null;
}) {
  const { profile, userId, resource } = input;
  if (!profile || !resource) return false;
  if (profileIsAdmin(profile)) return true;

  const ownsResource = resource.uploaded_by_id === userId;
  const studentDeletableStatus = ["PENDING_REVIEW", "REJECTED", "BLOCKED"].includes(resource.status);
  return Boolean(ownsResource && studentDeletableStatus);
}

export function isDuplicateResource(existingResource?: Pick<ResourceRow, "id" | "title" | "file_hash"> | null) {
  return Boolean(existingResource?.file_hash);
}
