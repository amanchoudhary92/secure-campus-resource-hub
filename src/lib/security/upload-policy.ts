export const RESOURCE_ALLOWED_EXTENSIONS = ["pdf", "docx", "pptx", "txt"] as const;

export const RESOURCE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

export const BLOCKED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "exe",
  "apk",
  "msi",
  "dmg",
  "js",
  "jsx",
  "ts",
  "tsx",
  "html",
  "css",
  "php",
  "py",
  "sh",
  "bat",
  "cmd",
  "ps1",
  "mp4",
  "mkv",
  "avi",
  "mov",
  "wmv",
  "flv",
  "webm",
] as const;

export const MAX_FILE_SIZE_MB: Record<string, number> = {
  pdf: 10,
  docx: 10,
  pptx: 10,
  txt: 2,
};

export type UploadValidationResult = {
  allowed: boolean;
  reason?: string;
  extension?: string;
  sizeInMB?: number;
};

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase().trim() || "";
}

export function sanitizeFileName(fileName: string): string {
  const extension = getFileExtension(fileName);
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${baseName || "resource"}.${extension}`;
}

export function validateResourceFileBasics(file: File): UploadValidationResult {
  const extension = getFileExtension(file.name);
  const sizeInMB = file.size / (1024 * 1024);

  if (!extension) {
    return { allowed: false, reason: "File extension missing.", sizeInMB };
  }

  if ((BLOCKED_EXTENSIONS as readonly string[]).includes(extension)) {
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return {
        allowed: false,
        reason:
          "Image files are blocked for resource uploads in strict free mode. Convert handwritten notes to PDF before uploading.",
        extension,
        sizeInMB,
      };
    }

    if (["mp4", "mkv", "avi", "mov", "webm"].includes(extension)) {
      return {
        allowed: false,
        reason: "Video files are blocked to prevent adult/unsafe video uploads and keep hosting free.",
        extension,
        sizeInMB,
      };
    }

    if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
      return {
        allowed: false,
        reason: "Archive files are blocked because they can hide unsafe or suspicious files.",
        extension,
        sizeInMB,
      };
    }

    return {
      allowed: false,
      reason: `${extension.toUpperCase()} files are blocked for security reasons.`,
      extension,
      sizeInMB,
    };
  }

  if (!(RESOURCE_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      allowed: false,
      reason: "Only PDF, DOCX, PPTX, and TXT academic documents are allowed.",
      extension,
      sizeInMB,
    };
  }

  if (!(RESOURCE_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      allowed: false,
      reason: "Invalid or suspicious MIME type detected.",
      extension,
      sizeInMB,
    };
  }

  const maxSize = MAX_FILE_SIZE_MB[extension];
  if (sizeInMB > maxSize) {
    return {
      allowed: false,
      reason: `${extension.toUpperCase()} files must be less than ${maxSize} MB.`,
      extension,
      sizeInMB,
    };
  }

  return { allowed: true, extension, sizeInMB };
}

export async function validateMagicNumber(file: File): Promise<UploadValidationResult> {
  const extension = getFileExtension(file.name);
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const header = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (extension === "pdf") {
    // PDF files start with %PDF = 25 50 44 46.
    if (!header.startsWith("25504446")) {
      return { allowed: false, reason: "Invalid PDF signature detected.", extension };
    }
  }

  if (["docx", "pptx"].includes(extension)) {
    // DOCX/PPTX are ZIP-based Office files and commonly start with PK = 50 4B.
    if (!header.startsWith("504b")) {
      return { allowed: false, reason: "Invalid Office document signature detected.", extension };
    }
  }

  return { allowed: true, extension };
}
