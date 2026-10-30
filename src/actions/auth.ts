"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, getAdminSecret } from "@/lib/adminAuth";

export type AdminRole = "owner" | "manager" | "front_desk";

export interface CurrentUser {
  id: string;
  email: string;
  role: AdminRole;
  fullName?: string;
  isFallbackAdmin?: boolean;
}

/**
 * Signs in using Supabase email & password, or falls back to master admin secret
 */
export async function signInAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  role?: AdminRole;
}> {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const masterKey = (formData.get("masterKey") as string)?.trim();

  // 1. Check fallback Master Key first if provided
  const adminSecret = getAdminSecret();
  if (masterKey && masterKey === adminSecret) {
    const cookieStore = await cookies();
    cookieStore.set({
      name: ADMIN_COOKIE_NAME,
      value: adminSecret,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, role: "owner" };
  }

  // Also allow password-only login with master secret
  if (password === adminSecret && (!email || email === "admin@hotelfremont.com")) {
    const cookieStore = await cookies();
    cookieStore.set({
      name: ADMIN_COOKIE_NAME,
      value: adminSecret,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, role: "owner" };
  }

  // 2. Authenticate with Supabase Auth
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return {
        error: "Supabase is not configured yet. You can sign in using the Master Admin Key.",
        success: false,
      };
    }

    if (!email || !password) {
      return { error: "Please enter your email and password.", success: false };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { error: authError?.message || "Invalid email or password.", success: false };
    }

    // Fetch user profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    const role = (profile?.role as AdminRole) || "front_desk";

    return { success: true, role };
  } catch (err: unknown) {
    const e = err as Error;
    return { error: e.message || "Authentication failed.", success: false };
  }
}

/**
 * Returns current authenticated admin user
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();

  // 1. Check fallback session
  const fallbackToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (fallbackToken && fallbackToken === getAdminSecret()) {
    return {
      id: "master-admin",
      email: "owner@hotelfremont.com",
      role: "owner",
      fullName: "Hotel Fremont Owner",
      isFallbackAdmin: true,
    };
  }

  // 2. Check Supabase user
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email || "",
      role: (profile?.role as AdminRole) || "front_desk",
      fullName: profile?.full_name || undefined,
      isFallbackAdmin: false,
    };
  } catch {
    return null;
  }
}

/**
 * Logs out current admin
 */
export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);

  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch {
    // Ignore error on sign out
  }

  redirect("/admin/login");
}
