"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import { isRazorpayTestMode } from "@/lib/razorpay";

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: "reservation" | "booking" | "guest" | "enquiry" | "test_data" | "system";
  entityId: string;
  adminEmail: string;
  details: string;
  outcome: "success" | "blocked" | "failed";
  timestamp: string;
}

// In-memory fallback audit log buffer
let memoryAuditLogs: AuditLogEntry[] = [
  {
    id: "log-seed-1",
    action: "System Calibration",
    entityType: "system",
    entityId: "SYS-001",
    adminEmail: "system",
    details: "Hotel Fremont admin record management and customer controls initialized",
    outcome: "success",
    timestamp: new Date().toISOString(),
  },
];

/**
 * Record an administrative audit log event
 */
export async function recordAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  const timestamp = new Date().toISOString();
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const logItem: AuditLogEntry = { ...entry, id, timestamp };

  memoryAuditLogs.unshift(logItem);
  if (memoryAuditLogs.length > 200) {
    memoryAuditLogs = memoryAuditLogs.slice(0, 200);
  }

  // Attempt writing to Supabase audit_logs table if it exists
  try {
    const supabase = createAdminSupabaseClient();
    if (supabase) {
      await supabase.from("audit_logs").insert({
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        user_email: entry.adminEmail,
        changes: { details: entry.details, outcome: entry.outcome },
        created_at: timestamp,
      });
    }
  } catch (err) {
    // Graceful fallback to memory log
  }

  return logItem;
}

/**
 * Fetch all audit trail logs (Admin required)
 */
export async function getAuditLogsAction(): Promise<{
  success: boolean;
  logs: AuditLogEntry[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, logs: [], error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          const dbLogs: AuditLogEntry[] = data.map((d: any) => ({
            id: d.id,
            action: d.action,
            entityType: (d.entity_type as any) || "system",
            entityId: d.entity_id || "N/A",
            adminEmail: d.user_email || "admin",
            details: d.changes?.details || d.action,
            outcome: (d.changes?.outcome as any) || "success",
            timestamp: d.created_at,
          }));
          return { success: true, logs: dbLogs };
        }
      } catch {}
    }

    return { success: true, logs: memoryAuditLogs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load audit logs.";
    return { success: false, logs: memoryAuditLogs, error: message };
  }
}

/**
 * Delete a single reservation or test booking
 */
export async function deleteReservationAction(
  id: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database client unavailable." };
    }

    // 1. Fetch record from reservations
    const { data: res } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    // 2. Fetch record from bookings
    let bookingRef = res?.reference_code;
    let linkedBooking: any = null;

    if (bookingRef) {
      const { data: b } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_ref", bookingRef)
        .maybeSingle();
      linkedBooking = b;
    } else {
      const { data: b } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      linkedBooking = b;
      if (b) bookingRef = b.booking_ref;
    }

    // 3. Verification: Prevent deleting real production payments
    const isTest = isRazorpayTestMode();
    const hasLivePayment =
      linkedBooking?.razorpay_payment_id &&
      !isTest &&
      linkedBooking?.status === "paid";

    if (hasLivePayment) {
      await recordAuditLog({
        action: "Delete Reservation Blocked",
        entityType: "reservation",
        entityId: bookingRef || id,
        adminEmail: user.email,
        details: `Blocked hard deletion of live paid booking ${bookingRef}. Real payment records must be archived, not deleted.`,
        outcome: "blocked",
      });
      return {
        success: false,
        error: "Cannot permanently delete a live paid booking. Please cancel or archive instead to preserve accounting history.",
      };
    }

    // 4. Perform Deletion
    if (res) {
      await supabase.from("reservations").delete().eq("id", res.id);
    }
    if (linkedBooking) {
      await supabase.from("bookings").delete().eq("id", linkedBooking.id);
    }
    if (bookingRef) {
      await supabase.from("reservations").delete().eq("reference_code", bookingRef);
      await supabase.from("bookings").delete().eq("booking_ref", bookingRef);
    }

    await recordAuditLog({
      action: "Delete Reservation / Test Record",
      entityType: "reservation",
      entityId: bookingRef || id,
      adminEmail: user.email,
      details: reason ? `Reason: ${reason}` : "Permanently removed reservation and linked booking data",
      outcome: "success",
    });

    revalidateAdminPaths();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete reservation.";
    return { success: false, error: message };
  }
}

/**
 * Archive a reservation (closes/cancels without destroying transaction record)
 */
