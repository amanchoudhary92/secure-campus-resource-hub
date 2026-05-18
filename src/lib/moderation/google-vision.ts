import vision from "@google-cloud/vision";

export type ImageModerationResult = {
  safe: boolean;
  reason?: string;
  mode: "google-vision" | "not-configured" | "not-image";
  scores?: Record<string, string>;
};

function isImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function getVisionClient() {
  const credentialsJson = process.env.GOOGLE_VISION_CREDENTIALS_JSON;
  if (!credentialsJson) return null;

  try {
    const credentials = JSON.parse(credentialsJson);
    return new vision.ImageAnnotatorClient({ credentials });
  } catch {
    return null;
  }
}

export async function moderateImageWithSafeSearch(file: File): Promise<ImageModerationResult> {
  if (!isImage(file)) {
    return { safe: true, mode: "not-image" };
  }

  const client = getVisionClient();
  if (!client) {
    return {
      safe: false,
      mode: "not-configured",
      reason: "Image moderation is not configured. In strict mode, image uploads are rejected.",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const [result] = await client.safeSearchDetection(buffer);
  const safeSearch = result.safeSearchAnnotation;

  const adult = safeSearch?.adult || "UNKNOWN";
  const racy = safeSearch?.racy || "UNKNOWN";
  const violence = safeSearch?.violence || "UNKNOWN";

  const blockedValues = ["LIKELY", "VERY_LIKELY"];

  if (blockedValues.includes(adult) || blockedValues.includes(racy) || violence === "VERY_LIKELY") {
    return {
      safe: false,
      mode: "google-vision",
      reason: `Unsafe image detected. adult=${adult}, racy=${racy}, violence=${violence}`,
      scores: { adult, racy, violence },
    };
  }

  return {
    safe: true,
    mode: "google-vision",
    scores: { adult, racy, violence },
  };
}
