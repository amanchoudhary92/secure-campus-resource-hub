export async function verifyTurnstileToken(token: string | null, ip?: string | null): Promise<{ success: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Development mode: skip if key is not configured.
  if (!secret) {
    return { success: true };
  }

  if (!token) {
    return { success: false, reason: "Bot verification token missing." };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { success?: boolean; "error-codes"?: string[] };

  if (!data.success) {
    return {
      success: false,
      reason: `Bot verification failed: ${data["error-codes"]?.join(", ") || "unknown error"}`,
    };
  }

  return { success: true };
}
