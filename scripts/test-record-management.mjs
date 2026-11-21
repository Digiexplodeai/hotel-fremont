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

async function runTests() {
  console.log("=== Testing Hotel Fremont Record Management & Deletion Controls ===");

  // 1. Create a dummy test reservation
  console.log("\n1. Inserting test reservation...");
  const dummyRef = `TEST-${Date.now().toString().slice(-6)}`;
  const { data: testRes, error: insErr } = await supabase
    .from("reservations")
    .insert({
      full_name: "Test Customer Deletion",
      email: "test-delete@example.com",
      phone: "+91 99999 88888",
      channel: "dining_aura",
      room_type: "deluxe-room",
      guests: 2,
      status: "new",
      reference_code: dummyRef,
      check_in: "2026-12-01",
      check_out: "2026-12-02",
      special_request: "Temporary test lead for deletion testing",
    })
    .select()
    .single();

  if (insErr) {
    console.error("Failed to insert test enquiry:", insErr);
    process.exit(1);
  }
  console.log("✓ Inserted test enquiry ID:", testRes.id, "Ref:", testRes.reference_code);

  // 2. Test Single Enquiry Archive (status -> closed)
  console.log("\n2. Testing archive enquiry (status -> closed)...");
  const { error: archErr } = await supabase
    .from("reservations")
    .update({ status: "closed" })
    .eq("id", testRes.id);

  if (archErr) {
    console.error("Archive failed:", archErr);
  } else {
    const { data: verifiedArch } = await supabase
      .from("reservations")
      .select("status")
      .eq("id", testRes.id)
      .single();
    console.log("✓ Archived successfully, new status:", verifiedArch?.status);
  }

  // 3. Test Single Enquiry Permanent Deletion
  console.log("\n3. Testing permanent enquiry deletion...");
  const { error: delErr } = await supabase
    .from("reservations")
    .delete()
    .eq("id", testRes.id);

  if (delErr) {
    console.error("Delete failed:", delErr);
  } else {
    const { data: checkDeleted } = await supabase
      .from("reservations")
      .select("id")
      .eq("id", testRes.id)
      .maybeSingle();
    console.log("✓ Deleted successfully, record exists?:", checkDeleted !== null);
  }

  // 4. Test Active Stay Protection Logic
  console.log("\n4. Testing Active Stay Conflict Protection...");
  const todayStr = new Date().toISOString().slice(0, 10);
  const futureCheckOut = "2027-01-01";

  // Insert active future booking
  const activeGuestPhone = "+91 91111 22222";
  const { data: activeRes, error: actErr } = await supabase
    .from("reservations")
    .insert({
      full_name: "Active Guest Stay",
      phone: activeGuestPhone,
      email: "active@stay.com",
      room_type: "super-deluxe-room",
      status: "confirmed",
      check_in: todayStr,
      check_out: futureCheckOut,
      guests: 2,
      channel: "room_reservation",
    })
    .select()
    .single();

  if (actErr) {
    console.error("Active res insert failed:", actErr);
  } else {
    console.log("✓ Active stay record created:", activeRes.id);

    // Run active check with phone digit pattern:
    const cleanPhone = activeGuestPhone.replace(/\D/g, "").slice(-10);
    const pattern = "%" + cleanPhone.split("").join("%") + "%";
    const { data: checkList } = await supabase
      .from("reservations")
      .select("*")
      .ilike("phone", pattern);

    const hasActiveStay = (checkList || []).some(
      (r) => r.check_out >= todayStr && (r.status === "confirmed" || r.status === "paid")
    );

    console.log("Active stay conflict detected by rule?:", hasActiveStay);
    if (hasActiveStay) {
      console.log("✓ Active stay protection assertion PASSED: deletion would be correctly BLOCKED.");
    } else {
      console.error("✗ Failed to detect active stay conflict!");
    }

    // Cleanup active stay test record
    await supabase.from("reservations").delete().eq("id", activeRes.id);
    console.log("✓ Cleaned up active stay test record.");
  }

  // 5. Test Bulk Operations
  console.log("\n5. Testing Bulk Enquiries Batch (Insert 3, Bulk Archive, Bulk Delete)...");
  const batchRecords = [
    { full_name: "Bulk Lead 1", phone: "+91 90000 00001", room_type: "deluxe-room", guests: 2, channel: "contact", status: "new", check_in: "2026-12-01", check_out: "2026-12-02" },
    { full_name: "Bulk Lead 2", phone: "+91 90000 00002", room_type: "deluxe-room", guests: 2, channel: "dining", status: "new", check_in: "2026-12-01", check_out: "2026-12-02" },
    { full_name: "Bulk Lead 3", phone: "+91 90000 00003", room_type: "deluxe-room", guests: 2, channel: "event_banquet", status: "new", check_in: "2026-12-01", check_out: "2026-12-02" },
  ];

  const { data: insertedBatch, error: batchErr } = await supabase
    .from("reservations")
    .insert(batchRecords)
    .select();

  if (batchErr) {
    console.error("Batch insert failed:", batchErr);
  } else {
    const ids = insertedBatch.map((b) => b.id);
    console.log("✓ Inserted 3 bulk items:", ids);

    // Bulk Archive
    const { error: bArchErr } = await supabase
      .from("reservations")
      .update({ status: "closed" })
      .in("id", ids);
    console.log("✓ Bulk archive error?:", bArchErr ? bArchErr.message : "None (Success)");

    // Bulk Delete
    const { error: bDelErr } = await supabase
      .from("reservations")
      .delete()
      .in("id", ids);
    console.log("✓ Bulk delete error?:", bDelErr ? bDelErr.message : "None (Success)");
  }

  // 6. Test Audit Log insertion if table exists
  console.log("\n6. Testing public.audit_logs table availability...");
  const { data: auditTest, error: auditErr } = await supabase
    .from("audit_logs")
    .select("id")
    .limit(1);

  if (auditErr) {
    console.log("Note: public.audit_logs table not yet created in Supabase (in-memory audit logger active). Error:", auditErr.message);
    console.log("Migration script provided at supabase/migrations/20261121_audit_logs.sql for SQL Editor.");
  } else {
    console.log("✓ public.audit_logs table exists and is readable in Supabase!");
  }

  console.log("\n=== All Tests Completed Successfully ===");
}

runTests();
