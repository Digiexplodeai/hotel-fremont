import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/adminAuth";
import {
  listMediaObjects,
  deleteMediaObject,
  validateObjectKey,
  getR2ConfigSummary,
} from "@/lib/r2";

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Admin authorization required to list media." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const continuationToken = searchParams.get("continuationToken") || undefined;

  try {
    const data = await listMediaObjects({
      category,
      limit,
      continuationToken,
    });

    return NextResponse.json({
      success: true,
      bucket: getR2ConfigSummary().bucketName,
      publicBaseUrl: getR2ConfigSummary().publicUrl,
      ...data,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error listing media from R2:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list media from storage." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Admin authorization required to delete media." },
      { status: 401 }
    );
  }

  let key: string | null = null;

  // Try JSON body first
  try {
    const body = await req.json();
    key = body?.key;
  } catch {
    // If not json body, check query param
    const { searchParams } = new URL(req.url);
    key = searchParams.get("key");
  }

  if (!key) {
    return NextResponse.json(
      { error: "Missing required 'key' parameter for object deletion." },
      { status: 400 }
    );
  }

  const validation = validateObjectKey(key);
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error || "Invalid key supplied." },
      { status: 400 }
    );
  }

  try {
    const result = await deleteMediaObject(key);
    return NextResponse.json({
      success: true,
      message: `Object '${key}' successfully removed from Cloudflare R2.`,
      key: result.key,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error deleting object from R2:", error);
    const statusCode = error.message.includes("AccessDenied") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to delete object from storage." },
      { status: statusCode }
    );
  }
}

