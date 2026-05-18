import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sanitizeFileName } from "@/lib/security/upload-policy";

export type R2UploadResult = {
  fileUrl: string | null;
  storageKey: string | null;
  mode: "r2" | "demo-no-storage";
};

function hasR2Config() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadFileToR2(file: File): Promise<R2UploadResult> {
  const safeName = sanitizeFileName(file.name);
  const storageKey = `resources/${Date.now()}-${safeName}`;

  if (!hasR2Config()) {
    return {
      fileUrl: null,
      storageKey,
      mode: "demo-no-storage",
    };
  }

  const client = getR2Client();
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: storageKey,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const baseUrl = process.env.R2_PUBLIC_BASE_URL;

  return {
    fileUrl: baseUrl ? `${baseUrl.replace(/\/$/, "")}/${storageKey}` : null,
    storageKey,
    mode: "r2",
  };
}
