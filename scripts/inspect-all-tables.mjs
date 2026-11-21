import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("=== Checking all tables and potential inventory sources ===");
  const tables = [
    "room_types",
    "rooms",
    "site_settings",
    "bookings",
    "reservations",
    "facilities",
    "venues",
    "nearby_places",
    "image_slots",
    "room_blocks",
    "inventory_blocks",
    "maintenance_blocks",
  ];

  for (const t of tables) {
    const { data, error, count } = await supabase.from(t).select("*", { count: "exact" });
    if (error) {
      console.log(`Table '${t}': Error ->`, error.message);
    } else {
      console.log(`Table '${t}': EXISTS (${count} rows)`);
      if (t === "site_settings") {
        console.log("site_settings rows:", data);
      }
      if (t === "rooms" && data.length > 0) {
        console.log("rooms rows:", data);
      }
    }
  }

  // Let's test calling RPC get_room_availability with various date parameters
  console.log("\n=== Testing RPC with 1-day range tomorrow ===");
  const res1 = await supabase.rpc("get_room_availability", {
    p_check_in: "2026-11-22",
    p_check_out: "2026-11-23",
  });
  console.log("res1 (2026-11-22 -> 2026-11-23):", res1.data);

  console.log("\n=== Testing RPC with NULL dates ===");
  const resNull = await supabase.rpc("get_room_availability", {
    p_check_in: null,
    p_check_out: null,
  });
  console.log("resNull:", resNull.data);
}

main();
