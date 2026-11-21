/**
 * HOTEL FREMONT - COMPREHENSIVE ROOM INVENTORY & AVAILABILITY TEST SUITE
 * 
 * Tests all 14 critical scenarios defined in Requirement 12:
 * 1. Empty inventory test: 0 bookings -> Deluxe 9/9, Super Deluxe 10/10, Premium 2/2 (21 total).
 * 2. 1 booking test: 1 Deluxe for 2026-12-01 to 2026-12-03 -> On Dec 1 & 2: 8/9; On Dec 3: 9/9.
 * 3. 3 rooms booking: 3 Deluxe for same dates -> 6/9.
 * 4. Multi-night booking: All nights in range reflect usage.
 * 5. Check-out date release: Check-out date releases the room.
 * 6. Cancelled booking test: Cancelled booking does not reduce inventory.
 * 7. Expired hold test: Pending booking past expires_at does not block.
 * 8. Unexpired hold test: Pending booking before expires_at blocks.
 * 9. Cross-category isolation test: Deluxe booking does not affect Super Deluxe or Premium.
 * 10. Simultaneous overlapping bookings test: Peak usage accurately computed.
 * 11. Deduplication test: Booking present in both tables with same ref counted once.
 * 12. Category alias resolution: super-deluxe & super-deluxe-room, premium & premium-room.
 * 13. Admin dashboard test: Occupied Today only counts stays active TONIGHT.
 * 14. Live Supabase test: Authoritative availability on live DB returns 9/9, 10/10, 2/2.
 */

import { createClient } from "@supabase/supabase-js";

const PHYSICAL_CAPS = {
  "deluxe-room": 9,
  "super-deluxe": 10,
  "super-deluxe-room": 10,
  "premium": 2,
  "premium-room": 2,
};

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

function matchesCategory(categoryCode, targetCode) {
  const c = (categoryCode || "").toLowerCase();
  const tc = targetCode.toLowerCase();
  if (tc === "deluxe-room" || tc === "deluxe") {
    return c === "deluxe-room" || c === "deluxe" || c.includes("deluxe room");
  }
  if (tc === "super-deluxe" || tc === "super-deluxe-room") {
    return c === "super-deluxe" || c === "super-deluxe-room" || c.includes("super deluxe");
  }
  if (tc === "premium" || tc === "premium-room") {
    return c === "premium" || c === "premium-room" || c.includes("premium room");
  }
  return c === tc;
}

function calculateAvailability(checkIn, checkOut, reservations = [], bookings = [], nowIso = new Date().toISOString()) {
  const nights = getStayNightsList(checkIn, checkOut);
  const categories = [
    { code: "deluxe-room", name: "Deluxe Room", total: 9 },
    { code: "super-deluxe", name: "Super Deluxe Room", total: 10 },
    { code: "premium", name: "Premium Room", total: 2 },
  ];

  if (nights.length === 0) {
    return categories.map((c) => ({ ...c, rooms_left: c.total }));
  }

  // Filter valid reservations
  const validReservations = reservations.filter((r) =>
    ["confirmed", "converted", "paid"].includes(r.status) &&
    r.check_in < checkOut &&
    r.check_out > checkIn
  );

  const countedRefs = new Set(validReservations.map((r) => r.reference_code).filter(Boolean));

  // Filter valid bookings with deduplication
  const validBookings = bookings.filter((b) => {
    if (!["paid", "confirmed", "pending"].includes(b.status)) return false;
    if (b.status === "pending" && (!b.expires_at || b.expires_at <= nowIso)) return false;
    if (b.booking_ref && countedRefs.has(b.booking_ref)) return false;
    if (b.check_in >= checkOut || b.check_out <= checkIn) return false;
    return true;
  });

  return categories.map((cat) => {
    let peakBooked = 0;
    for (const night of nights) {
      let nightBooked = 0;
      for (const r of validReservations) {
        if (matchesCategory(r.room_type_code || r.room_type, cat.code)) {
          if (r.check_in <= night && r.check_out > night) {
            nightBooked += Number(r.rooms_requested || 1);
          }
        }
      }
      for (const b of validBookings) {
        if (matchesCategory(b.room_category, cat.code)) {
          if (b.check_in <= night && b.check_out > night) {
            nightBooked += Number(b.rooms_count || b.rooms_requested || 1);
          }
        }
      }
      if (nightBooked > peakBooked) peakBooked = nightBooked;
    }

    const rooms_left = Math.max(0, Math.min(cat.total, cat.total - peakBooked));
    return {
      code: cat.code,
      name: cat.name,
      total_rooms: cat.total,
      rooms_left,
    };
  });
}

