import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/db/supabase-admin";
import { sanitizeFileName } from "@/lib/security/upload-policy";

export type SupabaseStorageUploadResult = {
  fileUrl: string | null;
  storageKey: string | null;
  mode: "supabase-storage" | "demo-no-storage";
};

const DEFAULT_BUCKET = "resource-files";

export function getBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
}

export async function uploadFileToSupabaseStorage(file: File): Promise<SupabaseStorageUploadResult> {
  const safeName = sanitizeFileName(file.name);
  const storageKey = `resources/${Date.now()}-${safeName}`;

  if (!hasSupabaseConfig()) {
    return { fileUrl: null, storageKey, mode: "demo-no-storage" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { fileUrl: null, storageKey, mode: "demo-no-storage" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucketName = getBucketName();

  const { error } = await supabase.storage.from(bucketName).upload(storageKey, buffer, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

  // The bucket is private. Keep file_url null and use storage_key with signed download APIs.
  return { fileUrl: null, storageKey, mode: "supabase-storage" };
}

export async function createSignedDownloadUrl(storageKey: string, expiresInSeconds = 300) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.storage.from(getBucketName()).createSignedUrl(storageKey, expiresInSeconds);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteFileFromSupabaseStorage(storageKey: string | null | undefined) {
  if (!storageKey) return { ok: true, skipped: true };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: true, skipped: true };

  const { error } = await supabase.storage.from(getBucketName()).remove([storageKey]);

  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }

  return { ok: true, skipped: false };
}
