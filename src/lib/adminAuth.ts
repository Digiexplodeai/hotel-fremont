import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "fremont_admin_session";

export function getAdminSecret(): string {
  return process.env.ADMIN_API_KEY || "fremont-admin-2026";
}

/**
 * Validates admin authorization from a NextRequest.
 * Checks:
 * 1. Header `x-admin-key`
 * 2. Header `Authorization: Bearer <token>`
 * 3. Cookie `fremont_admin_session`
 */
export function isAuthorizedAdmin(req: NextRequest): boolean {
  const adminSecret = getAdminSecret();

  // 1. Check custom header
  const headerKey = req.headers.get("x-admin-key");
  if (headerKey && headerKey === adminSecret) {
    return true;
  }

  // 2. Check Authorization Bearer
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === adminSecret) {
      return true;
    }
  }

  // 3. Check session cookie
  const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (sessionCookie && sessionCookie === adminSecret) {
    return true;
  }

  return false;
}

