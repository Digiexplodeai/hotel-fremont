import { getCurrentUser } from "@/actions/auth";
import { NextRequest } from "next/server";

/**
 * Validates admin authorization for incoming requests via server-side Supabase session.
 * Rejects any unauthenticated or non-admin requests.
 */
export async function isAuthorizedAdmin(req?: NextRequest): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }
  return ["owner", "manager", "front_desk"].includes(user.role);
}