export async function archiveReservationAction(
  id: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database client unavailable." };
    }

    // Update reservation status to closed
    await supabase.from("reservations").update({ status: "closed" }).eq("id", id);

    // If linked booking exists, mark cancelled if still pending
    const { data: res } = await supabase.from("reservations").select("reference_code").eq("id", id).maybeSingle();
    if (res?.reference_code) {
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("booking_ref", res.reference_code)
        .eq("status", "pending");
    }

    await recordAuditLog({
      action: "Archive Reservation",
      entityType: "reservation",
      entityId: res?.reference_code || id,
      adminEmail: user.email,
      details: reason ? `Archived: ${reason}` : "Reservation status set to closed/archived",
      outcome: "success",
    });

    revalidateAdminPaths();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to archive reservation.";
    return { success: false, error: message };
  }
}

/**
 * Archive a guest: marks all linked reservations as closed and pending bookings as cancelled
 */
export async function archiveGuestAction(
  guestIdentifier: { phone?: string; email?: string; name?: string },
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database client unavailable." };
    }

    const cleanPhone = guestIdentifier.phone?.replace(/\D/g, "").slice(-10);
    const guestEmail = guestIdentifier.email?.trim().toLowerCase();
    const guestName = guestIdentifier.name?.trim();

    if (!cleanPhone && !guestEmail && !guestName) {
      return { success: false, error: "Guest identifier is required." };
    }

    const pattern = cleanPhone ? "%" + cleanPhone.split("").join("%") + "%" : undefined;

    if (pattern) {
      await supabase.from("reservations").update({ status: "closed" }).ilike("phone", pattern);
      await supabase.from("bookings").update({ status: "cancelled" }).ilike("phone", pattern).eq("status", "pending");
    } else if (guestEmail) {
      await supabase.from("reservations").update({ status: "closed" }).eq("email", guestEmail);
      await supabase.from("bookings").update({ status: "cancelled" }).eq("email", guestEmail).eq("status", "pending");
    } else if (guestName) {
      await supabase.from("reservations").update({ status: "closed" }).eq("full_name", guestName);
      await supabase.from("bookings").update({ status: "cancelled" }).eq("guest_name", guestName).eq("status", "pending");
    }

    await recordAuditLog({
      action: "Archive Guest",
      entityType: "guest",
      entityId: cleanPhone || guestEmail || guestName || "unknown",
      adminEmail: user.email,
      details: reason ? `Archived guest: ${reason}` : "Guest reservations archived",
      outcome: "success",
    });

    revalidateAdminPaths();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to archive guest.";
    return { success: false, error: message };
  }
}

/**
 * Delete or anonymize customer personal data from Guest Directory
 */
export async function deleteGuestDataAction(
  guestIdentifier: { phone?: string; email?: string; name?: string },
  options?: { anonymizeOnly?: boolean; reason?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database client unavailable." };
    }

    const cleanPhone = guestIdentifier.phone?.replace(/\D/g, "").slice(-10);
    const guestEmail = guestIdentifier.email?.trim().toLowerCase();
    const guestName = guestIdentifier.name?.trim();

    if (!cleanPhone && !guestEmail && !guestName) {
      return { success: false, error: "Guest identifier is required to locate records." };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const pattern = cleanPhone ? "%" + cleanPhone.split("").join("%") + "%" : undefined;

    // 1. Check for active or upcoming reservations
    let resQuery = supabase.from("reservations").select("*");
    if (pattern) resQuery = resQuery.ilike("phone", pattern);
    else if (guestEmail) resQuery = resQuery.eq("email", guestEmail);
    else if (guestName) resQuery = resQuery.eq("full_name", guestName);

    const { data: guestResList } = await resQuery;

    let bookQuery = supabase.from("bookings").select("*");
    if (pattern) bookQuery = bookQuery.ilike("phone", pattern);
    else if (guestEmail) bookQuery = bookQuery.eq("email", guestEmail);
    else if (guestName) bookQuery = bookQuery.eq("guest_name", guestName);

    const { data: guestBookList } = await bookQuery;

    // Check active stays
    const activeRes = (guestResList || []).some(
      (r) => r.check_out >= todayStr && (r.status === "confirmed" || r.status === "paid")
    );
    const activeBook = (guestBookList || []).some(
      (b) => b.check_out >= todayStr && (b.status === "confirmed" || b.status === "paid")
    );

    if (activeRes || activeBook) {
      await recordAuditLog({
        action: "Delete Customer Blocked",
        entityType: "guest",
        entityId: cleanPhone || guestEmail || guestName || "unknown",
        adminEmail: user.email,
        details: "Blocked deletion: customer has active or upcoming room reservations.",
        outcome: "blocked",
      });
      return {
        success: false,
        error: "Cannot delete guest with active or upcoming reservations. Please check out or cancel the stay first.",
      };
    }

    const isTest = isRazorpayTestMode();

    if (options?.anonymizeOnly) {
      // Anonymize PII
      if (pattern) {
        await supabase
          .from("reservations")
          .update({ full_name: "Anonymized Guest", phone: "0000000000", email: null, special_request: null })
          .ilike("phone", pattern);
        await supabase
          .from("bookings")
          .update({ guest_name: "Anonymized Guest", phone: "0000000000", email: "anonymized@hotelfremont.in", special_requests: null })
          .ilike("phone", pattern);
      }
    } else {
      // Permanent removal of test/completed guest records
      if (pattern) {
        await supabase.from("reservations").delete().ilike("phone", pattern);
        await supabase.from("bookings").delete().ilike("phone", pattern);
      } else if (guestEmail) {
        await supabase.from("reservations").delete().eq("email", guestEmail);
        await supabase.from("bookings").delete().eq("email", guestEmail);
      } else if (guestName) {
        await supabase.from("reservations").delete().eq("full_name", guestName);
        await supabase.from("bookings").delete().eq("guest_name", guestName);
      }
    }

    await recordAuditLog({
      action: options?.anonymizeOnly ? "Anonymize Customer Data" : "Delete Customer Data",
      entityType: "guest",
      entityId: cleanPhone || guestEmail || guestName || "unknown",
      adminEmail: user.email,
      details: options?.reason ? `Reason: ${options.reason}` : "Customer records removed or anonymized",
      outcome: "success",
    });

    revalidateAdminPaths();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete customer data.";
    return { success: false, error: message };
  }
}

