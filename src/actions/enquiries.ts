"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export type EnquiryType = "rate_check" | "book_now" | "dining_aura" | "event_banquet" | "contact";
export type EnquiryStatus = "new" | "contacted" | "in_discussion" | "converted" | "closed";

export interface EnquiryRecord {
  id: string;
  type: EnquiryType;
  name: string;
  phone: string;
  email?: string;
  dates?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  roomsRequested?: number;
  nights?: number;
  referenceCode?: string;
  roomType?: string;
  roomTypeCode?: string;
  details?: Record<string, any>;
  status: EnquiryStatus;
  notes?: string;
  createdAt: string;
  capacityOverride?: boolean;
}

export interface SubmitEnquiryInput {
  type: EnquiryType;
  name: string;
  phone: string;
  email?: string;
  dates?: string;
  guests?: number;
  details?: Record<string, any>;
  notes?: string;
  honeypot?: string;
}

/**
 * Public Server Action to capture leads from all public modals & forms
 * (Check Rates, Room Booking, Aura Dining, Banquet Events, Contact).
 * Inserts directly into public.reservations using the Supabase anon key client.
 * Strictly adheres to anon INSERT-only RLS policy (no .select()).
 */
export async function submitPublicEnquiryAction(input: SubmitEnquiryInput): Promise<{
  success: boolean;
  enquiryId?: string;
  error?: string;
}> {
  try {
    // 1. Honeypot check
    if (input.honeypot && input.honeypot.trim().length > 0) {
      console.warn("[Enquiry] Spam submission rejected via honeypot.");
      return { success: false, error: "Invalid submission detected." };
    }

    // 2. Validate required contact information
    const name = input.name?.trim();
    if (!name || name.length < 2) {
      return { success: false, error: "Please enter your full name (minimum 2 characters)." };
    }

    const phone = input.phone?.trim();
    if (!phone) {
      return { success: false, error: "A contact phone number is required." };
    }
    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length < 8 || cleanDigits.length > 15) {
      return { success: false, error: "Please enter a valid phone number (8 to 15 digits)." };
    }

    let email: string | null = null;
    if (input.email && input.email.trim().length > 0) {
      email = input.email.trim().toLowerCase();
    }

    // 3. Connect to Supabase using public anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { success: false, error: "Database configuration is missing." };
    }

    const client = createSupabaseClient(supabaseUrl, anonKey);

    // 4. Normalize dates & room_type based on inquiry channel
    const todayStr = new Date().toISOString().slice(0, 10);
    let checkIn = todayStr;
    let checkOut = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    let roomType = "General Inquiry";
    let guestsCount = Number(input.guests) || 2;
    let estimatedTotal = 0;

    if (input.type === "dining_aura") {
      roomType = "Aura Fine Dining";
      if (input.dates) {
        const rawDate = input.dates.split(" ")[0].trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          checkIn = rawDate;
          const nextDay = new Date(new Date(rawDate).getTime() + 86400000).toISOString().slice(0, 10);
          checkOut = nextDay;
        }
      }
      guestsCount = Number(input.guests) || 2;
    } else if (input.type === "event_banquet") {
      roomType = input.details?.venue || "The Grand Fremont Ballroom";
      if (input.dates && /^\d{4}-\d{2}-\d{2}$/.test(input.dates)) {
        checkIn = input.dates;
        const nextDay = new Date(new Date(input.dates).getTime() + 86400000).toISOString().slice(0, 10);
        checkOut = nextDay;
      }
      guestsCount = Number(input.guests) || 50;
    } else if (input.type === "rate_check" || input.type === "book_now") {
      roomType = input.details?.suite || "Deluxe King Room";
      if (input.dates && input.dates.includes(" to ")) {
        const parts = input.dates.split(" to ");
        if (parts[0] && parts[1]) {
          checkIn = parts[0].trim();
          checkOut = parts[1].trim();
        }
      }
      guestsCount = Number(input.guests) || 2;
      estimatedTotal = Number(input.details?.totalAmount || 0);
    }

    // Compose formatted special_request summary
    const summaryNotes = [
      input.notes,
      input.details?.seating ? `Seating: ${input.details.seating}` : null,
      input.details?.time ? `Time: ${input.details.time}` : null,
      input.details?.eventType ? `Event: ${input.details.eventType}` : null,
      input.details?.venue ? `Venue: ${input.details.venue}` : null,
      input.details?.specialRequests && input.details.specialRequests !== "None" ? `Special: ${input.details.specialRequests}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    // Base compatible payload matching current reservations schema
    const basePayload = {
      full_name: name,
      phone,
      email,
      check_in: checkIn,
      check_out: checkOut,
      room_type: roomType,
      guests: guestsCount,
      special_request: summaryNotes || null,
      estimated_total: estimatedTotal,
      status: "new",
    };

    // First, try inserting with extended columns (if migration applied)
    const extendedPayload = {
      ...basePayload,
      channel: input.type,
      event_date: input.dates && /^\d{4}-\d{2}-\d{2}$/.test(input.dates) ? input.dates : null,
      event_type: input.details?.eventType || null,
      details: input.details || {},
    };

    let { error, status } = await client.from("reservations").insert(extendedPayload);

    // If extended columns don't exist yet, seamlessly insert base compatible payload
    if (error && error.message?.toLowerCase().includes("column")) {
      const fallbackRes = await client.from("reservations").insert(basePayload);
      error = fallbackRes.error;
      status = fallbackRes.status;
    }

    if (error) {
      console.error("[Enquiry] Supabase insert failed:", error);
      return { success: false, error: `Failed to save inquiry: ${error.message}` };
    }

    if (status !== 201 && status !== 200 && status !== 204) {
      return { success: false, error: "Database rejected submission. Please try again." };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/rooms");

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Enquiry] Exception in submitPublicEnquiryAction:", error);
    return { success: false, error: error.message || "Failed to submit inquiry." };
  }
}

/**
 * Determine EnquiryType channel from a public.reservations row
 */
function determineChannel(row: any): EnquiryType {
  const ch = (row.channel || "").toLowerCase().trim();
  if (ch === "dining_aura" || ch === "dining") return "dining_aura";
  if (ch === "event_banquet" || ch === "banquet" || ch === "events") return "event_banquet";
  if (ch === "rate_check") return "rate_check";
  if (ch === "contact") return "contact";
  if (ch === "book_now" || ch === "room_reservation") return "book_now";

  // Heuristic fallbacks based on room_type and special_request
  const room = (row.room_type || "").toLowerCase();
  const req = (row.special_request || "").toLowerCase();
  const eventType = (row.event_type || "").toLowerCase();

  if (room.includes("dining") || req.includes("dining") || req.includes("table reservation") || req.includes("aura")) {
    return "dining_aura";
  }
  if (
    room.includes("ballroom") ||
    room.includes("banquet") ||
    room.includes("lawn") ||
    room.includes("boardroom") ||
    eventType ||
    req.includes("wedding") ||
    req.includes("conference") ||
    req.includes("cocktail")
  ) {
    return "event_banquet";
  }
  if (req.includes("rate check") || room.includes("rate check")) {
    return "rate_check";
  }

  return "book_now";
}

/**
 * Normalize database status to UI EnquiryStatus
 */
function normalizeStatus(dbStatus: string): EnquiryStatus {
  const s = (dbStatus || "new").toLowerCase().trim();
  if (s === "new") return "new";
  if (s === "contacted") return "contacted";
  if (s === "in_discussion") return "in_discussion";
  if (s === "converted" || s === "confirmed") return "converted";
  if (s === "closed" || s === "cancelled") return "closed";
  return "new";
}

/**
 * Fetch all inquiries & leads from public.reservations (newest first).
 * Authenticated admin session strictly required.
 * Returns ONLY real rows from Supabase (ZERO mock data).
 */
export async function getEnquiriesAction(): Promise<{
  success: boolean;
  enquiries: EnquiryRecord[];
  isDatabase: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        enquiries: [],
        isDatabase: false,
        error: "Unauthorized: Admin session required.",
      };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        enquiries: [],
        isDatabase: false,
        error: "Supabase connection unavailable.",
      };
    }

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Enquiries] Error reading reservations:", error);
      return {
        success: false,
        enquiries: [],
        isDatabase: false,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return { success: true, enquiries: [], isDatabase: true };
    }

    // Map Supabase reservations rows directly to UI EnquiryRecord format
    const enquiries: EnquiryRecord[] = data.map((r: any) => {
      const type = determineChannel(r);
      const status = normalizeStatus(r.status);

      let dates: string | undefined = undefined;
      if (r.check_in && r.check_out && r.check_in !== r.check_out) {
        dates = `${r.check_in} to ${r.check_out}`;
      } else if (r.check_in) {
        dates = r.check_in;
      } else if (r.event_date) {
        dates = r.event_date;
      }

      // Build details payload
      const details: Record<string, any> = {
        suite: r.room_type || undefined,
        totalAmount: r.estimated_total ? Number(r.estimated_total) : undefined,
        specialRequests: r.special_request || undefined,
        ...(r.details || {}),
      };

      if (r.event_type) {
        details.eventType = r.event_type;
      }

      const nightsCalculated = r.nights 
        ? Number(r.nights) 
        : (r.check_in && r.check_out ? Math.max(1, Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000)) : 1);

      return {
        id: r.id,
        type,
        name: r.full_name || "Guest",
        phone: r.phone || "",
        email: r.email || undefined,
        dates,
        checkIn: r.check_in || undefined,
        checkOut: r.check_out || undefined,
        guests: r.guests || undefined,
        roomsRequested: Number(r.rooms_requested) || 1,
        nights: nightsCalculated,
        referenceCode: r.reference_code || `FRM-${r.id.slice(0, 6).toUpperCase()}`,
        roomType: r.room_type || undefined,
        roomTypeCode: r.room_type_code || undefined,
        details,
        status,
        notes: r.special_request || undefined,
        createdAt: r.created_at || new Date().toISOString(),
        capacityOverride: Boolean(r.capacity_override),
      };
    });

    return { success: true, enquiries, isDatabase: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Enquiries] Exception reading reservations:", error);
    return {
      success: false,
      enquiries: [],
      isDatabase: false,
      error: error.message || "Failed to load enquiries.",
    };
  }
}

/**
 * Update enquiry status and staff notes in public.reservations
 * Supports management capacity_override when inventory guard detects overbooking.
 */
export async function updateEnquiryStatusAction(
  enquiryId: string,
  status: EnquiryStatus,
  notes?: string,
  override: boolean = false
): Promise<{ success: boolean; requiresOverride?: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database client is unavailable." };
    }

    const updatePayload: Record<string, any> = {
      status,
    };
    if (override) {
      updatePayload.capacity_override = true;
    }
    if (notes !== undefined) {
      updatePayload.special_request = notes;
    }

    // Try direct status update
    let { error } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", enquiryId);

    // Check for OVERBOOKING_GUARD trigger exception
    if (error && error.message?.includes("OVERBOOKING_GUARD")) {
      return {
        success: false,
        requiresOverride: true,
        error: "Capacity limit reached for these dates. Management override required to confirm this booking.",
      };
    }

    // If check constraint rejects 'in_discussion', 'converted', or 'closed',
    // fallback to corresponding allowed status ('contacted', 'confirmed', 'cancelled')
    if (error && error.message?.includes("reservations_status_check")) {
      const fallbackStatus =
        status === "converted"
          ? "confirmed"
          : status === "closed"
          ? "cancelled"
          : status === "in_discussion"
          ? "contacted"
          : status;

      const fallbackRes = await supabase
        .from("reservations")
        .update({ ...updatePayload, status: fallbackStatus })
        .eq("id", enquiryId);

      error = fallbackRes.error;
    }

    if (error) {
      if (error.message?.includes("OVERBOOKING_GUARD")) {
        return {
          success: false,
          requiresOverride: true,
          error: "Capacity limit reached for these dates. Management override required to confirm this booking.",
        };
      }
      console.error(`[Enquiries] Failed updating status for ${enquiryId}:`, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/rooms");

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to update status." };
  }
}

/**
 * Delete a lead / inquiry row from public.reservations
 */
export async function deleteEnquiryAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database client is unavailable." };
    }

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`[Enquiries] Failed deleting inquiry ${id}:`, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/rooms");

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to delete inquiry." };
  }
}