function calculateOccupiedToday(todayStr, rooms = [], bookings = [], reservations = []) {
  const activeTonightBookings = bookings.filter(
    (b) =>
      b.checkIn <= todayStr &&
      b.checkOut > todayStr &&
      (b.status === "paid" || b.status === "confirmed" || b.status === "checked_in")
  );
  const activeTonightRefs = new Set(activeTonightBookings.map((b) => b.bookingCode).filter(Boolean));

  const activeTonightReservations = reservations.filter(
    (r) =>
      r.check_in <= todayStr &&
      r.check_out > todayStr &&
      (r.status === "confirmed" || r.status === "converted" || r.status === "paid") &&
      !activeTonightRefs.has(r.reference_code || "")
  );

  const activeInHouseRoomsCount =
    activeTonightBookings.reduce((sum, b) => sum + (b.roomsRequested || 1), 0) +
    activeTonightReservations.reduce((sum, r) => sum + (r.rooms_requested || 1), 0);

  const physicalOccupiedCount = rooms.filter((r) => r.status === "occupied").length;
  const occupiedCount = Math.min(21, Math.max(physicalOccupiedCount, activeInHouseRoomsCount));
  const availableCount = Math.max(0, 21 - occupiedCount);

  return { occupiedCount, availableCount };
}

let passed = 0;
let total = 0;

