"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import { validateIndianPhone, HOTEL_CONFIG, DEFAULT_ROOM_TYPES } from "@/config/hotel";

export type ReservationStatus = "new" | "contacted" | "in_discussion" | "confirmed" | "converted" | "cancelled" | "closed";

export interface ReservationRecord {
  id: string;
  created_at: string;
  check_in: string;
  check_out: string;
  room_type: string;
  room_type_code?: string | null;
  rooms_requested: number;
  nights?: number | null;
  reference_code?: string | null;
  guests: number;
  full_name: string;
  phone: string;
  email: string | null;
  special_request: string | null;
  estimated_total: number;
  status: ReservationStatus;
  capacity_override?: boolean;
  channel?: string;
}

export interface SubmitReservationInput {
  fullName: string;
  phone: string;
  email?: string;
  checkIn: string;
  checkOut: string;
  roomTypeCode: string;
  guests: number;
  roomsRequested?: number;
  specialRequest?: string;
  honeypot?: string;
}

/**
 * Public Server Action to submit a guest reservation request directly to Supabase.
 * Uses atomic RPC `create_reservation` with the public anon key.
 * Never trusts client price; calculates nights, rates and 18% GST server-side.
 */
export async function submitReservationAction(input: SubmitReservationInput): Promise<{
  success: boolean;
  referenceCode?: string;
  nights?: number;
  roomsRequested?: number;
  estimatedTotal?: number;
  error?: string;
}> {
  try {
    // 1. Honeypot anti-spam check
    if (input.honeypot && input.honeypot.trim().length > 0) {
      console.warn("[Reservation] Spam submission rejected via honeypot.");
      return { success: false, error: "Invalid submission detected." };
    }

    // 2. Full Name validation
    const fullName = input.fullName?.trim();
    if (!fullName || fullName.length < 2) {
      return { success: false, error: "Please enter your full name (minimum 2 characters)." };
    }
    if (fullName.length > 100) {
      return { success: false, error: "Full name must not exceed 100 characters." };
    }

    // 3. Indian Phone validation (10 digits)
    const phoneCheck = validateIndianPhone(input.phone);
    if (!phoneCheck.isValid) {
      return { success: false, error: phoneCheck.error || "Please enter a valid 10-digit Indian phone number." };
    }

    // 4. Email validation (nullable)
    let email: string | null = null;
    if (input.email && input.email.trim().length > 0) {
      const trimmedEmail = input.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return { success: false, error: "Please enter a valid email address." };
      }
      if (trimmedEmail.length > 100) {
        return { success: false, error: "Email must not exceed 100 characters." };
      }
      email = trimmedEmail;
    }

    // 5. Dates validation
    if (!input.checkIn || !input.checkOut) {
      return { success: false, error: "Check-in and check-out dates are required." };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (input.checkIn < todayStr) {
      return { success: false, error: "Check-in date cannot be in the past." };
    }

    if (input.checkOut <= input.checkIn) {
      return { success: false, error: "Check-out date must be strictly after the check-in date." };
    }

    const d1 = new Date(input.checkIn);
    const d2 = new Date(input.checkOut);
    const diffNights = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    if (isNaN(diffNights) || diffNights < 1) {
      return { success: false, error: "Stay must be at least 1 night." };
    }
    if (diffNights > HOTEL_CONFIG.maxStayNights) {
      return { success: false, error: `Maximum stay duration is ${HOTEL_CONFIG.maxStayNights} nights.` };
    }

    // 6. Room type & Guests
    const roomTypeCode = input.roomTypeCode?.trim();
    if (!roomTypeCode) {
      return { success: false, error: "Please select a luxury suite." };
    }

    const roomsRequested = Number(input.roomsRequested) || 1;
    if (roomsRequested < 1 || roomsRequested > HOTEL_CONFIG.maxRoomsPerBooking) {
      return { success: false, error: `You can book between 1 and ${HOTEL_CONFIG.maxRoomsPerBooking} rooms per reservation.` };
    }

    const guests = Number(input.guests);
    if (isNaN(guests) || guests < 1) {
      return { success: false, error: "Please select the number of guests." };
    }

    const specialRequest = input.specialRequest?.trim() ? input.specialRequest.trim().slice(0, 500) : null;

    // 7. Connect to Supabase using Anon client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { success: false, error: "Supabase service is currently unconfigured." };
    }

    const client = createSupabaseClient(supabaseUrl, anonKey);

    // 8. Execute create_reservation RPC
    const { data: rpcData, error: rpcError } = await client.rpc("create_reservation", {
      p_full_name: fullName,
      p_phone: phoneCheck.cleanPhone,
      p_email: email,
      p_check_in: input.checkIn,
      p_check_out: input.checkOut,
      p_room_type_code: roomTypeCode,
      p_guests: guests,
      p_rooms_requested: roomsRequested,
      p_special_request: specialRequest,
      p_channel: "room_reservation",
    });

    if (rpcError) {
      console.warn("[Reservation] RPC create_reservation returned:", rpcError.message);

      // Check if it's a known domain validation error from the RPC
      const msg = rpcError.message || "";
      if (msg.includes("ROOM_SOLD_OUT")) {
        return {
          success: false,
          error: "Selected suite is sold out for these dates. Please choose different dates or suite.",
        };
      }
      if (msg.includes("GUESTS_EXCEEDED")) {
        return {
          success: false,
          error: "Guest count exceeds suite capacity. Please select fewer guests or book additional rooms.",
        };
      }
      if (msg.includes("INVALID_PHONE")) {
        return { success: false, error: "Please provide a valid 10-digit Indian phone number." };
      }
      if (msg.includes("INVALID_CHECK_IN")) {
        return { success: false, error: "Check-in date cannot be in the past." };
      }
      if (msg.includes("INVALID_CHECK_OUT")) {
        return { success: false, error: "Check-out date must be strictly after check-in." };
      }

      // If RPC doesn't exist yet (e.g. migration pending), attempt safe direct fallback insert
      if (msg.includes("function") && msg.includes("does not exist")) {
        console.warn("[Reservation] create_reservation RPC missing. Falling back to direct insert.");
        const fallbackRoom = DEFAULT_ROOM_TYPES.find((r) => r.code === roomTypeCode) || DEFAULT_ROOM_TYPES[0];
        const subtotal = diffNights * fallbackRoom.pricePerNight * roomsRequested;
        const total = Math.round(subtotal * 1.18);
        const refCode = `FRM-${Math.floor(100000 + Math.random() * 900000)}`;

        const { error: insertErr } = await client.from("reservations").insert({
          check_in: input.checkIn,
          check_out: input.checkOut,
          room_type: fallbackRoom.name,
          guests,
          full_name: fullName,
          phone: phoneCheck.cleanPhone,
          email,
          special_request: specialRequest,
          estimated_total: total,
          status: "new",
        });

        if (insertErr) {
          return { success: false, error: insertErr.message };
        }

        return {
          success: true,
          referenceCode: refCode,
          nights: diffNights,
          roomsRequested,
          estimatedTotal: total,
        };
      }

      return { success: false, error: rpcError.message };
    }

    // Success via RPC!
    try {
      revalidatePath("/admin");
      revalidatePath("/admin/rooms");
      revalidatePath("/admin/enquiries");
    } catch {}

    return {
      success: true,
      referenceCode: rpcData?.reference_code,
      nights: rpcData?.nights || diffNights,
      roomsRequested: rpcData?.rooms_requested || roomsRequested,
      estimatedTotal: rpcData?.estimated_total,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Reservation] Exception submitting reservation:", error);
    return { success: false, error: error.message || "An unexpected error occurred. Please try again." };
  }
}

