import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Replicates the exact logic in src/app/api/availability/route.ts
async function handleAvailabilityApi(checkIn, checkOut) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store",
  };

  const baselineInventory = [
    { code: "deluxe-room", name: "Deluxe Room", price_per_night: 2299, total_rooms: 9, rooms_left: 9, max_guests: 2 },
    { code: "super-deluxe", name: "Super Deluxe Room", price_per_night: 3299, total_rooms: 10, rooms_left: 10, max_guests: 2 },
    { code: "premium", name: "Premium Room", price_per_night: 4299, total_rooms: 2, rooms_left: 2, max_guests: 2 },
  ];

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return { success: true, availability: baselineInventory, headers };
  }

  const client = createSupabaseClient(supabaseUrl, serviceKey || anonKey);

  const { data: rpcData, error: rpcError } = await client.rpc("get_room_availability", {
    p_check_in: checkIn,
    p_check_out: checkOut,
  });

  if (rpcError || !rpcData || !Array.isArray(rpcData)) {
    return { success: false, error: rpcError?.message, availability: baselineInventory, headers };
  }

  const availabilityMap = new Map();

  for (const row of rpcData) {
    const code = String(row.code);
    const name = String(row.name);
    const price_per_night = Number(row.price_per_night || 2299);
    const max_guests = Number(row.max_guests || 2);

    let physicalKeys = 9;
    if (code === "deluxe-room" || code === "deluxe") physicalKeys = 9;
    else if (code === "super-deluxe" || code === "super-deluxe-room") physicalKeys = 10;
    else if (code === "premium" || code === "premium-room") physicalKeys = 2;
    else physicalKeys = Number(row.total_rooms || 1);

    const rawLeft = Number(row.rooms_left !== undefined ? row.rooms_left : physicalKeys);
    const rooms_left = Math.max(0, Math.min(physicalKeys, rawLeft));

    const item = {
      code,
      name,
      price_per_night,
      total_rooms: physicalKeys,
      rooms_left,
      max_guests,
    };

    availabilityMap.set(code, item);

    if (code === "super-deluxe") {
      availabilityMap.set("super-deluxe-room", { ...item, code: "super-deluxe-room" });
    } else if (code === "super-deluxe-room") {
      availabilityMap.set("super-deluxe", { ...item, code: "super-deluxe" });
    } else if (code === "premium") {
      availabilityMap.set("premium-room", { ...item, code: "premium-room" });
    } else if (code === "premium-room") {
      availabilityMap.set("premium", { ...item, code: "premium" });
    }
  }

  return {
    success: true,
    checkIn,
    checkOut,
    availability: Array.from(availabilityMap.values()),
    headers,
  };
}

async function verifyAll() {
  console.log("================================================================================");
  console.log("HOTEL FREMONT - LIVE API & AVAILABILITY SYNCHRONIZATION VERIFICATION");
  console.log("================================================================================");

  // 1. Direct Supabase RPC Call with Anon Client
  console.log("\n[1] Testing Supabase RPC `public.get_room_availability` directly (with anon key):");
  const client = createSupabaseClient(supabaseUrl, anonKey);
  const rpcResult = await client.rpc("get_room_availability", {
    p_check_in: "2026-11-21",
    p_check_out: "2026-11-22",
  });
  console.log("RPC Data:", JSON.stringify(rpcResult.data, null, 2));

  const rpcDeluxe = rpcResult.data?.find((r) => r.code === "deluxe-room");
  const rpcSuper = rpcResult.data?.find((r) => r.code === "super-deluxe");
  const rpcPremium = rpcResult.data?.find((r) => r.code === "premium");

  console.log(`RPC -> Deluxe: ${rpcDeluxe?.rooms_left} of ${rpcDeluxe?.total_rooms}`);
  console.log(`RPC -> Super Deluxe: ${rpcSuper?.rooms_left} of ${rpcSuper?.total_rooms}`);
  console.log(`RPC -> Premium: ${rpcPremium?.rooms_left} of ${rpcPremium?.total_rooms}`);

  // 2. Testing API Route Handler (/api/availability?checkIn=2026-11-21&checkOut=2026-11-22)
  console.log("\n[2] Testing API Route GET /api/availability?checkIn=2026-11-21&checkOut=2026-11-22:");
  const apiJson = await handleAvailabilityApi("2026-11-21", "2026-11-22");
  console.log("API Headers:", apiJson.headers);
  console.log("API Payload:", JSON.stringify(apiJson, null, 2));

  const apiDeluxe = apiJson.availability?.find((r) => r.code === "deluxe-room");
  const apiSuperDeluxe = apiJson.availability?.find((r) => r.code === "super-deluxe");
  const apiSuperDeluxeRoom = apiJson.availability?.find((r) => r.code === "super-deluxe-room");
  const apiPremium = apiJson.availability?.find((r) => r.code === "premium");
  const apiPremiumRoom = apiJson.availability?.find((r) => r.code === "premium-room");

  console.log(`\nAPI -> Deluxe: ${apiDeluxe?.rooms_left} of ${apiDeluxe?.total_rooms}`);
  console.log(`API -> Super Deluxe: ${apiSuperDeluxe?.rooms_left} of ${apiSuperDeluxe?.total_rooms} (alias: ${apiSuperDeluxeRoom?.rooms_left})`);
  console.log(`API -> Premium: ${apiPremium?.rooms_left} of ${apiPremium?.total_rooms} (alias: ${apiPremiumRoom?.rooms_left})`);

  // 3. Testing Next Day (2026-11-22 to 2026-11-23, after FRM-6BE6B9 check-out)
  console.log("\n[3] Testing Next Day (2026-11-22 to 2026-11-23, checkout date releases Deluxe):");
  const apiJson2 = await handleAvailabilityApi("2026-11-22", "2026-11-23");
  const apiDeluxe2 = apiJson2.availability?.find((r) => r.code === "deluxe-room");
  console.log(`API Next Day -> Deluxe: ${apiDeluxe2?.rooms_left} of ${apiDeluxe2?.total_rooms}`);

  // Assertions
  const ok1 = rpcDeluxe?.rooms_left === 8 && rpcDeluxe?.total_rooms === 9;
  const ok2 = apiDeluxe?.rooms_left === 8 && apiDeluxe?.total_rooms === 9;
  const ok3 = apiSuperDeluxe?.rooms_left === 10 && apiSuperDeluxe?.total_rooms === 10;
  const ok4 = apiPremium?.rooms_left === 2 && apiPremium?.total_rooms === 2;
  const ok5 = apiDeluxe2?.rooms_left === 9 && apiDeluxe2?.total_rooms === 9;

  console.log("\n================================================================================");
  if (ok1 && ok2 && ok3 && ok4 && ok5) {
    console.log("SUCCESS: All verification checks PASSED!");
    console.log("Deluxe: 8 of 9 Rooms Available (accounting for FRM-6BE6B9)");
    console.log("Super Deluxe: 10 of 10 Rooms Available");
    console.log("Premium: 2 of 2 Rooms Available");
  } else {
    console.error("FAILURE: Some checks failed.");
    process.exit(1);
  }
  console.log("================================================================================");
}

verifyAll().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
