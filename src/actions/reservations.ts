"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export type ReservationStatus = "new" | "contacted" | "confirmed" | "cancelled";

export interface ReservationRecord {
  id: string;
  created_at: string;
  check_in: string;
  check_out: string;
  room_type: string;
  guests: number;
  full_name: string;
  phone: string;
  email: string | null;
  special_request: string | null;
  estimated_total: number;
  status: ReservationStatus;
}

export interface SubmitReservationInput {
  fullName: string;
  phone: string;
  email?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  guests: number;
  specialRequest?: string;
  estimatedTotal: number;
  honeypot?: string;
}

/**
 * Public Server Action to submit a guest reservation request directly to public.reservations.
 * Uses the Supabase client with the public anon key.
 * Strictly avoids .select() to adhere to anon-insert-only RLS policy.
 */
export async function submitReservationAction(input: SubmitReservationInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Honeypot anti-spam check
    if (input.honeypot && input.honeypot.trim().length > 0) {
      console.warn("[Reservation] Spam submission rejected via honeypot.");
      return { success: false, error: "Invalid submission detected." };
    }

    // 2. Name validation
    const fullName = input.fullName?.trim();
    if (!fullName || fullName.length < 2) {
      return { success: false, error: "Please enter your full name (minimum 2 characters)." };
    }
    if (fullName.length > 100) {
      return { success: false, error: "Name must not exceed 100 characters." };
    }

    // 3. Phone validation
    const phone = input.phone?.trim();
    if (!phone) {
      return { success: false, error: "A contact phone number is required." };
    }
    const cleanPhoneDigits = phone.replace(/\D/g, "");
    if (cleanPhoneDigits.length < 8 || cleanPhoneDigits.length > 15) {
      return {
        success: false,
        error: "Please enter a valid phone number (8 to 15 digits, e.g. +91 98727 68514).",
      };
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
    const d1 = new Date(input.checkIn);
    const d2 = new Date(input.checkOut);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return { success: false, error: "Invalid reservation dates provided." };
    }
    if (d2.getTime() <= d1.getTime()) {
      return { success: false, error: "Check-out date must be strictly after the check-in date." };
    }

    // 6. Room type & guests
    const roomType = input.roomType?.trim();
    if (!roomType) {
      return { success: false, error: "Please select a luxury room or suite." };
    }
    const guests = Number(input.guests);
    if (isNaN(guests) || guests < 1 || guests > 10) {
      return { success: false, error: "Guests must be between 1 and 10." };
    }

    // 7. Special requests & estimated total
    const specialRequest = input.specialRequest?.trim() ? input.specialRequest.trim().slice(0, 500) : null;
    const estimatedTotal = Number(input.estimatedTotal) >= 0 ? Math.round(Number(input.estimatedTotal)) : 0;

    // 8. Connect to Supabase using Anon client (server or direct anon)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { success: false, error: "Supabase service is currently unconfigured." };
    }

    const client = createSupabaseClient(supabaseUrl, anonKey);

    // CRITICAL: DO NOT CHAIN .select()!
    // Supabase RLS allows anon INSERT only. Chaining .select() requests RETURNING *
    // which triggers SELECT permission checks and causes Postgres code 42501 error.
    const { error, status } = await client.from("reservations").insert({
      check_in: input.checkIn,
      check_out: input.checkOut,
      room_type: roomType,
      guests,
      full_name: fullName,
      phone,
      email,
      special_request: specialRequest,
      estimated_total: estimatedTotal,
      status: "new",
    });

    if (error) {
      console.error("[Reservation] Supabase anon insert error:", error);
      return { success: false, error: `Failed to confirm reservation: ${error.message}` };
    }

    if (status !== 201 && status !== 200 && status !== 204) {
      console.error("[Reservation] Unexpected HTTP status on insert:", status);
      return { success: false, error: "Unexpected response from database. Please try again." };
    }

    // Revalidate admin views
    try {
      revalidatePath("/admin");
      revalidatePath("/admin/rooms");
      revalidatePath("/admin/enquiries");
    } catch {}

    return { success: true };
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

    return {
      success: true,
      reservations: (data as ReservationRecord[]) || [],
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
 */
export async function updateReservationStatusAction(
  id: string,
  status: ReservationStatus
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const validStatuses: ReservationStatus[] = ["new", "contacted", "confirmed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: `Invalid status '${status}'.` };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database connection unavailable." };
    }

    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(`[Reservation] Failed to update status for ${id}:`, error);
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
    console.error("[Reservation] Exception updating status:", error);
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
