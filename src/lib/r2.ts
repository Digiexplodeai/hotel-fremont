import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
  _Object,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export const ALLOWED_CATEGORIES = [
  "rooms",
  "gallery",
  "hero",
  "dining",
  "amenities",
  "banners",
  "general",
] as const;

export type MediaCategory = (typeof ALLOWED_CATEGORIES)[number];

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface R2MediaItem {
  key: string;
  url: string;
  size: number;
  lastModified?: string;
  category: string;
  fileName: string;
}

export interface ListMediaResult {
  items: R2MediaItem[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalReturned: number;
}

/**
 * Returns the public URL base for R2 objects without trailing slash
 */
export function getPublicR2BaseUrl(): string {
  const url =
    process.env.PUBLIC_R2_PUBLIC_URL ||
    "https://pub-583d3181aad14cfaac7a1be83ef68da2.r2.dev";
  return url.replace(/\/+$/, "");
}

/**
 * Constructs a full public URL for an R2 object key
 */
export function getPublicMediaUrl(key: string): string {
  const base = getPublicR2BaseUrl();
  const cleanKey = key.startsWith("/") ? key.substring(1) : key;
  return `${base}/${cleanKey}`;
}

/**
 * Safely inspects server-side R2 configuration without exposing secrets
 */
export function getR2ConfigSummary() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || "hotel-fremont-media";
  const publicUrl = getPublicR2BaseUrl();

  return {
    isConfigured: Boolean(accountId && accessKeyId && secretKey && bucketName),
    bucketName,
    publicUrl,
    hasAccountId: Boolean(accountId),
    hasAccessKey: Boolean(accessKeyId),
    hasSecretKey: Boolean(secretKey),
  };
}

let cachedS3Client: S3Client | null = null;

/**
 * Instantiates the S3 Client for Cloudflare R2
 * Server-side only - never run in browser
 */
export function getR2Client(): S3Client {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 credentials missing. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set."
    );
  }

  cachedS3Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedS3Client;
}

/**
 * Validates and sanitizes a media category
 */
export function sanitizeCategory(category?: string | null): MediaCategory {
  if (!category) return "general";
  const normalized = category.toLowerCase().trim();
  if (ALLOWED_CATEGORIES.includes(normalized as MediaCategory)) {
    return normalized as MediaCategory;
  }
  return "general";
}

/**
 * Generates a collision-resistant, URL-safe object key:
 * e.g., "rooms/deluxe-king-suite-1793275177409-a1b2c3d4.webp"
 */
export function generateCollisionResistantKey(
  originalFileName: string,
  category: MediaCategory
): string {
  const ext = originalFileName.includes(".")
    ? originalFileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "jpg";

  const rawBase = originalFileName.substring(
    0,
    originalFileName.lastIndexOf(".") !== -1
      ? originalFileName.lastIndexOf(".")
      : originalFileName.length
  );

  const cleanBase = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "media";

  const timestamp = Date.now();
  const uniqueId = randomUUID().substring(0, 8);

  return `${category}/${cleanBase}-${timestamp}-${uniqueId}.${ext}`;
}

/**
 * Validates an R2 object key against path traversal and dangerous inputs
 */
export function validateObjectKey(key: string): { isValid: boolean; error?: string } {
  if (!key || typeof key !== "string") {
    return { isValid: false, error: "Key must be a non-empty string." };
  }

  const trimmed = key.trim();
  if (trimmed.length > 512) {
    return { isValid: false, error: "Key length exceeds maximum 512 characters." };
  }

  if (trimmed.includes("..") || trimmed.startsWith("/") || trimmed.startsWith("\\")) {
    return { isValid: false, error: "Invalid path traversal characters in key." };
  }

  // Ensure key uses standard allowed characters
  if (!/^[a-zA-Z0-9_\-\.\/]+$/.test(trimmed)) {
    return { isValid: false, error: "Key contains invalid or dangerous characters." };
  }

  return { isValid: true };
}

/**
 * Uploads a validated media file to Cloudflare R2
 */
export async function uploadMediaObject({
  buffer,
  originalFileName,
  contentType,
  category = "general",
}: {
  buffer: Buffer;
  originalFileName: string;
  contentType: string;
  category?: MediaCategory;
}): Promise<R2MediaItem> {
  // 1. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(contentType as AllowedMimeType)) {
    throw new Error(
      `Unsupported file type '${contentType}'. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // 2. Validate file size
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size exceeds limit (${(buffer.length / (1024 * 1024)).toFixed(2)} MB > 10 MB)`
    );
  }

  const s3 = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME || "hotel-fremont-media";
  const validCategory = sanitizeCategory(category);
  const key = generateCollisionResistantKey(originalFileName, validCategory);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
    if (error.name === "AccessDenied" || error.$metadata?.httpStatusCode === 403) {
      throw new Error(
        "Cloudflare R2 returned AccessDenied (403). Please ensure your Cloudflare R2 API Token was created with 'Object Read & Write' permission for the bucket."
      );
    }
    throw err;
  }

  const publicUrl = getPublicMediaUrl(key);

  return {
    key,
    url: publicUrl,
    size: buffer.length,
    lastModified: new Date().toISOString(),
    category: validCategory,
    fileName: key.split("/").pop() || key,
  };
}

/**
 * Lists media objects in Cloudflare R2 bucket with optional category prefix
 */
export async function listMediaObjects({
  category,
  limit = 50,
  continuationToken,
}: {
  category?: string;
  limit?: number;
  continuationToken?: string;
} = {}): Promise<ListMediaResult> {
  const s3 = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME || "hotel-fremont-media";

  let prefix: string | undefined = undefined;
  if (category && category !== "all") {
    const cleanCat = sanitizeCategory(category);
    prefix = `${cleanCat}/`;
  }

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: Math.min(Math.max(limit, 1), 100),
    ContinuationToken: continuationToken,
  });

  const response = await s3.send(command);
  const contents: _Object[] = response.Contents || [];

  const items: R2MediaItem[] = contents
    .filter((obj) => Boolean(obj.Key && !obj.Key.endsWith("/")))
    .map((obj) => {
      const key = obj.Key!;
      const parts = key.split("/");
      const detectedCategory = parts.length > 1 ? parts[0] : "general";
      const fileName = parts.pop() || key;

      return {
        key,
        url: getPublicMediaUrl(key),
        size: obj.Size || 0,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : undefined,
        category: detectedCategory,
        fileName,
      };
    });

  return {
    items,
    nextContinuationToken: response.NextContinuationToken,
    isTruncated: Boolean(response.IsTruncated),
    totalReturned: items.length,
  };
}

/**
 * Deletes a media object by key from Cloudflare R2
 */
export async function deleteMediaObject(key: string): Promise<{ success: boolean; key: string }> {
  const validation = validateObjectKey(key);
  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid key for deletion.");
  }

  const s3 = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME || "hotel-fremont-media";

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return { success: true, key };
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
    if (error.name === "AccessDenied" || error.$metadata?.httpStatusCode === 403) {
      throw new Error(
        "Cloudflare R2 returned AccessDenied (403). Please ensure your Cloudflare R2 API Token was created with 'Object Read & Write' permission for the bucket."
      );
    }
    throw err;
  }
}

