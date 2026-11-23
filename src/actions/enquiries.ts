"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export type EnquiryType = "rate_check" | "book_now" | "dining_aura" | "dining" | "event_banquet" | "conference" | "contact";
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

// In-memory rate limiting and anti-spam deduplication store (server-side runtime)
const enquiryRateLimitMap = new Map<
  string,
  { count: number; resetAt: number; lastHash: string; lastSubmittedAt: number }
>();

function checkRateLimitAndDuplicate(
  key: string,
  payloadHash: string
): { allowed: boolean; isDuplicate?: boolean; error?: string } {
  const now = Date.now();

  // Occasional garbage collection
  if (enquiryRateLimitMap.size > 2000) {
    for (const [k, v] of enquiryRateLimitMap.entries()) {
      if (now > v.resetAt) enquiryRateLimitMap.delete(k);
    }
  }

  const entry = enquiryRateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    enquiryRateLimitMap.set(key, {
      count: 1,
      resetAt: now + 60 * 1000, // 1 minute window
      lastHash: payloadHash,
      lastSubmittedAt: now,
    });
    return { allowed: true };
  }

  // Deduplication guard: ignore rapid identical re-clicks within 6 seconds
  if (entry.lastHash === payloadHash && now - entry.lastSubmittedAt < 6000) {
    return {
      allowed: false,
      isDuplicate: true,
      error: "Your enquiry is already being processed. Please wait.",
    };
  }

  // Rate limit: max 6 submissions per phone per minute
  if (entry.count >= 6) {
    return {
      allowed: false,
      error: "Too many enquiries submitted in a short period. Please try again shortly.",
    };
  }

  entry.count += 1;
  entry.lastHash = payloadHash;
  entry.lastSubmittedAt = now;
  return { allowed: true };
}

/**
 * Public Server Action to capture leads from all public modals & forms
 * (Dining Hall, Cloud 6 Banquet, Conference Hall, Contact, Check Rates).
 * Uses secure server-side credentials (SUPABASE_SERVICE_ROLE_KEY) so that
 * public visitors can submit enquiries safely without requiring guest login,
 * without exposing service credentials to the browser, and without exposing
 * customer reservations to public SELECT or manipulation.
 */
