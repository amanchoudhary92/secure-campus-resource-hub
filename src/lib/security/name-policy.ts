export type NamePolicyResult = {
  allowed: boolean;
  reason?: string;
};

const BLOCKED_NAME_TERMS = [
  "adult",
  "nude",
  "nudity",
  "porn",
  "xxx",
  "sex",
  "sexy",
  "vulgar",
  "abuse",
  "abusive",
  "gaali",
  "gali",
  "hate",
  "kill",
  "rape",
  "drugs",
  "terror",
  "spam",
  "scam",
];

function normalizeNameValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[@$!|]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9]/g, "");
}

export function validateProfileName(value: string, label: "Full name" | "Username"): NamePolicyResult {
  const raw = String(value || "").trim();

  if (!raw) {
    return {
      allowed: false,
      reason: `${label} is required.`,
    };
  }

  const normalized = normalizeNameValue(raw);

  const blockedTerm = BLOCKED_NAME_TERMS.find((term) =>
    normalized.includes(normalizeNameValue(term))
  );

  if (blockedTerm) {
    return {
      allowed: false,
      reason: `${label} contains offensive or unsafe words. Please choose a respectful ${label.toLowerCase()}.`,
    };
  }

  if (label === "Username") {
    const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

    if (!usernamePattern.test(raw)) {
      return {
        allowed: false,
        reason: "Username must be 3-30 characters and can only contain letters, numbers, dot, underscore, or hyphen.",
      };
    }
  }

  if (label === "Full name") {
    const fullNamePattern = /^[a-zA-Z][a-zA-Z\s.'-]{1,60}$/;

    if (!fullNamePattern.test(raw)) {
      return {
        allowed: false,
        reason: "Full name can only contain letters, spaces, dot, apostrophe, or hyphen.",
      };
    }
  }

  return { allowed: true };
}