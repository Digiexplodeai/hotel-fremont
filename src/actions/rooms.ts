"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { roomCategories as defaultRoomCategories } from "@/data/rooms";
import { revalidatePath } from "next/cache";

export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance" | "blocked";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export interface PhysicalRoom {
  id: string;
  roomNumber: string;
  categorySlug: string;
  categoryName: string;
  floor: number;
  status: RoomStatus;
  notes?: string;
  currentBooking?: {
    bookingCode: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
  } | null;
}

export interface BookingRecord {
  id: string;
  bookingCode: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  categorySlug: string;
  categoryName: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalAmount: number;
  advancePaid: number;
  amountPaid?: number;
  status: BookingStatus;
  source: string;
  notes?: string;
  createdAt: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentMethod?: string;
  paidAt?: string;
  roomsRequested?: number;
  mealPlan?: string;
  occupancy?: string;
  ratePerNight?: number;
  baseAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
}

// Exactly 21 Physical Rooms Inventory across 3 categories
const defaultPhysicalRooms: PhysicalRoom[] = [
  // 9 Deluxe Rooms (Floor 1: 101 - 109)
  { id: "room-101", roomNumber: "101", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },
  { id: "room-102", roomNumber: "102", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },
  { id: "room-103", roomNumber: "103", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },
  { id: "room-104", roomNumber: "104", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },
  { id: "room-105", roomNumber: "105", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },
  { id: "room-106", roomNumber: "106", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },
  { id: "room-107", roomNumber: "107", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },
  { id: "room-108", roomNumber: "108", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },
  { id: "room-109", roomNumber: "109", categorySlug: "deluxe-room", categoryName: "Deluxe Room", floor: 1, status: "available" },

  // 10 Super Deluxe Rooms (Floor 2: 201 - 210)
  { id: "room-201", roomNumber: "201", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-202", roomNumber: "202", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-203", roomNumber: "203", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-204", roomNumber: "204", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-205", roomNumber: "205", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-206", roomNumber: "206", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-207", roomNumber: "207", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-208", roomNumber: "208", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-209", roomNumber: "209", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },
  { id: "room-210", roomNumber: "210", categorySlug: "super-deluxe-room", categoryName: "Super Deluxe Room", floor: 2, status: "available" },

  // 2 Premium Rooms (Floor 3: 301, 302)
  { id: "room-301", roomNumber: "301", categorySlug: "premium-room", categoryName: "Premium Room", floor: 3, status: "available" },
  { id: "room-302", roomNumber: "302", categorySlug: "premium-room", categoryName: "Premium Room", floor: 3, status: "available" },
];

let memoryRooms: PhysicalRoom[] = [...defaultPhysicalRooms];
let memoryBookings: BookingRecord[] = [];

/**
 * Fetch all 21 physical rooms with current status
 */
export async function getRoomsWithStatusAction(): Promise<{
  success: boolean;
  rooms: PhysicalRoom[];
  isDatabase: boolean;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: true, rooms: memoryRooms, isDatabase: false };
    }

    const { data: dbRooms, error } = await supabase
      .from("rooms")
      .select("id, room_number, category_slug, floor, status, notes")
      .order("room_number", { ascending: true });

    if (error || !dbRooms || dbRooms.length === 0) {
      return { success: true, rooms: memoryRooms, isDatabase: false };
    }

    const categoryMap: Record<string, string> = {
      "deluxe-room": "Deluxe Room",
      "super-deluxe-room": "Super Deluxe Room",
      "premium-room": "Premium Room",
      "deluxe-king": "Deluxe Room",
      "premier-executive": "Super Deluxe Room",
      "royal-fremont": "Premium Room",
    };

    const mapped: PhysicalRoom[] = dbRooms.map((r) => {
      const memMatch = memoryRooms.find((m) => m.roomNumber === r.room_number);
      return {
        id: r.id,
        roomNumber: r.room_number,
        categorySlug: r.category_slug,
        categoryName: categoryMap[r.category_slug] || r.category_slug,
        floor: r.floor,
        status: r.status as RoomStatus,
        notes: r.notes || "",
        currentBooking: memMatch?.currentBooking || null,
      };
    });

    return { success: true, rooms: mapped, isDatabase: true };
  } catch (err) {
    console.warn("Fallback to memory rooms:", err);
    return { success: true, rooms: memoryRooms, isDatabase: false };
  }
}

/**
 * Update room status (available, occupied, cleaning, maintenance, blocked)
 */
export async function updateRoomStatusAction(
  roomNumber: string,
  status: RoomStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    memoryRooms = memoryRooms.map((r) => {
      if (r.roomNumber === roomNumber) {
        return { ...r, status, notes: notes !== undefined ? notes : r.notes };
      }
      return r;
    });

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase
        .from("rooms")
        .update({ status, notes, updated_at: new Date().toISOString() })
        .eq("room_number", roomNumber);
    }

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update room";
    return { success: false, error: message };
  }
}

