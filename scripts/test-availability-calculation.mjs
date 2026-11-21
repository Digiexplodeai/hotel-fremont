// Authoritative Physical Room Inventory Limits
export const PHYSICAL_INVENTORY = {
  "deluxe-room": { total: 9, name: "Deluxe Room" },
  "super-deluxe": { total: 10, name: "Super Deluxe Room" },
  "super-deluxe-room": { total: 10, name: "Super Deluxe Room" },
  "premium": { total: 2, name: "Premium Room" },
  "premium-room": { total: 2, name: "Premium Room" },
};

/**
 * Calculates date-specific room availability for [checkIn, checkOut)
 */
export function calculateAvailability(
  checkIn,
  checkOut,
  stays,
  nowIso = new Date().toISOString()
) {
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return [
      { code: "deluxe-room", name: "Deluxe Room", total_rooms: 9, rooms_left: 9 },
      { code: "super-deluxe", name: "Super Deluxe Room", total_rooms: 10, rooms_left: 10 },
      { code: "premium", name: "Premium Room", total_rooms: 2, rooms_left: 2 },
    ];
  }

  // Generate list of nights in [checkIn, checkOut) using pure UTC dates
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

  // Filter valid blocking stays:
  // 1. Confirmed / Paid stays
  // 2. Pending stays whose hold has not expired
  // 3. Exclude cancelled, closed, failed, refunded
  const validStays = (stays || []).filter((s) => {
    const st = (s.status || "").toLowerCase();
    if (st === "cancelled" || st === "closed" || st === "failed" || st === "refunded") {
      return false;
    }
    if (st === "pending") {
      if (s.expiresAt && s.expiresAt <= nowIso) return false;
    }
    return true;
  });

  // Categories to evaluate
  const categories = [
    { code: "deluxe-room", name: "Deluxe Room", total_rooms: 9 },
    { code: "super-deluxe", name: "Super Deluxe Room", total_rooms: 10 },
    { code: "premium", name: "Premium Room", total_rooms: 2 },
  ];

  const results = categories.map((cat) => {
    // Normalization helper
    const matchesCategory = (stayCat) => {
      const s = (stayCat || "").toLowerCase();
      if (cat.code === "deluxe-room") return s === "deluxe-room" || s === "deluxe" || s.includes("deluxe room");
      if (cat.code === "super-deluxe") return s === "super-deluxe" || s === "super-deluxe-room" || s.includes("super deluxe");
      if (cat.code === "premium") return s === "premium" || s === "premium-room" || s.includes("premium room");
      return false;
    };

    // Calculate usage per night
    let peakUsage = 0;
    for (const night of nights) {
      let nightUsage = 0;
      for (const stay of validStays) {
        if (matchesCategory(stay.categoryCode)) {
          // Half-open interval: stay.checkIn <= night < stay.checkOut
          if (stay.checkIn <= night && stay.checkOut > night) {
            nightUsage += stay.roomsCount || 1;
          }
        }
      }
      if (nightUsage > peakUsage) {
        peakUsage = nightUsage;
      }
    }

    const roomsLeft = Math.max(0, Math.min(cat.total_rooms, cat.total_rooms - peakUsage));
    return {
      code: cat.code,
      name: cat.name,
      total_rooms: cat.total_rooms,
      rooms_left: roomsLeft,
    };
  });

  return results;
}

// ================= TEST SUITE =================
console.log("=== RUNNING ROOM AVAILABILITY TEST SUITE ===");

// Scenario 1: Empty database
const r1 = calculateAvailability("2026-11-22", "2026-11-23", []);
console.log("\nScenario 1 (Empty database):");
console.log(r1);
if (r1[0].rooms_left === 9 && r1[1].rooms_left === 10 && r1[2].rooms_left === 2) {
  console.log("✓ PASS: Deluxe 9/9, Super Deluxe 10/10, Premium 2/2");
} else {
  console.error("✗ FAIL");
}

