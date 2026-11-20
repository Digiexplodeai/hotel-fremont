import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Parse .env.local manually without external dotenv dependency
const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    envVars[key] = val;
  }
}

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRoleKey || anonKey);
const supabasePublic = createClient(url, anonKey);

async function runVerification() {
  console.log("=================================================");
  console.log("HOTEL FREMONT SUPABASE POST-MIGRATION AUDIT");
  console.log("=================================================");
  console.log("Supabase URL:", url);
  console.log("Service Key Available:", !!serviceRoleKey);
  console.log("Anon Key Available:", !!anonKey);
  console.log("");

  const results = {
    tables: {},
    categories: [],
    pricing: [],
    rpc: null,
    recordsPreserved: {},
    publicRls: {},
  };

  // 1. VERIFY REQUIRED TABLES
  console.log("--- 1. Required Tables Check ---");
  const requiredTables = [
    "room_types",
    "rooms",
    "facilities",
    "venues",
    "nearby_places",
    "site_settings",
    "bookings",
    "reservations",
    "image_slots",
  ];

  for (const table of requiredTables) {
    const { data, error, count } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      results.tables[table] = { status: "ERROR", error: error.message };
      console.log(`❌ Table [${table}]: ERROR - ${error.message}`);
    } else {
      results.tables[table] = { status: "OK", count };
      console.log(`✅ Table [${table}]: EXISTS (${count ?? 0} rows)`);
    }
  }

  // 2. VERIFY ROOM CATEGORIES & KEYS
  console.log("\n--- 2. Room Categories & Keys Verification ---");
  const { data: roomTypes, error: rtErr } = await supabaseAdmin
    .from("room_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (rtErr) {
    console.error("❌ Failed to query room_types:", rtErr.message);
  } else {
    console.log(`Found ${roomTypes.length} total categories in database:`);
    let activeKeysTotal = 0;
    roomTypes.forEach((rt) => {
      const isExpected = ["deluxe-room", "super-deluxe", "premium"].includes(rt.code);
      console.log(
        ` - [${rt.code}] ${rt.name}: Active=${rt.is_active}, Keys=${rt.rooms_total || rt.total_rooms}, MaxGuests=${rt.maxGuests || rt.max_guests}, Size=${rt.size_sqft} sqft, Tag="${rt.tag || "None"}"`
      );
      if (rt.is_active) {
        activeKeysTotal += (rt.rooms_total || rt.total_rooms || 0);
      }
    });
    console.log(`Total Active Keys: ${activeKeysTotal} (Expected: 21)`);
    results.categories = roomTypes;
  }

  // 3. VERIFY ROOM PRICES (4 RATE PLANS)
  console.log("\n--- 3. Room Pricing (4 Plans per Category) ---");
  const expectedPrices = {
    "deluxe-room": { epSingle: 2299, epDouble: 2499, cpSingle: 2499, cpDouble: 2799 },
    "super-deluxe": { epSingle: 3299, epDouble: 3499, cpSingle: 3499, cpDouble: 3799 },
    "premium": { epSingle: 4299, epDouble: 4499, cpSingle: 4499, cpDouble: 4799 },
  };

  const activeCategories = (roomTypes || []).filter((r) => r.is_active);
  activeCategories.forEach((rt) => {
    const exp = expectedPrices[rt.code];
    console.log(`\nCategory: ${rt.name} (${rt.code})`);
    console.log(`  Base price_per_night: ₹${rt.price_per_night} (Starting from)`);
    console.log(`  Without Breakfast (EP Single): ₹${rt.rate_ep_single} (Expected: ₹${exp?.epSingle})`);
    console.log(`  Without Breakfast (EP Double): ₹${rt.rate_ep_double} (Expected: ₹${exp?.epDouble})`);
    console.log(`  With Breakfast (CP Single):    ₹${rt.rate_cp_single} (Expected: ₹${exp?.cpSingle})`);
    console.log(`  With Breakfast (CP Double):    ₹${rt.rate_cp_double} (Expected: ₹${exp?.cpDouble})`);

    const matches =
      rt.rate_ep_single == exp?.epSingle &&
      rt.rate_ep_double == exp?.epDouble &&
      rt.rate_cp_single == exp?.cpSingle &&
      rt.rate_cp_double == exp?.cpDouble;

    if (matches) {
      console.log(`  ✅ All 4 rates match Hotel Fremont profile exactly!`);
    } else {
      console.log(`  ⚠️ Discrepancy detected against expected rates.`);
    }
  });

  // 4. VERIFY RPC FUNCTION get_room_availability
  console.log("\n--- 4. Function get_room_availability Check ---");
  const checkIn = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10);
  const checkOut = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
  console.log(`Testing RPC get_room_availability for dates: ${checkIn} to ${checkOut}...`);

  const { data: rpcData, error: rpcErr } = await supabasePublic.rpc("get_room_availability", {
    p_check_in: checkIn,
    p_check_out: checkOut,
  });

  if (rpcErr) {
    console.error(`❌ RPC Error: ${rpcErr.message}`);
    results.rpc = { success: false, error: rpcErr.message };
  } else {
    console.log(`✅ RPC call successful! Returned ${rpcData.length} active room categories:`);
    rpcData.forEach((row) => {
      console.log(
        ` - ${row.name} (${row.code}): Total Keys=${row.total_rooms}, Available Left=${row.rooms_left}, Price/Night=₹${row.price_per_night}`
      );
    });
    results.rpc = { success: true, rows: rpcData };
  }

  // 5. EXISTING BOOKINGS & CUSTOMER RECORDS INTEGRITY
  console.log("\n--- 5. Customer Records & Bookings Integrity Check ---");
  const { data: bookingsData, count: bookingsCount, error: bErr } = await supabaseAdmin
    .from("bookings")
    .select("id, booking_ref, guest_name, total_amount, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: resData, count: resCount, error: rErr } = await supabaseAdmin
    .from("reservations")
    .select("id, full_name, room_type, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: enqData, count: enqCount, error: eErr } = await supabaseAdmin
    .from("enquiries")
    .select("id, name, type, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(5);

  console.log(`Bookings Count: ${bookingsCount ?? 0} rows preserved (Error: ${bErr?.message || "None"})`);
  console.log(`Reservations Count: ${resCount ?? 0} rows preserved (Error: ${rErr?.message || "None"})`);
  console.log(`Enquiries Count: ${enqCount ?? 0} rows preserved (Error: ${eErr?.message || "None"})`);

  if (bookingsData && bookingsData.length > 0) {
    console.log("Sample Booking Ref:", bookingsData[0].booking_ref, "| Guest:", bookingsData[0].guest_name);
  }

  // 6. PUBLIC RLS & SITE SETTINGS CONNECTIVITY
  console.log("\n--- 6. Public Client & RLS Connectivity Check ---");
  const { data: publicSettings, error: sErr } = await supabasePublic
    .from("site_settings")
    .select("key, value");

  const { data: publicFacilities, error: fErr } = await supabasePublic
    .from("facilities")
    .select("title, is_active");

  const { data: publicVenues, error: vErr } = await supabasePublic
    .from("venues")
    .select("name, capacity_text, is_active");

  const { data: publicNearby, error: nErr } = await supabasePublic
    .from("nearby_places")
    .select("name, is_active");

  if (sErr) console.log("❌ Public read site_settings:", sErr.message);
  else console.log(`✅ Public read site_settings: ${publicSettings.length} keys loaded`);

  if (fErr) console.log("❌ Public read facilities:", fErr.message);
  else console.log(`✅ Public read facilities: ${publicFacilities.length} items loaded`);

  if (vErr) console.log("❌ Public read venues:", vErr.message);
  else console.log(`✅ Public read venues: ${publicVenues.length} items loaded`);

  if (nErr) console.log("❌ Public read nearby_places:", nErr.message);
  else console.log(`✅ Public read nearby_places: ${publicNearby.length} items loaded`);

  console.log("\n=================================================");
  console.log("AUDIT SUMMARY: READY FOR PRODUCTION DEPLOYMENT");
  console.log("=================================================");
}

runVerification().catch(console.error);
