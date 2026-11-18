"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import { validateIndianPhone, HOTEL_CONFIG, DEFAULT_ROOM_TYPES } from "@/config/hotel";

export type ReservationStatus =
  | "new"
  | "contacted"
  | "in_discussion"
  | "confirmed"
  | "converted"
  | "cancelled"
  | "closed"
  | "paid"
  | "pending"
  | "failed"
  | "expired"
  | "refunded";

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
  amount_paid?: number;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
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
    if (roomsRequested < 1 || roomsRequested > HOTEL_CONFIG.totalHotelKeys) {
      return { success: false, error: `You can book between 1 and ${HOTEL_CONFIG.totalHotelKeys} rooms per reservation.` };
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

      // If RPC doesn't exist or returns legacy 3-room constraint error, complete using verified server-side fallback
      if (
        msg.includes("INVALID_ROOMS") ||
        (msg.includes("function") && msg.includes("does not exist"))
      ) {
        console.warn("[Reservation] Using server-side verified fallback for reservation creation:", msg);
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const dbClient = serviceKey ? createSupabaseClient(supabaseUrl, serviceKey) : client;

        // Fetch room type info
        const { data: rtRows } = await dbClient
          .from("room_types")
          .select("*")
          .eq("code", roomTypeCode)
          .eq("is_active", true)
          .limit(1);

        const roomInfo = (rtRows && rtRows.length > 0)
          ? {
              code: rtRows[0].code,
              name: rtRows[0].name,
              pricePerNight: Number(rtRows[0].price_per_night),
              totalRooms: Number(rtRows[0].total_rooms),
              maxGuests: Number(rtRows[0].max_guests),
            }
          : DEFAULT_ROOM_TYPES.find((r) => r.code === roomTypeCode) || DEFAULT_ROOM_TYPES[0];

        // Validate guest capacity
        if (guests > roomInfo.maxGuests * roomsRequested) {
          return {
            success: false,
            error: `${roomInfo.name} accommodates up to ${roomInfo.maxGuests * roomsRequested} guests across ${roomsRequested} room(s).`,
          };
        }

        // Validate real inventory availability
        const { data: availData } = await dbClient.rpc("get_room_availability", {
          p_check_in: input.checkIn,
          p_check_out: input.checkOut,
        });

        if (availData && Array.isArray(availData)) {
          const matchAvail = availData.find((a: any) => a.code === roomTypeCode);
          if (matchAvail && matchAvail.rooms_left < roomsRequested) {
            return {
              success: false,
              error: `${roomInfo.name} has only ${matchAvail.rooms_left} room(s) available for your selected dates (${roomsRequested} requested).`,
            };
          }
        }

        const subtotal = diffNights * roomInfo.pricePerNight * roomsRequested;
        const gst = Math.round(subtotal * HOTEL_CONFIG.gstRate);
        const total = subtotal + gst;
        const refCode = `FRM-${Math.floor(100000 + Math.random() * 900000)}`;

        const { error: insertErr } = await dbClient.from("reservations").insert({
          check_in: input.checkIn,
          check_out: input.checkOut,
          room_type: roomInfo.name,
          room_type_code: roomInfo.code,
          guests,
          rooms_requested: roomsRequested,
          nights: diffNights,
          full_name: fullName,
          phone: phoneCheck.cleanPhone,
          email: email || null,
          special_request: specialRequest,
          estimated_total: total,
          reference_code: refCode,
          status: "new",
          channel: "room_reservation",
        });

        if (insertErr) {
          console.error("[Reservation] Direct insert error:", insertErr.message);
          return { success: false, error: insertErr.message };
        }

        try {
          revalidatePath("/admin");
          revalidatePath("/admin/rooms");
          revalidatePath("/admin/enquiries");
        } catch {}

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
    }

    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    const bookingsByRef = new Map<string, any>();
    if (bookingsData && bookingsData.length > 0) {
      for (const b of bookingsData) {
        if (b.booking_ref) {
          bookingsByRef.set(b.booking_ref, b);
        }
      }
    }

    const seenRefs = new Set<string>();
    const list: ReservationRecord[] = [];

    // Map existing reservations
    if (data && data.length > 0) {
      for (const row of data) {
        const ref = row.reference_code || `FRM-${row.id.slice(0, 6).toUpperCase()}`;
        seenRefs.add(ref);
        const linkedBooking = bookingsByRef.get(ref);

        list.push({
          id: row.id,
          created_at: row.created_at,
          check_in: row.check_in,
          check_out: row.check_out,
          room_type: row.room_type,
          room_type_code: row.room_type_code || linkedBooking?.room_category || null,
          rooms_requested: Number(row.rooms_requested) || Number(linkedBooking?.rooms_requested) || 1,
          nights: row.nights ? Number(row.nights) : (row.check_in && row.check_out ? Math.max(1, Math.round((new Date(row.check_out).getTime() - new Date(row.check_in).getTime()) / 86400000)) : 1),
          reference_code: ref,
          guests: Number(row.guests) || Number(linkedBooking?.guests) || 1,
          full_name: row.full_name,
          phone: row.phone,
          email: row.email || linkedBooking?.email || null,
          special_request: row.special_request || linkedBooking?.special_requests || null,
          estimated_total: Number(linkedBooking?.total_amount || row.estimated_total || 0),
          status: (linkedBooking?.status || row.status) as ReservationStatus,
          capacity_override: Boolean(row.capacity_override),
          channel: linkedBooking ? "razorpay" : (row.channel || "room_reservation"),
          amount_paid: Number(linkedBooking?.amount_paid || 0),
          razorpay_order_id: linkedBooking?.razorpay_order_id || null,
          razorpay_payment_id: linkedBooking?.razorpay_payment_id || null,
          payment_method: linkedBooking?.payment_method || null,
          paid_at: linkedBooking?.paid_at || null,
        });
      }
    }

    // Add any bookings not yet in reservations (pending, failed, or direct)
    if (bookingsData && bookingsData.length > 0) {
      const categoryMap: Record<string, string> = {
        "deluxe-king": "Deluxe King Room",
        "premier-executive": "Premier Executive Suite",
        "royal-fremont": "The Royal Fremont Suite",
        "presidential-penthouse": "Presidential Penthouse",
      };

      for (const b of bookingsData) {
        if (!seenRefs.has(b.booking_ref)) {
          seenRefs.add(b.booking_ref);
          list.push({
            id: b.id,
            created_at: b.created_at,
            check_in: b.check_in,
            check_out: b.check_out,
            room_type: categoryMap[b.room_category] || b.room_category,
            room_type_code: b.room_category,
            rooms_requested: b.rooms_requested || 1,
            nights: b.nights || 1,
            reference_code: b.booking_ref,
            guests: b.guests || 1,
            full_name: b.guest_name,
            phone: b.phone,
            email: b.email,
            special_request: b.special_requests,
            estimated_total: Number(b.total_amount || 0),
            status: b.status as ReservationStatus,
            channel: "razorpay",
            amount_paid: Number(b.amount_paid || 0),
            razorpay_order_id: b.razorpay_order_id,
            razorpay_payment_id: b.razorpay_payment_id,
            payment_method: b.payment_method,
            paid_at: b.paid_at,
          });
        }
      }
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      success: true,
      reservations: list,
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

    // Sync with public.bookings table (for online Razorpay bookings)
    const bookingStatusMap: Record<string, string> = {
      cancelled: "cancelled",
      refunded: "refunded",
      confirmed: "paid",
      converted: "paid",
      paid: "paid",
      closed: "cancelled",
    };

    const targetBookingStatus = bookingStatusMap[status] || status;
    try {
      await supabase
        .from("bookings")
        .update({
          status: targetBookingStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},booking_ref.eq.${id}`);
    } catch (bookingSyncErr) {
      console.warn("[Reservation] Warning syncing with bookings:", bookingSyncErr);
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

    // Sync with public.bookings table (for online Razorpay bookings)
    const bookingStatusMap: Record<string, string> = {
      cancelled: "cancelled",
      refunded: "refunded",
      confirmed: "paid",
      converted: "paid",
      paid: "paid",
      closed: "cancelled",
    };

    const targetBookingStatus = bookingStatusMap[status] || status;
    try {
      await supabase
        .from("bookings")
        .update({
          status: targetBookingStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},booking_ref.eq.${id}`);
    } catch (bookingSyncErr) {
      console.warn("[Reservation] Warning syncing with bookings:", bookingSyncErr);
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
