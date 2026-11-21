import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import fs from "fs";

// Parse .env.local
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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function getStayNightsList(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return [];
  const [inY, inM, inD] = checkIn.split("-").map(Number);
  const [outY, outM, outD] = checkOut.split("-").map(Number);
  const dIn = new Date(Date.UTC(inY, inM - 1, inD));
  const dOut = new Date(Date.UTC(outY, outM - 1, outD));
  const diffDays = Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24));
  const nights = [];
  for (let i = 0; i < diffDays; i++) {
    const cur = new Date(dIn);
    cur.setUTCDate(cur.getUTCDate() + i);
    nights.push(cur.toISOString().slice(0, 10));
  }
  return nights;
}

async function testGetRoomAvailabilityAction(checkIn, checkOut) {
  const nights = getStayNightsList(checkIn, checkOut);

  const baselineInventory = [
    { code: "deluxe-room", name: "Deluxe Room", price_per_night: 2299, total_rooms: 9, max_guests: 2 },
    { code: "super-deluxe", name: "Super Deluxe Room", price_per_night: 3299, total_rooms: 10, max_guests: 2 },
    { code: "premium", name: "Premium Room", price_per_night: 4299, total_rooms: 2, max_guests: 2 },
  ];

  if (nights.length === 0) {
    return baselineInventory.map((item) => ({ ...item, rooms_left: item.total_rooms }));
  }

  const client = createSupabaseClient(supabaseUrl, anonKey);
  const nowIso = new Date().toISOString();

  const { data: rtData } = await client
    .from("room_types")
    .select("code, name, price_per_night, total_rooms, rooms_total, max_guests")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: resData } = await client
    .from("reservations")
    .select("id, reference_code, room_type, room_type_code, rooms_requested, check_in, check_out, status")
    .in("status", ["confirmed", "converted", "paid"])
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  const { data: bookData } = await client
    .from("bookings")
    .select("id, booking_ref, room_category, rooms_requested, rooms_count, check_in, check_out, status, expires_at")
    .in("status", ["paid", "confirmed", "pending"])
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  const reservationsList = resData || [];
  const countedRefs = new Set(reservationsList.map((r) => r.reference_code).filter(Boolean));

  const validBookings = (bookData || []).filter((b) => {
    if (b.status === "pending") {
      if (!b.expires_at || b.expires_at <= nowIso) return false;
    }
    if (b.booking_ref && countedRefs.has(b.booking_ref)) {
      return false;
    }
    return true;
  });

  const matchesCategory = (categoryCode, targetCode, targetName) => {
    const c = (categoryCode || "").toLowerCase();
    const tc = targetCode.toLowerCase();
    const tn = targetName.toLowerCase();

    if (tc === "deluxe-room" || tc === "deluxe") {
      return c === "deluxe-room" || c === "deluxe" || c.includes("deluxe room");
    }
    if (tc === "super-deluxe" || tc === "super-deluxe-room") {
      return c === "super-deluxe" || c === "super-deluxe-room" || c.includes("super deluxe");
    }
    if (tc === "premium" || tc === "premium-room") {
      return c === "premium" || c === "premium-room" || c.includes("premium room");
    }
    return c === tc || c === tn;
  };

  const finalCategories = (rtData && rtData.length > 0 ? rtData : baselineInventory).map((row) => {
    const code = row.code;
    const name = row.name;
    const price_per_night = Number(row.price_per_night || 2299);
    const max_guests = Number(row.max_guests || 2);

    let physicalKeys = 9;
    if (code === "deluxe-room" || code === "deluxe") physicalKeys = 9;
    else if (code === "super-deluxe" || code === "super-deluxe-room") physicalKeys = 10;
    else if (code === "premium" || code === "premium-room") physicalKeys = 2;
    else physicalKeys = Number(row.rooms_total || row.total_rooms || 1);

    let peakBooked = 0;
    for (const night of nights) {
      let nightBooked = 0;

      for (const res of reservationsList) {
        const resCat = res.room_type_code || res.room_type || "";
        if (matchesCategory(resCat, code, name)) {
          if (res.check_in <= night && res.check_out > night) {
            nightBooked += Number(res.rooms_requested || 1);
          }
        }
      }

      for (const b of validBookings) {
        const bookCat = b.room_category || "";
        if (matchesCategory(bookCat, code, name)) {
          if (b.check_in <= night && b.check_out > night) {
            nightBooked += Number(b.rooms_count || b.rooms_requested || 1);
          }
        }
      }

      if (nightBooked > peakBooked) {
        peakBooked = nightBooked;
      }
    }

    const rooms_left = Math.max(0, Math.min(physicalKeys, physicalKeys - peakBooked));

    return {
      code,
      name,
      price_per_night,
      total_rooms: physicalKeys,
      rooms_left,
      max_guests,
    };
  });

  return finalCategories;
}

async function run() {
  console.log("=== Testing Authoritative Availability Calculation Against Live Database ===");

  console.log("\n1. Test for Tomorrow [2026-11-22 -> 2026-11-23]:");
  const a1 = await testGetRoomAvailabilityAction("2026-11-22", "2026-11-23");
  console.table(a1);

  console.log("\n2. Test for 2027 Dates from Screenshot [2027-03-19 -> 2027-08-07]:");
  const a2 = await testGetRoomAvailabilityAction("2027-03-19", "2027-08-07");
  console.table(a2);

  const deluxe = a1.find((c) => c.code === "deluxe-room");
  const superDeluxe = a1.find((c) => c.code === "super-deluxe" || c.code === "super-deluxe-room");
  const premium = a1.find((c) => c.code === "premium" || c.code === "premium-room");

  console.log("\n--- VERIFICATION CHECKS ---");
  console.log(`Deluxe: ${deluxe.rooms_left} of ${deluxe.total_rooms} (Expected: 9 of 9) -> ${deluxe.rooms_left === 9 ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`Super Deluxe: ${superDeluxe.rooms_left} of ${superDeluxe.total_rooms} (Expected: 10 of 10) -> ${superDeluxe.rooms_left === 10 ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`Premium: ${premium.rooms_left} of ${premium.total_rooms} (Expected: 2 of 2) -> ${premium.rooms_left === 2 ? "✓ PASS" : "✗ FAIL"}`);
}

run();
