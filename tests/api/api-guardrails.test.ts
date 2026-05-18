import { describe, expect, it } from "vitest";
import {
  canAccessAdmin,
  canDownloadResource,
  getUploadAccessDecision,
  isDuplicateResource,
} from "../../src/lib/security/access-control";

const student = { role: "STUDENT" as const, is_blocked: false };
const blockedStudent = { role: "STUDENT" as const, is_blocked: true };
const admin = { role: "ADMIN" as const, is_blocked: false };

describe("API guardrails", () => {
  it("blocked user cannot upload", () => {
    const decision = getUploadAccessDecision({ profile: blockedStudent, uploadsToday: 0 });
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(403);
  });

  it("daily upload limit blocks student after 5 uploads", () => {
    const decision = getUploadAccessDecision({ profile: student, uploadsToday: 5 });
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(429);
  });

  it("admin-only routes reject student access", () => {
    expect(canAccessAdmin(student)).toBe(false);
    expect(canAccessAdmin(admin)).toBe(true);
  });

  it("duplicate file detection treats existing hash as duplicate", () => {
    expect(isDuplicateResource({ id: "r1", title: "DBMS", file_hash: "abc" } as any)).toBe(true);
    expect(isDuplicateResource(null)).toBe(false);
  });

  it("non-approved resource cannot be downloaded by unrelated normal student", () => {
    const allowed = canDownloadResource({
      profile: student,
      userId: "student-2",
      resource: { status: "PENDING_REVIEW", uploaded_by_id: "student-1" } as any,
    });
    expect(allowed).toBe(false);
  });

  it("approved resource can generate signed URL for logged-in student", () => {
    const allowed = canDownloadResource({
      profile: student,
      userId: "student-2",
      resource: { status: "APPROVED", uploaded_by_id: "student-1" } as any,
    });
    expect(allowed).toBe(true);
  });
});
