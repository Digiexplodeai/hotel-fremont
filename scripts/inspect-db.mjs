import { createClient } from "@supabase/supabase-js";

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tables = ["bookings", "reservations", "enquiries", "rooms", "site_content", "audit_logs", "guests", "admin_users"];
  for (const t of tables) {
    try {
      const { data, error, count } = await supabase.from(t).select("*", { count: "exact", head: false }).limit(5);
      if (error) {
        console.log(`Table '${t}': NOT FOUND / ERROR -> ${error.message}`);
      } else {
        console.log(`Table '${t}': EXISTS (${count} rows)`);
        if (data && data.length > 0) {
          console.log(`  Columns for '${t}':`, Object.keys(data[0]));
        }
      }
    } catch (e) {
      console.log(`Table '${t}': exception -> ${e.message}`);
    }
  }
}

run();