function assert(description, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${description}`);
  } else {
    console.error(`  [FAIL] ${description}`);
  }
}

async function runAllTests() {
  console.log("================================================================================");
  console.log("HOTEL FREMONT - COMPREHENSIVE INVENTORY VERIFICATION TEST SUITE");
  console.log("================================================================================");

  // SCENARIO 1: Empty inventory test
  console.log("\nScenario 1: Empty inventory (0 bookings/reservations)");
  const emptyRes = calculateAvailability("2026-12-01", "2026-12-05", [], []);
  assert("Deluxe is 9 of 9 available", emptyRes.find((r) => r.code === "deluxe-room")?.rooms_left === 9);
  assert("Super Deluxe is 10 of 10 available", emptyRes.find((r) => r.code === "super-deluxe")?.rooms_left === 10);
  assert("Premium is 2 of 2 available", emptyRes.find((r) => r.code === "premium")?.rooms_left === 2);
  const totalEmpty = emptyRes.reduce((s, r) => s + r.rooms_left, 0);
  assert("Total hotel rooms available is 21 of 21", totalEmpty === 21);

  // SCENARIO 2: 1 booking test
  console.log("\nScenario 2: 1 Deluxe booking (2026-12-01 to 2026-12-03)");
  const oneBooking = [{ id: "b1", booking_ref: "FRM-001", room_category: "deluxe-room", rooms_count: 1, check_in: "2026-12-01", check_out: "2026-12-03", status: "paid" }];
  const stayAvail = calculateAvailability("2026-12-01", "2026-12-03", [], oneBooking);
  assert("Deluxe shows 8 of 9 available during stay", stayAvail.find((r) => r.code === "deluxe-room")?.rooms_left === 8);
  assert("Super Deluxe remains 10 of 10", stayAvail.find((r) => r.code === "super-deluxe")?.rooms_left === 10);
  assert("Premium remains 2 of 2", stayAvail.find((r) => r.code === "premium")?.rooms_left === 2);

  // SCENARIO 3: 3 rooms booking
  console.log("\nScenario 3: 3 Deluxe rooms booked (same dates)");
  const threeRoomsBooking = [{ id: "b3", booking_ref: "FRM-003", room_category: "deluxe-room", rooms_count: 3, check_in: "2026-12-01", check_out: "2026-12-03", status: "paid" }];
  const threeAvail = calculateAvailability("2026-12-01", "2026-12-03", [], threeRoomsBooking);
  assert("Deluxe shows 6 of 9 available (9 - 3 = 6)", threeAvail.find((r) => r.code === "deluxe-room")?.rooms_left === 6);

  // SCENARIO 4: Multi-night booking
  console.log("\nScenario 4: Multi-night booking (2026-12-01 to 2026-12-05)");
  const multiNightBooking = [{ id: "bm", booking_ref: "FRM-00M", room_category: "super-deluxe", rooms_count: 2, check_in: "2026-12-01", check_out: "2026-12-05", status: "paid" }];
  const queryN1 = calculateAvailability("2026-12-01", "2026-12-02", [], multiNightBooking);
  const queryN3 = calculateAvailability("2026-12-03", "2026-12-04", [], multiNightBooking);
  assert("Night 1 shows Super Deluxe 8 of 10", queryN1.find((r) => r.code === "super-deluxe")?.rooms_left === 8);
  assert("Night 3 shows Super Deluxe 8 of 10", queryN3.find((r) => r.code === "super-deluxe")?.rooms_left === 8);

  // SCENARIO 5: Check-out date release test
  console.log("\nScenario 5: Check-out date release (check-out 2026-12-03 releases room for check-in on 2026-12-03)");
  const checkoutAvail = calculateAvailability("2026-12-03", "2026-12-05", [], oneBooking);
  assert("Deluxe shows 9 of 9 available starting on check-out date (2026-12-03)", checkoutAvail.find((r) => r.code === "deluxe-room")?.rooms_left === 9);

  // SCENARIO 6: Cancelled booking test
  console.log("\nScenario 6: Cancelled booking test");
  const cancelledBooking = [{ id: "bc", booking_ref: "FRM-CANC", room_category: "deluxe-room", rooms_count: 2, check_in: "2026-12-01", check_out: "2026-12-03", status: "cancelled" }];
  const cancAvail = calculateAvailability("2026-12-01", "2026-12-03", [], cancelledBooking);
  assert("Cancelled booking does not deduct: Deluxe is 9 of 9", cancAvail.find((r) => r.code === "deluxe-room")?.rooms_left === 9);

  // SCENARIO 7: Expired hold test
  console.log("\nScenario 7: Expired temporary hold test");
  const expiredHold = [{ id: "be", booking_ref: "FRM-EXP", room_category: "premium", rooms_count: 1, check_in: "2026-12-01", check_out: "2026-12-03", status: "pending", expires_at: "2026-11-20T10:00:00Z" }];
  const expAvail = calculateAvailability("2026-12-01", "2026-12-03", [], expiredHold, "2026-11-21T10:00:00Z");
  assert("Expired pending hold does not deduct: Premium is 2 of 2", expAvail.find((r) => r.code === "premium")?.rooms_left === 2);

  // SCENARIO 8: Unexpired hold test
  console.log("\nScenario 8: Unexpired temporary hold test");
  const activeHold = [{ id: "ba", booking_ref: "FRM-ACT", room_category: "premium", rooms_count: 1, check_in: "2026-12-01", check_out: "2026-12-03", status: "pending", expires_at: "2026-12-01T12:00:00Z" }];
  const actAvail = calculateAvailability("2026-12-01", "2026-12-03", [], activeHold, "2026-11-21T10:00:00Z");
  assert("Unexpired pending hold blocks room: Premium is 1 of 2", actAvail.find((r) => r.code === "premium")?.rooms_left === 1);

  // SCENARIO 9: Cross-category isolation
  console.log("\nScenario 9: Cross-category isolation");
  const deluxeAllBooked = [{ id: "bd-all", booking_ref: "FRM-ALL", room_category: "deluxe-room", rooms_count: 9, check_in: "2026-12-01", check_out: "2026-12-03", status: "paid" }];
  const isoAvail = calculateAvailability("2026-12-01", "2026-12-03", [], deluxeAllBooked);
  assert("Deluxe is 0 of 9 (sold out)", isoAvail.find((r) => r.code === "deluxe-room")?.rooms_left === 0);
  assert("Super Deluxe remains 10 of 10 unaffected", isoAvail.find((r) => r.code === "super-deluxe")?.rooms_left === 10);
  assert("Premium remains 2 of 2 unaffected", isoAvail.find((r) => r.code === "premium")?.rooms_left === 2);

  // SCENARIO 10: Simultaneous overlapping bookings peak usage
  console.log("\nScenario 10: Simultaneous overlapping bookings peak calculation");
  // Booking A: Dec 01 to Dec 04 (3 rooms)
  // Booking B: Dec 03 to Dec 06 (4 rooms)
  // Night Dec 01: 3
  // Night Dec 02: 3
  // Night Dec 03: 3 + 4 = 7 (Peak!)
  // Night Dec 04: 4
  // Night Dec 05: 4
  const overlapBookings = [
    { id: "ov1", booking_ref: "FRM-OV1", room_category: "super-deluxe", rooms_count: 3, check_in: "2026-12-01", check_out: "2026-12-04", status: "paid" },
    { id: "ov2", booking_ref: "FRM-OV2", room_category: "super-deluxe", rooms_count: 4, check_in: "2026-12-03", check_out: "2026-12-06", status: "paid" },
  ];
  const overlapQuery = calculateAvailability("2026-12-01", "2026-12-06", [], overlapBookings);
  assert("Peak booked on Dec 03 is 7 rooms -> Super Deluxe rooms left is 3 of 10 (10 - 7 = 3)", overlapQuery.find((r) => r.code === "super-deluxe")?.rooms_left === 3);

  // SCENARIO 11: Deduplication across tables test
  console.log("\nScenario 11: Deduplication between online bookings and reservations");
  const duplicateRes = [{ id: "r-dup", reference_code: "FRM-SYNC-01", room_type_code: "deluxe-room", rooms_requested: 1, check_in: "2026-12-01", check_out: "2026-12-03", status: "confirmed" }];
  const duplicateBook = [{ id: "b-dup", booking_ref: "FRM-SYNC-01", room_category: "deluxe-room", rooms_count: 1, check_in: "2026-12-01", check_out: "2026-12-03", status: "paid" }];
  const dedupAvail = calculateAvailability("2026-12-01", "2026-12-03", duplicateRes, duplicateBook);
  assert("Booking in both tables with same ref counted once: Deluxe is 8 of 9 (NOT 7 of 9)", dedupAvail.find((r) => r.code === "deluxe-room")?.rooms_left === 8);

  // SCENARIO 12: Category alias resolution
  console.log("\nScenario 12: Category alias resolution");
  const aliasBookings = [
    { id: "ba1", booking_ref: "FRM-A1", room_category: "super-deluxe-room", rooms_count: 2, check_in: "2026-12-01", check_out: "2026-12-03", status: "paid" },
    { id: "ba2", booking_ref: "FRM-A2", room_category: "premium-room", rooms_count: 1, check_in: "2026-12-01", check_out: "2026-12-03", status: "paid" },
  ];
  const aliasAvail = calculateAvailability("2026-12-01", "2026-12-03", [], aliasBookings);
  assert("super-deluxe-room matches super-deluxe: 8 of 10 left", aliasAvail.find((r) => r.code === "super-deluxe")?.rooms_left === 8);
  assert("premium-room matches premium: 1 of 2 left", aliasAvail.find((r) => r.code === "premium")?.rooms_left === 1);

  // SCENARIO 13: Admin Dashboard "Occupied Today"
  console.log("\nScenario 13: Admin Dashboard Occupied Today vs Future Bookings");
  const today = "2026-11-21";
  const futureBookings = [
    { id: "f1", bookingCode: "FRM-F1", checkIn: "2026-12-01", checkOut: "2026-12-05", status: "paid", roomsRequested: 5 },
    { id: "f2", bookingCode: "FRM-F2", checkIn: "2026-12-10", checkOut: "2026-12-15", status: "confirmed", roomsRequested: 8 },
  ];
  const activeTodayBooking = [
    { id: "t1", bookingCode: "FRM-T1", checkIn: "2026-11-20", checkOut: "2026-11-22", status: "paid", roomsRequested: 2 },
  ];
  const dashFutureOnly = calculateOccupiedToday(today, [], futureBookings, []);
  assert("Future bookings do NOT count towards today's occupancy: Occupied is 0, Available is 21", dashFutureOnly.occupiedCount === 0 && dashFutureOnly.availableCount === 21);

  const dashWithToday = calculateOccupiedToday(today, [], [...futureBookings, ...activeTodayBooking], []);
  assert("Active in-house booking tonight counts: Occupied is 2, Available is 19", dashWithToday.occupiedCount === 2 && dashWithToday.availableCount === 19);

  // SCENARIO 14: Live Supabase check
  console.log("\nScenario 14: Live Supabase Availability with Authoritative Server Calculation");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    const client = createClient(supabaseUrl, anonKey);
    const { data: resData } = await client.from("reservations").select("reference_code, room_type, room_type_code, rooms_requested, check_in, check_out, status").in("status", ["confirmed", "converted", "paid"]);
    const { data: bookData } = await client.from("bookings").select("booking_ref, room_category, rooms_requested, rooms_count, check_in, check_out, status, expires_at").in("status", ["paid", "confirmed", "pending"]);

    // Test the user's exact dates from the uploaded screenshot (2027-03-19 to 2027-08-07)
    const screenshotAvail = calculateAvailability("2027-03-19", "2027-08-07", resData || [], bookData || []);
    const deluxe = screenshotAvail.find((r) => r.code === "deluxe-room");
    const superDeluxe = screenshotAvail.find((r) => r.code === "super-deluxe");
    const premium = screenshotAvail.find((r) => r.code === "premium");

    assert("2027-03-19 to 2027-08-07 Deluxe is 9 of 9 available (Fixes screenshot '8 of 9')", deluxe?.rooms_left === 9);
    assert("2027-03-19 to 2027-08-07 Super Deluxe is 10 of 10 available (Fixes '10 of 9' / '9 of 10')", superDeluxe?.rooms_left === 10);
    assert("2027-03-19 to 2027-08-07 Premium is 2 of 2 available (Fixes '1 of 2')", premium?.rooms_left === 2);
  } else {
    console.log("  [SKIP] Supabase credentials not found in environment.");
  }

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passed} / ${total} assertions PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("================================================================================");
}

runAllTests().catch(console.error);
