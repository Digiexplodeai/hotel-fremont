import fs from "fs";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  validateBookingStatusTransition,
  packOperationalMetadata,
  unpackOperationalMetadata,
  resolveAuthoritativeStatus,
  type OperationalBookingStatus,
} from "../src/lib/bookingStatusLifecycle.js";

const envContent = fs.readFileSync(".env.local", "utf8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runTests() {
  console.log("=================================================");
  console.log("HOTEL FREMONT — BOOKING STATUS LIFECYCLE TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean | any, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. STATE MACHINE TRANSITIONS
  console.log("--- 1. Testing State Machine Rules ---");

  assert(
    validateBookingStatusTransition("pending", "confirmed").allowed,
    "PENDING -> CONFIRMED is allowed"
  );
  assert(
    validateBookingStatusTransition("confirmed", "checked_in").allowed,
    "CONFIRMED -> CHECKED_IN is allowed"
  );
  assert(
    validateBookingStatusTransition("checked_in", "checked_out").allowed,
    "CHECKED_IN -> CHECKED_OUT is allowed"
  );
  assert(
    validateBookingStatusTransition("pending", "cancelled").allowed,
    "PENDING -> CANCELLED is allowed"
  );
  assert(
    validateBookingStatusTransition("confirmed", "cancelled").allowed,
    "CONFIRMED -> CANCELLED is allowed"
  );
  assert(
    !validateBookingStatusTransition("checked_in", "cancelled").allowed,
    "CHECKED_IN -> CANCELLED is blocked (supervised checkout required)"
  );
  assert(
    !validateBookingStatusTransition("checked_out", "checked_in").allowed,
    "CHECKED_OUT -> CHECKED_IN is blocked (terminal state)"
  );
  assert(
    !validateBookingStatusTransition("cancelled", "checked_in").allowed,
    "CANCELLED -> CHECKED_IN is blocked (terminal state)"
  );
  assert(
    validateBookingStatusTransition("checked_out", "confirmed", true).allowed,
    "CHECKED_OUT -> CONFIRMED allowed with admin override"
  );

  // 2. METADATA ENCODING & PARSING
  console.log("\n--- 2. Testing Dual-Persistence Packing & Unpacking ---");
  const testNotes = "Guest requested quiet corner room on top floor.";
  const now = new Date().toISOString();

  const packed1 = packOperationalMetadata(testNotes, {
    status: "checked_in",
    roomNumber: "204",
    checkedInAt: now,
    updatedBy: "frontdesk@hotelfremont.in",
  });

  const parsed1 = unpackOperationalMetadata(packed1);
  assert(parsed1.metadata?.status === "checked_in", "Packed status matches checked_in");
  assert(parsed1.metadata?.roomNumber === "204", "Packed roomNumber matches 204");
  assert(parsed1.cleanNotes === testNotes, "Clean notes stripped of operational tags");

  const auth1 = resolveAuthoritativeStatus("paid", packed1);
  assert(auth1.bookingStatus === "checked_in", "resolveAuthoritativeStatus overrides paid to checked_in");
  assert(auth1.roomNumber === "204", "Authoritative room number resolved to 204");

  const packed2 = packOperationalMetadata(packed1, {
    status: "checked_out",
    roomNumber: "204",
    checkedInAt: now,
    checkedOutAt: new Date(Date.now() + 86400000).toISOString(),
    updatedBy: "frontdesk@hotelfremont.in",
  });

  const auth2 = resolveAuthoritativeStatus("paid", packed2);
  assert(auth2.bookingStatus === "checked_out", "resolveAuthoritativeStatus updates to checked_out");
  assert(auth2.checkedOutAt !== null, "Authoritative checkedOutAt timestamp preserved");

  // 3. DATABASE DUAL-PERSISTENCE VERIFICATION
  console.log("\n--- 3. Testing Real Supabase Data Persistence ---");

  // Insert a test booking record to verify end-to-end Supabase persistence
  const testRef = `TEST-${Date.now().toString().slice(-6)}`;
  const checkInTime = new Date().toISOString();

  const { data: inserted, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      booking_ref: testRef,
      access_token: crypto.randomUUID(),
      guest_name: "Test Lifecycle Guest",
      phone: "+919876543210",
      email: "test.lifecycle@example.com",
      room_category: "deluxe-room",
      check_in: "2026-11-25",
      check_out: "2026-11-26",
      nights: 1,
      status: "pending",
      expires_at: new Date(Date.now() + 1800000).toISOString(),
      total_amount: 2499,
      special_requests: "Dual persistence integration test record",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("Supabase insert error:", insertErr);
  }
  assert(!insertErr && inserted, `Created test booking record ${testRef} in Supabase`);

  if (inserted) {
    // 3a. Transition to CONFIRMED
    const packedConfirmed = packOperationalMetadata(inserted.special_requests, {
      status: "confirmed",
      updatedBy: "admin@hotelfremont.in",
    });
    const { error: errConfirmed } = await supabase
      .from("bookings")
      .update({
        special_requests: packedConfirmed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inserted.id);

    assert(!errConfirmed, "Transitioned to CONFIRMED and saved to Supabase");

    const { data: readConfirmed } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", inserted.id)
      .single();

    const authConfirmed = resolveAuthoritativeStatus(readConfirmed.status, readConfirmed.special_requests);
    assert(authConfirmed.bookingStatus === "confirmed", "Authoritative status resolved to CONFIRMED");

    // 3b. Transition to CHECKED_IN with room assignment
    const packedCheckIn = packOperationalMetadata(readConfirmed.special_requests, {
      status: "checked_in",
      roomNumber: "105",
      checkedInAt: checkInTime,
      updatedBy: "admin@hotelfremont.in",
    });

    const { error: updateErr1 } = await supabase
      .from("bookings")
      .update({
        special_requests: packedCheckIn,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inserted.id);

    assert(!updateErr1, "Saved CHECKED_IN operational state to Supabase without errors");

    // Re-fetch from database to verify persistence across reloads
    const { data: reloaded1 } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", inserted.id)
      .single();

    const authReloaded1 = resolveAuthoritativeStatus(reloaded1.status, reloaded1.special_requests);
    assert(
      authReloaded1.bookingStatus === "checked_in",
      "Re-fetched booking maintains CHECKED_IN status permanently across page refresh"
    );
    assert(
      authReloaded1.roomNumber === "105",
      "Re-fetched booking maintains room assignment 105"
    );

    // 3c. Transition to CHECKED_OUT with checkout timestamp
    const checkOutTime = new Date().toISOString();
    const packedCheckOut = packOperationalMetadata(reloaded1.special_requests, {
      status: "checked_out",
      roomNumber: "105",
      checkedInAt: checkInTime,
      checkedOutAt: checkOutTime,
      updatedBy: "admin@hotelfremont.in",
    });

    const { error: updateErr2 } = await supabase
      .from("bookings")
      .update({
        special_requests: packedCheckOut,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inserted.id);

    assert(!updateErr2, "Saved CHECKED_OUT operational state to Supabase without errors");

    // Re-fetch to verify terminal checkout state
    const { data: reloaded2 } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", inserted.id)
      .single();

    const authReloaded2 = resolveAuthoritativeStatus(reloaded2.status, reloaded2.special_requests);
    assert(
      authReloaded2.bookingStatus === "checked_out",
      "Re-fetched booking maintains CHECKED_OUT terminal status permanently"
    );
    assert(
      authReloaded2.checkedOutAt === checkOutTime,
      "Checkout timestamp persists accurately in record"
    );

    // Clean up temporary test record
    await supabase.from("bookings").delete().eq("id", inserted.id);
    console.log(`Cleaned up temporary test record ${testRef}`);
  }

  // 4. PUBLIC AVAILABILITY VERIFICATION
  console.log("\n--- 4. Testing Public Room Availability RPC ---");
  const { data: availRes, error: rpcErr } = await supabase.rpc("get_room_availability", {
    p_check_in: "2026-11-21",
    p_check_out: "2026-11-22",
  });

  assert(!rpcErr && Array.isArray(availRes), "get_room_availability executed without error");
  if (availRes) {
    for (const r of availRes) {
      console.log(`  ${r.name} (${r.code}): total=${r.total_rooms}, available=${r.rooms_left}`);
    }
  }

  console.log(`\n=================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
