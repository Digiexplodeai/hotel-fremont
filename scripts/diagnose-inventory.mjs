import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function diagnose() {
  console.log("=================================================");
  console.log("       HOTEL FREMONT INVENTORY DIAGNOSTICS       ");
  console.log("=================================================");

  // 1. Inspect room_types table
  console.log("\n--- 1. ROOM_TYPES IN DATABASE ---");
  const { data: roomTypes, error: rtErr } = await supabase
    .from("room_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (rtErr) {
    console.error("Error querying room_types:", rtErr);
  } else {
    console.table(
      roomTypes.map((rt) => ({
        code: rt.code,
        name: rt.name,
        price_per_night: rt.price_per_night,
        rooms_total: rt.rooms_total,
        total_rooms: rt.total_rooms,
        is_active: rt.is_active,
        sort_order: rt.sort_order,
      }))
    );
  }

  // 2. Inspect physical rooms table (if any)
  console.log("\n--- 2. PHYSICAL ROOMS TABLE ---");
  const { data: physicalRooms, error: prErr } = await supabase
    .from("rooms")
    .select("*");
  if (prErr) {
    console.log("Table 'rooms':", prErr.message);
  } else {
    console.log(`Found ${physicalRooms.length} physical room records in 'rooms' table.`);
  }

  // 3. Inspect bookings table
  console.log("\n--- 3. ALL RECORDS IN 'BOOKINGS' TABLE ---");
  const { data: bookings, error: bErr } = await supabase
    .from("bookings")
    .select("*");

  if (bErr) {
    console.error("Error querying bookings:", bErr);
  } else {
    console.log(`Total bookings in DB: ${bookings.length}`);
    console.table(
      bookings.map((b) => ({
        id: b.id,
        booking_ref: b.booking_ref,
        guest_name: b.guest_name,
        category: b.room_category,
        check_in: b.check_in,
        check_out: b.check_out,
        rooms_count: b.rooms_count,
        rooms_requested: b.rooms_requested,
        status: b.status,
        expires_at: b.expires_at,
        created_at: b.created_at,
      }))
    );
  }

  // 4. Inspect reservations table
  console.log("\n--- 4. ALL RECORDS IN 'RESERVATIONS' TABLE ---");
  const { data: reservations, error: rErr } = await supabase
    .from("reservations")
    .select("*");

  if (rErr) {
    console.error("Error querying reservations:", rErr);
  } else {
    console.log(`Total reservations in DB: ${reservations.length}`);
    console.table(
      reservations.map((r) => ({
        id: r.id,
        ref: r.reference_code,
        name: r.full_name,
        room_type: r.room_type,
        room_type_code: r.room_type_code,
        check_in: r.check_in,
        check_out: r.check_out,
        rooms_requested: r.rooms_requested,
        status: r.status,
        channel: r.channel,
        created_at: r.created_at,
      }))
    );
  }

  // 5. Test RPC get_room_availability for various dates
  console.log("\n--- 5. TEST RPC get_room_availability ---");
  
  // Test A: Tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().slice(0, 10);

  console.log(`\nQuerying RPC for [${tomorrowStr} -> ${dayAfterStr}]:`);
  const { data: rpcA, error: rpcAErr } = await supabase.rpc("get_room_availability", {
    p_check_in: tomorrowStr,
    p_check_out: dayAfterStr,
  });
  if (rpcAErr) console.error("RPC Error A:", rpcAErr);
  else console.table(rpcA);

  // Test B: 2027 dates from user screenshot
  console.log(`\nQuerying RPC for [2027-03-19 -> 2027-08-07] (From User Screenshot):`);
  const { data: rpcB, error: rpcBErr } = await supabase.rpc("get_room_availability", {
    p_check_in: "2027-03-19",
    p_check_out: "2027-08-07",
  });
  if (rpcBErr) console.error("RPC Error B:", rpcBErr);
  else console.table(rpcB);

  // Test C: Far future with no possible bookings
  console.log(`\nQuerying RPC for [2030-01-01 -> 2030-01-02] (Far Future):`);
  const { data: rpcC, error: rpcCErr } = await supabase.rpc("get_room_availability", {
    p_check_in: "2030-01-01",
    p_check_out: "2030-01-02",
  });
  if (rpcCErr) console.error("RPC Error C:", rpcCErr);
  else console.table(rpcC);

  // Test D: Invalid dates (null or backwards)
  console.log(`\nQuerying RPC with invalid dates (same day):`);
  const { data: rpcD, error: rpcDErr } = await supabase.rpc("get_room_availability", {
    p_check_in: "2026-11-22",
    p_check_out: "2026-11-22",
  });
  if (rpcDErr) console.error("RPC Error D:", rpcDErr);
  else console.table(rpcD);
}

diagnose();