export async function submitPublicEnquiryAction(input: SubmitEnquiryInput): Promise<{
  success: boolean;
  enquiryId?: string;
  message?: string;
  error?: string;
}> {
  try {
    // 1. Honeypot check (anti-bot trap)
    if (input.honeypot && input.honeypot.trim().length > 0) {
      console.warn("[Enquiry] Spam submission silently dropped via honeypot.");
      return { success: false, error: "Invalid submission detected." };
    }

    // 2. Validate Guest Name
    const name = input.name?.trim();
    if (!name || name.length < 2) {
      return { success: false, error: "Please enter your full name (minimum 2 characters)." };
    }
    if (name.length > 80) {
      return { success: false, error: "Guest name is too long (maximum 80 characters)." };
    }
    if (/<[^>]*>/.test(name)) {
      return { success: false, error: "Invalid characters detected in name." };
    }

    // 3. Validate Contact Phone / WhatsApp
    const rawPhone = input.phone?.trim() || "";
    const cleanPhoneDigits = rawPhone.replace(/\D/g, "");
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 8 || cleanPhoneDigits.length > 15) {
      return { success: false, error: "Please enter a valid contact phone number (8 to 15 digits)." };
    }
    if (cleanPhoneDigits.length === 10 && !/^[6-9]/.test(cleanPhoneDigits)) {
      return { success: false, error: "Indian mobile numbers must start with 6, 7, 8, or 9." };
    }

    // 4. Validate Email (Optional)
    let email: string | null = null;
    if (input.email && input.email.trim().length > 0) {
      const trimmedEmail = input.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 120) {
        return { success: false, error: "Please enter a valid email address." };
      }
      email = trimmedEmail;
    }

    // 5. Validate Requested Date (Must not be in the past)
    if (input.dates) {
      const dateMatch = input.dates.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (dateMatch) {
        const reqDateStr = dateMatch[1];
        // Calculate today's date in IST (UTC + 5:30)
        const nowIST = new Date(Date.now() + 5.5 * 3600 * 1000);
        const todayStr = nowIST.toISOString().slice(0, 10);
        if (reqDateStr < todayStr) {
          return { success: false, error: "Preferred date cannot be in the past. Please select today or a future date." };
        }
      }
    }

    // 6. Validate Party Size / Guests Count
    let guestsCount = Number(input.guests);
    if (isNaN(guestsCount) || guestsCount < 1) {
      guestsCount = input.type === "dining" || input.type === "dining_aura" ? 2 : 50;
    }
    if (guestsCount > 500) {
      return { success: false, error: "Party size exceeds maximum venue capacity." };
    }

    // 7. Anti-Spam Rate Limit & Deduplication Check
    const submissionKey = cleanPhoneDigits;
    const payloadHash = `${name}:${cleanPhoneDigits}:${input.type}:${input.dates || ""}:${guestsCount}`;
    const rateCheck = checkRateLimitAndDuplicate(submissionKey, payloadHash);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.error || "Unable to submit duplicate enquiry." };
    }

    // 8. Connect to Supabase using Authoritative Server-Side Service Role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[Enquiry] Server configuration missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
      return { success: false, error: "Unable to submit your enquiry right now. Please try again." };
    }

    const client = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 9. Normalize dates & room_type based on inquiry channel
    const todayStr = new Date().toISOString().slice(0, 10);
    let checkIn = todayStr;
    let checkOut = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    let roomType = "General Inquiry";
    let estimatedTotal = 0;

    const channelType = input.type === "dining" ? "dining" : input.type;

    if (input.type === "dining_aura" || input.type === "dining") {
      roomType = "Hotel Fremont Dining Hall";
      if (input.dates) {
        const rawDate = input.dates.split(" ")[0].trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          checkIn = rawDate;
          const nextDay = new Date(new Date(rawDate).getTime() + 86400000).toISOString().slice(0, 10);
          checkOut = nextDay;
        }
      }
    } else if (input.type === "conference") {
      roomType = "Conference Hall";
      if (input.dates && /^\d{4}-\d{2}-\d{2}$/.test(input.dates)) {
        checkIn = input.dates;
        const nextDay = new Date(new Date(input.dates).getTime() + 86400000).toISOString().slice(0, 10);
        checkOut = nextDay;
      }
    } else if (input.type === "event_banquet") {
      roomType = input.details?.venue || "Cloud 6 Banquet";
      if (input.dates && /^\d{4}-\d{2}-\d{2}$/.test(input.dates)) {
        checkIn = input.dates;
        const nextDay = new Date(new Date(input.dates).getTime() + 86400000).toISOString().slice(0, 10);
        checkOut = nextDay;
      }
    } else if (input.type === "rate_check" || input.type === "book_now") {
      roomType = input.details?.suite || "Deluxe Room";
      if (input.dates && input.dates.includes(" to ")) {
        const parts = input.dates.split(" to ");
        if (parts[0] && parts[1]) {
          checkIn = parts[0].trim();
          checkOut = parts[1].trim();
        }
      }
      estimatedTotal = Number(input.details?.totalAmount || 0);
    }

    // Compose formatted special_request summary
    const summaryNotes = [
      input.notes,
      input.details?.seating ? `Seating: ${input.details.seating}` : null,
      input.details?.time ? `Time: ${input.details.time}` : null,
      input.details?.eventType ? `Event: ${input.details.eventType}` : null,
      input.details?.venue ? `Venue: ${input.details.venue}` : null,
      input.details?.specialRequests && input.details.specialRequests !== "None"
        ? `Special: ${input.details.specialRequests}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 600);

    const refCode = `FRM-ENQ-${Date.now().toString(36).toUpperCase()}`;

    // 10. Base payload strictly matching public.reservations schema
    // Sets room_type_code to null so it does not trigger the foreign key constraint
    // on public.room_types, and ensures it never matches physical room inventory (deluxe-room, super-deluxe, premium).
    // Sets status to 'new' so it NEVER triggers overbooking guards or blocks rooms.
    const basePayload = {
      full_name: name,
      phone: rawPhone,
      email,
      check_in: checkIn,
      check_out: checkOut,
      room_type: roomType,
      room_type_code: null,
      guests: guestsCount,
      special_request: summaryNotes || null,
      estimated_total: estimatedTotal,
      status: "new",
      channel: channelType,
      reference_code: refCode,
      rooms_requested: 1,
      capacity_override: false,
    };

    const { data: inserted, error } = await client
      .from("reservations")
      .insert(basePayload)
      .select("id, reference_code")
      .single();

    if (error) {
      console.error("[Enquiry] Supabase service_role insert failed:", error);
      return { success: false, error: "Unable to submit your enquiry right now. Please try again." };
    }

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/enquiries");
    } catch {
      // Invariant: static generation store missing outside active Next.js request context
    }

    return {
      success: true,
      enquiryId: inserted?.id,
      message: "Thank you! Your enquiry has been submitted successfully. Our team will contact you shortly.",
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Enquiry] Exception in submitPublicEnquiryAction:", error);
    return { success: false, error: "Unable to submit your enquiry right now. Please try again." };
  }
}

/**
 * Determine EnquiryType channel from a public.reservations row
 */
function determineChannel(row: any): EnquiryType {
  const ch = (row.channel || "").toLowerCase().trim();
  if (ch === "dining_aura" || ch === "dining") return "dining_aura";
  if (ch === "conference") return "conference";
  if (ch === "event_banquet" || ch === "banquet" || ch === "events") return "event_banquet";
  if (ch === "rate_check") return "rate_check";
  if (ch === "contact") return "contact";
  if (ch === "book_now" || ch === "room_reservation") return "book_now";

  // Heuristic fallbacks based on room_type and special_request
  const room = (row.room_type || "").toLowerCase();
  const req = (row.special_request || "").toLowerCase();
  const eventType = (row.event_type || "").toLowerCase();

  if (
    room.includes("dining") ||
    req.includes("dining") ||
    req.includes("table reservation") ||
    room.includes("restaurant") ||
    req.includes("restaurant")
  ) {
    return "dining_aura";
  }
  if (room.includes("conference") || req.includes("conference") || eventType.includes("conference")) {
    return "conference";
  }
  if (
    room.includes("ballroom") ||
    room.includes("banquet") ||
    room.includes("lawn") ||
    room.includes("boardroom") ||
    eventType ||
    req.includes("wedding") ||
    req.includes("celebration") ||
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

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/enquiries");
    } catch {
      // Invariant: static generation store missing outside active Next.js request context
    }
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

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/enquiries");
    } catch {
      // Invariant: static generation store missing outside active Next.js request context
    }
    revalidatePath("/admin/rooms");

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to delete inquiry." };
  }
}

/**
 * Add / update internal note for an inquiry
 */
export async function addEnquiryNoteAction(
  enquiryId: string,
  note: string,
  author?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const formattedNote = `[${new Date().toLocaleDateString()}] ${author || "Admin"}: ${note}`;
      const { error } = await supabase
        .from("reservations")
        .update({ special_request: formattedNote })
        .eq("id", enquiryId);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/admin/enquiries");
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to save note." };
  }
}