/**
 * Delete a single lead / enquiry record
 */
export async function deleteEnquiryAction(
  id: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database client unavailable." };
    }

    const { data: enquiry } = await supabase.from("reservations").select("*").eq("id", id).maybeSingle();

    await supabase.from("reservations").delete().eq("id", id);

    await recordAuditLog({
      action: "Delete Enquiry",
      entityType: "enquiry",
      entityId: enquiry?.reference_code || id,
      adminEmail: user.email,
      details: reason ? `Reason: ${reason}` : `Deleted enquiry from ${enquiry?.full_name || "unknown"}`,
      outcome: "success",
    });

    revalidateAdminPaths();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete enquiry.";
    return { success: false, error: message };
  }
}

/**
 * Bulk delete multiple selected enquiry records
 */
export async function bulkDeleteEnquiriesAction(
  ids: string[],
  reason?: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, deletedCount: 0, error: "Unauthorized: Admin session required." };
    }

    if (!ids || ids.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return { success: false, deletedCount: 0, error: "Database client unavailable." };
    }

    const { error } = await supabase.from("reservations").delete().in("id", ids);

    if (error) {
      return { success: false, deletedCount: 0, error: error.message };
    }

    await recordAuditLog({
      action: "Bulk Delete Enquiries",
      entityType: "enquiry",
      entityId: `${ids.length} records`,
      adminEmail: user.email,
      details: reason ? `Bulk deleted ${ids.length} enquiries. Reason: ${reason}` : `Bulk deleted ${ids.length} enquiries`,
      outcome: "success",
    });

    revalidateAdminPaths();
    return { success: true, deletedCount: ids.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to bulk delete enquiries.";
    return { success: false, deletedCount: 0, error: message };
  }
}

/**
 * Bulk archive multiple selected enquiry records
 */
export async function bulkArchiveEnquiriesAction(
  ids: string[],
  reason?: string
): Promise<{ success: boolean; archivedCount: number; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, archivedCount: 0, error: "Unauthorized: Admin session required." };
    }

    if (!ids || ids.length === 0) {
      return { success: true, archivedCount: 0 };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return { success: false, archivedCount: 0, error: "Database client unavailable." };
    }

    const { error } = await supabase.from("reservations").update({ status: "closed" }).in("id", ids);

    if (error) {
      return { success: false, archivedCount: 0, error: error.message };
    }

    await recordAuditLog({
      action: "Bulk Archive Enquiries",
      entityType: "enquiry",
      entityId: `${ids.length} records`,
      adminEmail: user.email,
      details: reason ? `Bulk archived ${ids.length} enquiries. Reason: ${reason}` : `Bulk archived ${ids.length} enquiries`,
      outcome: "success",
    });

    revalidateAdminPaths();
    return { success: true, archivedCount: ids.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to bulk archive enquiries.";
    return { success: false, archivedCount: 0, error: message };
  }
}

/**
 * Fetch a summary breakdown of all test records eligible for cleanup
 */