/**
 * Fetch all bookings (from public.bookings table or memory)
 */
export async function getBookingsAction(): Promise<{
  success: boolean;
  bookings: BookingRecord[];
  isDatabase: boolean;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: true, bookings: memoryBookings, isDatabase: false };
    }

    const { data: dbBookings, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !dbBookings) {
      return { success: true, bookings: memoryBookings, isDatabase: false };
    }

    const categoryMap: Record<string, string> = {
      "deluxe-room": "Deluxe Room",
      "super-deluxe-room": "Super Deluxe Room",
      "premium-room": "Premium Room",
      "deluxe-king": "Deluxe Room",
      "premier-executive": "Super Deluxe Room",
      "royal-fremont": "Premium Room",
    };

    const mapped: BookingRecord[] = dbBookings.map((b) => ({
      id: b.id,
      bookingCode: b.booking_ref || `FRM-${b.id.slice(0, 6).toUpperCase()}`,
      guestName: b.guest_name,
      guestPhone: b.phone,
      guestEmail: b.email,
      categorySlug: b.room_category,
      categoryName: categoryMap[b.room_category] || b.room_category,
      roomNumber: b.room_number || undefined,
      checkIn: b.check_in,
      checkOut: b.check_out,
      guestsCount: b.guests || 1,
      totalAmount: Number(b.total_amount) || 0,
      advancePaid: Number(b.amount_paid) || 0,
      amountPaid: Number(b.amount_paid) || 0,
      status: b.status as BookingStatus,
      source: "website",
      notes: b.special_requests || "",
      createdAt: b.created_at,
      razorpayPaymentId: b.razorpay_payment_id || undefined,
      razorpayOrderId: b.razorpay_order_id || undefined,
      paymentMethod: b.payment_method || undefined,
      paidAt: b.paid_at || undefined,
      roomsRequested: b.rooms_requested || b.rooms_count || 1,
      mealPlan: b.meal_plan || "without_breakfast",
      occupancy: b.occupancy || "double",
      ratePerNight: b.rate_per_night ? Number(b.rate_per_night) : undefined,
      baseAmount: b.base_amount ? Number(b.base_amount) : undefined,
      gstPercent: b.gst_percent ? Number(b.gst_percent) : undefined,
      gstAmount: b.gst_amount ? Number(b.gst_amount) : undefined,
    }));

    return { success: true, bookings: mapped, isDatabase: true };
  } catch {
    return { success: true, bookings: memoryBookings, isDatabase: false };
  }
}

/**
 * Update a booking status
 */
export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: BookingStatus,
  roomNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    memoryBookings = memoryBookings.map((b) => {
      if (b.id === bookingId) {
        return { ...b, status: newStatus, roomNumber: roomNumber || b.roomNumber };
      }
      return b;
    });

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const updateData: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (roomNumber) {
        updateData.room_number = roomNumber;
      }
      await supabase.from("bookings").update(updateData).eq("id", bookingId);
    }

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update booking";
    return { success: false, error: message };
  }
}

/**
 * Create a booking manually from the admin panel
 */
export async function createBookingAction(data: {
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  categorySlug: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalAmount?: number;
  advancePaid?: number;
  source?: string;
  notes?: string;
}): Promise<{ success: boolean; bookingCode?: string; error?: string }> {
  try {
    const bookingCode = `FRM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newBooking: BookingRecord = {
      id: `booking-${Date.now()}`,
      bookingCode,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail,
      categorySlug: data.categorySlug,
      categoryName: data.categorySlug,
      roomNumber: data.roomNumber,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guestsCount: data.guestsCount,
      totalAmount: data.totalAmount || 0,
      advancePaid: data.advancePaid || 0,
      amountPaid: data.advancePaid || 0,
      status: "confirmed",
      source: data.source || "front_desk",
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    memoryBookings.unshift(newBooking);

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.from("bookings").insert({
        booking_ref: bookingCode,
        access_token: Math.random().toString(36).substring(2),
        guest_name: data.guestName,
        phone: data.guestPhone,
        email: data.guestEmail || "walkin@hotelfremont.in",
        room_category: data.categorySlug,
        rooms_requested: 1,
        check_in: data.checkIn,
        check_out: data.checkOut,
        nights: Math.max(1, Math.round((new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / (1000 * 3600 * 24))),
        guests: data.guestsCount,
        total_amount: data.totalAmount || 0,
        amount_paid: data.advancePaid || 0,
        status: "confirmed",
        expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
        special_requests: data.notes,
      });
    }

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    return { success: true, bookingCode };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create booking";
    return { success: false, error: message };
  }
}
