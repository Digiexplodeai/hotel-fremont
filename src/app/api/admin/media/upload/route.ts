import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/adminAuth";
import {
  uploadMediaObject,
  ALLOWED_CATEGORIES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MediaCategory,
  AllowedMimeType,
} from "@/lib/r2";

export async function POST(req: NextRequest) {
  // 1. Authenticate admin
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Admin authorization required to upload media." },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const categoryParam = (formData.get("category") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { error: "No file was provided in upload request." },
        { status: 400 }
      );
    }

    // 2. Validate MIME type
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported file type '${mimeType}'. Supported formats: JPEG, PNG, WebP, AVIF, GIF.`,
        },
        { status: 400 }
      );
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.`,
        },
        { status: 400 }
      );
    }

    // 4. Validate category
    const cleanCategory = categoryParam.toLowerCase().trim() as MediaCategory;
    const category = ALLOWED_CATEGORIES.includes(cleanCategory)
      ? cleanCategory
      : "general";

    // 5. Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Upload to Cloudflare R2
    const uploadedItem = await uploadMediaObject({
      buffer,
      originalFileName: file.name,
      contentType: mimeType,
      category,
    });

    return NextResponse.json({
      success: true,
      message: `File '${file.name}' uploaded successfully to category '${category}'.`,
      item: uploadedItem,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Upload error in /api/admin/media/upload:", error);
    const statusCode = error.message.includes("AccessDenied") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to upload image to Cloudflare R2." },
      { status: statusCode }
    );
  }
}

