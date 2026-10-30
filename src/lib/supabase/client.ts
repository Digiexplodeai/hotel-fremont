import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getSupabaseAnonKey();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith("https://") &&
    !url.includes("your-project")
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getSupabaseAnonKey();

  if (!isSupabaseConfigured() || !url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