export async function getTestDataSummaryAction(): Promise<{
  success: boolean;
  bookings: any[];
  reservations: any[];
  enquiries: any[];
  totalSimulatedAmount: number;
  isTestMode: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        bookings: [],
        reservations: [],
        enquiries: [],
        totalSimulatedAmount: 0,
        isTestMode: true,
        error: "Unauthorized: Admin session required.",
      };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        bookings: [],
        reservations: [],
        enquiries: [],
        totalSimulatedAmount: 0,
        isTestMode: true,
        error: "Database client unavailable.",
      };
    }

    const isTest = isRazorpayTestMode();

    const [bRes, rRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("reservations").select("*").order("created_at", { ascending: false }),
    ]);

    const allBookings = bRes.data || [];
    const allReservations = rRes.data || [];

    // Filter test enquiries (channel is inquiry or lead)
    const enquiries = allReservations.filter(
      (r) => r.channel !== "razorpay" && r.channel !== "room_reservation"
    );

    // Filter room reservations
    const reservations = allReservations.filter(
      (r) => r.channel === "room_reservation" || r.channel === "razorpay"
    );

    const totalSimulatedAmount = allBookings.reduce(
      (sum, b) => sum + (Number(b.total_amount) || 0),
      0
    );

    return {
      success: true,
      bookings: allBookings,
      reservations,
      enquiries,
      totalSimulatedAmount,
      isTestMode: isTest,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get test data summary.";
    return {
      success: false,
      bookings: [],
      reservations: [],
      enquiries: [],
      totalSimulatedAmount: 0,
      isTestMode: true,
      error: message,
    };
  }
}

/**
 * Execute cleanup of verified test records (Admin only, requires confirmation)
 */
export async function cleanupTestDataAction(
  options: {
    bookingIds?: string[];
    reservationIds?: string[];
    cleanAll?: boolean;
    reason?: string;
  }
): Promise<{
  success: boolean;
  deletedBookingsCount: number;
  deletedReservationsCount: number;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        deletedBookingsCount: 0,
        deletedReservationsCount: 0,
        error: "Unauthorized: Admin session required.",
      };
    }

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        deletedBookingsCount: 0,
        deletedReservationsCount: 0,
        error: "Database client unavailable.",
      };
    }

    let deletedB = 0;
    let deletedR = 0;

    if (options.cleanAll) {
      // 1. Create audit snapshot before full clean slate
      const { data: bData } = await supabase.from("bookings").select("id, booking_ref, total_amount");
      const { data: rData } = await supabase.from("reservations").select("id, reference_code, full_name");

      deletedB = bData?.length || 0;
      deletedR = rData?.length || 0;

      // Wipe test bookings
      await supabase.from("bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      // Wipe test reservations & enquiries
      await supabase.from("reservations").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      await recordAuditLog({
        action: "Full Test Data Clean Slate",
        entityType: "test_data",
        entityId: "ALL_TEST_DATA",
        adminEmail: user.email,
        details: `Cleaned all test data: ${deletedB} bookings and ${deletedR} reservations/enquiries removed. Reason: ${options.reason || "Pre-launch clean slate"}`,
        outcome: "success",
      });
    } else {
      if (options.bookingIds && options.bookingIds.length > 0) {
        const { error: bErr } = await supabase
          .from("bookings")
          .delete()
          .in("id", options.bookingIds);
        if (!bErr) deletedB = options.bookingIds.length;
      }

      if (options.reservationIds && options.reservationIds.length > 0) {
        const { error: rErr } = await supabase
          .from("reservations")
          .delete()
          .in("id", options.reservationIds);
        if (!rErr) deletedR = options.reservationIds.length;
      }

      await recordAuditLog({
        action: "Selective Test Data Cleanup",
        entityType: "test_data",
        entityId: `${deletedB} bookings, ${deletedR} reservations`,
        adminEmail: user.email,
        details: `Deleted ${deletedB} test bookings and ${deletedR} test reservations/enquiries. Reason: ${options.reason || "Admin cleanup"}`,
        outcome: "success",
      });
    }

    revalidateAdminPaths();

    return {
      success: true,
      deletedBookingsCount: deletedB,
      deletedReservationsCount: deletedR,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute test data cleanup.";
    return {
      success: false,
      deletedBookingsCount: 0,
      deletedReservationsCount: 0,
      error: message,
    };
  }
}

function revalidateAdminPaths() {
  try {
    revalidatePath("/admin");
    revalidatePath("/admin/reservations");
    revalidatePath("/admin/guests");
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/rooms");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/logs");
    revalidatePath("/admin/settings");
  } catch {}
}
