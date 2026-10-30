import { NextRequest, NextResponse } from "next/server";
import {
  isAuthorizedAdmin,
  getAdminSecret,
  ADMIN_COOKIE_NAME,
} from "@/lib/adminAuth";
import { getR2ConfigSummary } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const authenticated = isAuthorizedAdmin(req);
  const r2Summary = getR2ConfigSummary();

  return NextResponse.json({
    authenticated,
    r2Config: {
      isConfigured: r2Summary.isConfigured,
      bucketName: r2Summary.bucketName,
      publicUrl: r2Summary.publicUrl,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, password } = body || {};
    const candidate = (key || password || "").toString().trim();
    const secret = getAdminSecret();

    if (!candidate || candidate !== secret) {
      return NextResponse.json(
        { error: "Invalid admin key or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful.",
    });

    // Set secure session cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: secret,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Malformed request payload." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session logged out successfully.",
  });

  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}