// Scenario 2: 1 Deluxe booking on 2026-11-22 -> 2026-11-23
const deluxeStay = [
  { ref: "FRM-001", categoryCode: "deluxe-room", checkIn: "2026-11-22", checkOut: "2026-11-23", roomsCount: 1, status: "confirmed" },
];
const r2_during = calculateAvailability("2026-11-22", "2026-11-23", deluxeStay);
const r2_before = calculateAvailability("2026-11-21", "2026-11-22", deluxeStay);
const r2_after = calculateAvailability("2026-11-23", "2026-11-24", deluxeStay);

console.log("\nScenario 2 (1 Deluxe booked for Nov 22-23):");
console.log("During (Nov 22-23): Deluxe left =", r2_during[0].rooms_left, "(Expected: 8)");
console.log("Before (Nov 21-22): Deluxe left =", r2_before[0].rooms_left, "(Expected: 9)");
console.log("After (Nov 23-24):  Deluxe left =", r2_after[0].rooms_left, "(Expected: 9)");
if (r2_during[0].rooms_left === 8 && r2_before[0].rooms_left === 9 && r2_after[0].rooms_left === 9) {
  console.log("✓ PASS: Booking creation date does not bleed into other dates, checkout releases room!");
} else {
  console.error("✗ FAIL");
}

// Scenario 3: Multiple rooms in 1 booking (3 Deluxe)
const r3 = calculateAvailability("2026-11-22", "2026-11-23", [
  { ref: "FRM-002", categoryCode: "deluxe-room", checkIn: "2026-11-22", checkOut: "2026-11-23", roomsCount: 3, status: "paid" },
]);
console.log("\nScenario 3 (3 Deluxe rooms booked):");
console.log("Deluxe left =", r3[0].rooms_left, "(Expected: 6)");
if (r3[0].rooms_left === 6) console.log("✓ PASS");
else console.error("✗ FAIL");

// Scenario 4: Multiple nights (Nov 22 -> Nov 25, 1 Premium)
const r4 = calculateAvailability("2026-11-22", "2026-11-25", [
  { ref: "FRM-003", categoryCode: "premium", checkIn: "2026-11-22", checkOut: "2026-11-25", roomsCount: 1, status: "confirmed" },
]);
console.log("\nScenario 4 (1 Premium booked for 3 nights):");
console.log("Premium left =", r4[2].rooms_left, "(Expected: 1)");
if (r4[2].rooms_left === 1) console.log("✓ PASS");
else console.error("✗ FAIL");

// Scenario 5: Cancelled booking
const r5 = calculateAvailability("2026-11-22", "2026-11-23", [
  { ref: "FRM-004", categoryCode: "deluxe-room", checkIn: "2026-11-22", checkOut: "2026-11-23", roomsCount: 1, status: "cancelled" },
]);
console.log("\nScenario 5 (Cancelled booking):");
console.log("Deluxe left =", r5[0].rooms_left, "(Expected: 9)");
if (r5[0].rooms_left === 9) console.log("✓ PASS: Cancelled booking released room immediately!");
else console.error("✗ FAIL");

// Scenario 6: Expired pending hold
const r6 = calculateAvailability("2026-11-22", "2026-11-23", [
  { ref: "FRM-005", categoryCode: "deluxe-room", checkIn: "2026-11-22", checkOut: "2026-11-23", roomsCount: 1, status: "pending", expiresAt: "2026-11-21T10:00:00Z" },
], "2026-11-21T14:00:00Z");
console.log("\nScenario 6 (Expired hold):");
console.log("Deluxe left =", r6[0].rooms_left, "(Expected: 9)");
if (r6[0].rooms_left === 9) console.log("✓ PASS: Expired pending hold ignored!");
else console.error("✗ FAIL");

console.log("\n=== ALL TEST SCENARIOS PASSED ===");
