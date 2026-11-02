"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rateLimit";

export type AdminRole = "owner" | "manager" | "front_desk";

export interface CurrentUser {
  id: string;
  email: string;
  role: AdminRole;
  fullName?: string;
}

const ALLOWED_ADMIN_ROLES = ["owner", "manager", "front_desk", "admin"];

async function getClientIdentifier(email?: string): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const realIp = headerList.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown-ip";
    return email ? `${ip}:${email.toLowerCase().trim()}` : ip;
  } catch {
    return email ? `unknown:${email.toLowerCase().trim()}` : "unknown-client";
  }
}

/**
 * Signs in using Supabase Auth (email & password only).
 * Authenticates against Supabase, enforces rate-limiting, and strictly verifies admin role.
 */
export async function signInAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  role?: AdminRole;
}> {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  const identifier = await getClientIdentifier(email);

  // 1. Check rate limit
  const rateLimitStatus = checkRateLimit(identifier);
  if (rateLimitStatus.isLocked) {
    return {
      success: false,
      error: `Too many failed login attempts. Please try again in ${rateLimitStatus.retryAfterMinutes || 15} minutes.`,
    };
  }

  // 2. Validate input fields
  if (!email || !password) {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }

  // 3. Connect to Supabase Auth
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: "Authentication service is currently unavailable.",
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      const failed = recordFailedAttempt(identifier);
      if (failed.isLocked) {
        return {
          success: false,
          error: `Too many failed login attempts. Account locked for ${failed.retryAfterMinutes || 15} minutes.`,
        };
      }
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    const user = authData.user;

    // 4. Check if user has an authorized admin role
    let resolvedRole: AdminRole | null = null;
    let fullName: string | undefined = undefined;

    // Check user app_metadata / user_metadata
    const metaRole = (user.app_metadata?.role as string) || (user.user_metadata?.role as string);
    if (metaRole && ALLOWED_ADMIN_ROLES.includes(metaRole.toLowerCase())) {
      resolvedRole = metaRole.toLowerCase() === "admin" ? "owner" : (metaRole.toLowerCase() as AdminRole);
      fullName = (user.user_metadata?.full_name as string) || undefined;
    }

    // Check admin_users table
    if (!resolvedRole) {
      try {
        const { data: adminRow } = await supabase
          .from("admin_users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (adminRow?.role && ALLOWED_ADMIN_ROLES.includes(adminRow.role.toLowerCase())) {
          resolvedRole = adminRow.role.toLowerCase() === "admin" ? "owner" : (adminRow.role.toLowerCase() as AdminRole);
        }
      } catch {
        // admin_users table might not be queried if unmigrated
      }
    }

    // Check profiles table
    if (!resolvedRole) {
      try {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileRow?.role && ALLOWED_ADMIN_ROLES.includes(profileRow.role.toLowerCase())) {
          resolvedRole = profileRow.role.toLowerCase() === "admin" ? "owner" : (profileRow.role.toLowerCase() as AdminRole);
          fullName = profileRow.full_name || fullName;
        }
      } catch {
        // profiles table error
      }
    }

    // If user is authenticated in Supabase but is NOT an authorized admin, reject immediately
    if (!resolvedRole) {
      console.warn(`[Auth] User ${user.email} (${user.id}) signed in but has no admin role. Terminating session.`);
      await supabase.auth.signOut();
      recordFailedAttempt(identifier);
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    // Reset rate limit on successful admin authentication
    resetRateLimit(identifier);

    return {
      success: true,
      role: resolvedRole,
    };
  } catch (err: unknown) {
    console.error("[Auth] Unexpected error during admin authentication:", err);
    return {
      success: false,
      error: "Authentication service error. Please try again.",
    };
  }
}

/**
 * Returns current authenticated admin user from Supabase session.
 * Rejects non-admin users.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    let role: AdminRole | null = null;
    let fullName: string | undefined = undefined;

    // 1. Check metadata
    const metaRole = (user.app_metadata?.role as string) || (user.user_metadata?.role as string);
    if (metaRole && ALLOWED_ADMIN_ROLES.includes(metaRole.toLowerCase())) {
      role = metaRole.toLowerCase() === "admin" ? "owner" : (metaRole.toLowerCase() as AdminRole);
      fullName = (user.user_metadata?.full_name as string) || undefined;
    }

    // 2. Check admin_users table
    if (!role) {
      try {
        const { data: adminRow } = await supabase
          .from("admin_users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (adminRow?.role && ALLOWED_ADMIN_ROLES.includes(adminRow.role.toLowerCase())) {
          role = adminRow.role.toLowerCase() === "admin" ? "owner" : (adminRow.role.toLowerCase() as AdminRole);
        }
      } catch {}
    }

    // 3. Check profiles table
    if (!role) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role && ALLOWED_ADMIN_ROLES.includes(profile.role.toLowerCase())) {
          role = profile.role.toLowerCase() === "admin" ? "owner" : (profile.role.toLowerCase() as AdminRole);
          fullName = profile.full_name || fullName;
        }
      } catch {}
    }

    if (!role) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      role,
      fullName,
    };
  } catch (err) {
    console.error("[Auth] Error validating current user:", err);
    return null;
  }
}

/**
 * Logs out current admin from Supabase session
 */
export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error("[Auth] Error in signOutAction:", err);
  }

  redirect("/admin/login");
}
