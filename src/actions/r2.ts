"use server";

import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import {
  getR2Client,
  getPublicMediaUrl,
  verifyObjectExists,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  AllowedMimeType,
} from "@/lib/r2";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface PresignedUploadResponse {
  success: boolean;
  uploadUrl?: string;
  key?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Generates a presigned PUT URL for direct browser-to-R2 upload.
 * Bypasses Netlify payload limits completely.
 */
export async function requestPresignedUploadUrl({
  slotKey,
  section = "general",
  fileName,
  mimeType,
  sizeBytes,
}: {
  slotKey?: string;
  section?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<PresignedUploadResponse> {
  // 1. Verify admin authorization
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    return { success: false, error: "Unauthorized: Owner or Manager role required." };
  }

  // 2. Validate MIME type (SVG rejected except for logo by owner)
  if (mimeType === "image/svg+xml") {
    if (slotKey !== "branding.logo" || user.role !== "owner") {
      return { success: false, error: "SVG uploads are restricted to the brand logo by owners only." };
    }
  } else if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return {
      success: false,
      error: `Unsupported file type '${mimeType}'. Allowed formats: WebP, JPEG, PNG, AVIF.`,
    };
  }

  // 3. Validate file size (max 10MB)
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `File size exceeds 10MB limit (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  try {
    const s3 = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "hotel-fremont-media";

    // 4. Generate unique, immutable key
    const cleanExt = fileName.includes(".")
      ? fileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
      : "webp";
    const rawBase = fileName.substring(0, fileName.lastIndexOf(".") !== -1 ? fileName.lastIndexOf(".") : fileName.length);
    const cleanBase = rawBase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "media";

    const uniqueId = randomUUID().substring(0, 8);
    const objectKey = `site/${section}/${cleanBase}-${Date.now()}-${uniqueId}.${cleanExt}`;

    // 5. Generate Presigned PUT URL (valid for 120 seconds)
    // Explicitly sign only 'host' to avoid signature mismatch and R2 flexible checksum issues
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 120,
      signableHeaders: new Set(["host"]),
    });
    const publicUrl = getPublicMediaUrl(objectKey);

    return {
      success: true,
      uploadUrl,
      key: objectKey,
      publicUrl,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Presigned URL error:", error);
    return { success: false, error: error.message || "Failed to generate presigned upload URL." };
  }
}

/**
 * Confirms a completed direct R2 upload:
 * - Checks HeadObject on R2 to verify file existence and size
 * - Upserts media_assets metadata in Supabase
 * - If slotKey is provided, updates image_slots pointer and safely deletes replaced old R2 object
 * - Revalidates public paths
 */
export async function confirmUploadAction({
  key,
  slotKey,
  section = "general",
  category = "general",
  fileName,
  mimeType,
  width,
  height,
  blurDataUrl,
  altText,
  focalPoint,
}: {
  key: string;
  slotKey?: string;
  section?: string;
  category?: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  blurDataUrl?: string;
  altText?: string;
  focalPoint?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Admin session required." };
  }

  // 1. Verify object exists in Cloudflare R2
  const head = await verifyObjectExists(key);
  if (!head.exists) {
    return { success: false, error: "Object verification failed on Cloudflare R2 storage." };
  }

  const sizeBytes = head.size || 0;
  const publicUrl = getPublicMediaUrl(key);
  const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "hotel-fremont-media";

  // 2. Connect to Supabase
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient() || supabase;

  let mediaId: string | undefined = undefined;

  if (adminSupabase) {
    try {
      // Insert into media_assets
      const { data: mediaRow, error: mediaErr } = await adminSupabase
        .from("media_assets")
        .insert({
          key,
          url: publicUrl,
          bucket: bucketName,
          section,
          category,
          filename: fileName,
          mime_type: mimeType,
          size_bytes: sizeBytes,
          width: width || null,
          height: height || null,
          blur_data_url: blurDataUrl || null,
          alt_text: altText || null,
          uploaded_by: user.isFallbackAdmin ? null : user.id,
        })
        .select("id")
        .single();

      if (!mediaErr && mediaRow) {
        mediaId = mediaRow.id;
      }

      // If assigned to a specific slot, update slot pointer
      if (slotKey && mediaId) {
        // Find if slot had an existing custom R2 key to clean up
        const { data: existingSlot } = await adminSupabase
          .from("image_slots")
          .select("media_id, media_assets(key)")
          .eq("slot_key", slotKey)
          .single();

        const oldKey = (existingSlot as any)?.media_assets?.key;

        // Update slot pointer
        await adminSupabase
          .from("image_slots")
          .upsert({
            slot_key: slotKey,
            label: slotKey,
            section,
            media_id: mediaId,
            fallback_url: publicUrl,
            alt_text: altText || null,
            focal_point: focalPoint || "50% 50%",
            updated_at: new Date().toISOString(),
          });

        // If old key was a custom R2 upload, remove it to prevent stale CDN cache
        if (oldKey && oldKey !== key && oldKey.startsWith("site/")) {
          try {
            const s3 = getR2Client();
            await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: oldKey }));
          } catch (e) {
            console.warn("Notice: Old R2 object deletion deferred:", e);
          }
        }
      }

      // Log to audit_logs
      await adminSupabase.from("audit_logs").insert({
        user_id: user.isFallbackAdmin ? null : user.id,
        user_email: user.email,
        action: slotKey ? "replace_image_slot" : "upload_media",
        entity_type: "media_assets",
        entity_id: mediaId || key,
        changes: { key, slotKey, sizeBytes, publicUrl },
      });
    } catch (dbErr) {
      console.warn("Notice: Supabase row update skipped in local mode:", dbErr);
    }
  }

  // 3. Revalidate site paths instantly
  try {
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/images");
  } catch {}

  return {
    success: true,
    key,
    publicUrl,
    mediaId,
    sizeBytes,
  };
}

/**
 * Updates slot metadata (alt text and focal point object-position)
 */
export async function updateSlotMetaAction({
  slotKey,
  altText,
  focalPoint,
}: {
  slotKey: string;
  altText: string;
  focalPoint: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const adminSupabase = createAdminSupabaseClient();
  if (adminSupabase) {
    await adminSupabase
      .from("image_slots")
      .update({
        alt_text: altText,
        focal_point: focalPoint,
        updated_at: new Date().toISOString(),
      })
      .eq("slot_key", slotKey);
  }

  try {
    revalidatePath("/");
    revalidatePath("/admin/images");
  } catch {}

  return { success: true };
}

/**
 * Restores an image slot to its original default photography
 */
export async function restoreSlotDefaultAction({ slotKey }: { slotKey: string }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) {
    return { success: false, error: "Unauthorized" };
  }

  const adminSupabase = createAdminSupabaseClient();
  if (adminSupabase) {
    await adminSupabase
      .from("image_slots")
      .update({
        media_id: null,
        focal_point: "50% 50%",
        updated_at: new Date().toISOString(),
      })
      .eq("slot_key", slotKey);
  }

  try {
    revalidatePath("/");
    revalidatePath("/admin/images");
  } catch {}

  return { success: true, message: `Slot '${slotKey}' restored to factory default.` };
}

/**
 * Deletes or trashes a media asset
 */
export async function deleteMediaAction({
  mediaId,
  key,
  permanent = false,
}: {
  mediaId?: string;
  key: string;
  permanent?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return { success: false, error: "Only the Owner can delete media assets permanently." };
  }

  const adminSupabase = createAdminSupabaseClient();

  // 1. Check if asset is used in an active slot
  if (adminSupabase && mediaId) {
    const { data: usedInSlots } = await adminSupabase
      .from("image_slots")
      .select("slot_key, label")
      .eq("media_id", mediaId);

    if (usedInSlots && usedInSlots.length > 0) {
      const slotNames = usedInSlots.map((s: any) => s.label || s.slot_key).join(", ");
      return {
        success: false,
        error: `Cannot delete: Image is currently in use by slot(s): [${slotNames}]. Replace or restore default for those slots first.`,
      };
    }
  }

  // 2. Soft delete (move to trash)
  if (!permanent && adminSupabase && mediaId) {
    await adminSupabase
      .from("media_assets")
      .update({
        is_trash: true,
        trashed_at: new Date().toISOString(),
      })
      .eq("id", mediaId);

    revalidatePath("/admin/images");
    return { success: true, message: "Moved to 30-day trash vault." };
  }

  // 3. Permanent delete from R2 and DB
  const s3 = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "hotel-fremont-media";

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
  } catch (err: unknown) {
    const error = err as Error;
    if (!error.message.includes("NoSuchKey")) {
      return { success: false, error: error.message || "Failed to delete from Cloudflare R2." };
    }
  }

  if (adminSupabase && mediaId) {
    await adminSupabase.from("media_assets").delete().eq("id", mediaId);
  }

  revalidatePath("/");
  revalidatePath("/admin/images");

  return { success: true, message: "Media permanently purged from Cloudflare R2." };
}

/**
 * Restores a media item from 30-day trash
 */
export async function restoreFromTrashAction({ mediaId }: { mediaId: string }) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const adminSupabase = createAdminSupabaseClient();
  if (adminSupabase) {
    await adminSupabase
      .from("media_assets")
      .update({
        is_trash: false,
        trashed_at: null,
      })
      .eq("id", mediaId);
  }

  revalidatePath("/admin/images");
  return { success: true, message: "Restored from trash." };
}

/**
 * Finds orphaned objects stored in Cloudflare R2 that are not referenced in the Database
 */
export async function getOrphanObjectsAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const s3 = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "hotel-fremont-media";

    // 1. List objects from R2
    const r2Res = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 100 }));
    const r2Keys = (r2Res.Contents || []).map((c) => c.Key!).filter(Boolean);

    // 2. Fetch tracked keys from Supabase
    const adminSupabase = createAdminSupabaseClient();
    let dbKeys = new Set<string>();

    if (adminSupabase) {
      const { data } = await adminSupabase.from("media_assets").select("key");
      if (data) {
        dbKeys = new Set(data.map((d: any) => d.key));
      }
    }

    // 3. Find orphans
    const orphans = r2Keys.filter((k) => !dbKeys.has(k) && !k.endsWith("/"));

    return {
      success: true,
      totalInR2: r2Keys.length,
      totalInDb: dbKeys.size,
      orphanKeys: orphans,
    };
  } catch (err: unknown) {
    const e = err as Error;
    return { success: false, error: e.message || "Failed to inspect R2 orphans." };
  }
}

