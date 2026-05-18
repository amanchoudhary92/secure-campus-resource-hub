export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getRoleForEmail(email?: string | null): "ADMIN" | "STUDENT" {
  if (!email) return "STUDENT";
  return getAdminEmails().includes(email.toLowerCase()) ? "ADMIN" : "STUDENT";
}
