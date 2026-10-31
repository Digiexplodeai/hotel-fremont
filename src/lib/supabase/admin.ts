import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, getSupabaseAnonKey } from "./client";

export function createAdminSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = getSupabaseAnonKey();

  const activeKey = serviceRoleKey || anonKey;
  if (!activeKey) {
    return null;
  }

  if (!serviceRoleKey) {
    console.warn(
      "[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not set. Operating with anon key (requires RLS policy on image_slots)."
    );
  }

  return createClient(url, activeKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