/**
 * Fetch all reservations from public.reservations (newest first).
 * Strictly requires authenticated admin session.
 */
export async function getReservationsAction(): Promise<{
  success: boolean;
  error?: string;
  reservations: ReservationRecord[];
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Unauthorized: Admin session required.",
        reservations: [],
      };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: "Database connection unavailable.",
        reservations: [],
      };
    }

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Reservation] Error reading reservations:", error);
      return {
        success: false,
        error: error.message,
        reservations: [],
      };
    }

    const reservations: ReservationRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      check_in: row.check_in,
      check_out: row.check_out,
      room_type: row.room_type,
      room_type_code: row.room_type_code || null,
      rooms_requested: Number(row.rooms_requested) || 1,
      nights: row.nights ? Number(row.nights) : (row.check_in && row.check_out ? Math.max(1, Math.round((new Date(row.check_out).getTime() - new Date(row.check_in).getTime()) / 86400000)) : 1),
      reference_code: row.reference_code || `FRM-${row.id.slice(0, 6).toUpperCase()}`,
      guests: Number(row.guests) || 1,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      special_request: row.special_request,
      estimated_total: Number(row.estimated_total) || 0,
      status: row.status,
      capacity_override: Boolean(row.capacity_override),
      channel: row.channel || "room_reservation",
    }));

    return {
      success: true,
      reservations,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Reservation] Exception reading reservations:", error);
    return {
      success: false,
      error: error.message || "Failed to load reservations.",
      reservations: [],
    };
  }
}

/**
 * Updates a reservation's status in public.reservations.
 * Strictly requires authenticated admin session.
 * Catches database OVERBOOKING_GUARD and returns structured requiresOverride flag.
 */
export async function updateReservationStatusAction(
  id: string,
  status: ReservationStatus,
  override: boolean = false
): Promise<{
  success: boolean;
  requiresOverride?: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database connection unavailable." };
    }

    const updatePayload: Record<string, any> = { status };
    if (override) {
      updatePayload.capacity_override = true;
    }

    const { error } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      if (error.message.includes("OVERBOOKING_GUARD")) {
        return {
          success: false,
          requiresOverride: true,
          error: "Inventory capacity exceeded for these dates. Management override required to confirm.",
        };
      }
      return { success: false, error: error.message };
    }

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/rooms");
      revalidatePath("/admin/enquiries");
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to update reservation status." };
  }
}

/**
 * Deletes a reservation row from public.reservations.
 * Strictly requires authenticated admin session.
 */
export async function deleteReservationAction(id: string): Promise<{
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
      return { success: false, error: "Database connection unavailable." };
    }

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`[Reservation] Failed to delete reservation ${id}:`, error);
      return { success: false, error: error.message };
    }

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/rooms");
      revalidatePath("/admin/enquiries");
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Reservation] Exception deleting reservation:", error);
    return { success: false, error: error.message || "Failed to delete reservation." };
  }
}
