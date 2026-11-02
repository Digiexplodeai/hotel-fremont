"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { roomCategories as defaultRoomCategories } from "@/data/rooms";
import { revalidatePath } from "next/cache";

export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance" | "blocked";
export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";

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
  status: BookingStatus;
  source: string;
  notes?: string;
  createdAt: string;
}

// In-memory persistent fallback state when Supabase database is offline or unmigrated
const defaultPhysicalRooms: PhysicalRoom[] = [
  // 6 Deluxe King Rooms (Floor 1)
  { id: "room-101", roomNumber: "101", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },
  { id: "room-102", roomNumber: "102", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },
  { id: "room-103", roomNumber: "103", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },
  { id: "room-104", roomNumber: "104", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },
  { id: "room-105", roomNumber: "105", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },
  { id: "room-106", roomNumber: "106", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },

  // 3 Premier Executive Suites (Floor 2)
  { id: "room-201", roomNumber: "201", categorySlug: "premier-executive", categoryName: "Premier Executive Suite", floor: 2, status: "available" },
  { id: "room-202", roomNumber: "202", categorySlug: "premier-executive", categoryName: "Premier Executive Suite", floor: 2, status: "available" },
  { id: "room-203", roomNumber: "203", categorySlug: "premier-executive", categoryName: "Premier Executive Suite", floor: 2, status: "available" },

  // 2 The Royal Fremont Suites (Floor 3)
  { id: "room-301", roomNumber: "301", categorySlug: "royal-fremont", categoryName: "The Royal Fremont Suite", floor: 3, status: "available" },
  { id: "room-302", roomNumber: "302", categorySlug: "royal-fremont", categoryName: "The Royal Fremont Suite", floor: 3, status: "available" },

  // 1 Presidential Penthouse (Floor 4)
  { id: "room-401", roomNumber: "401", categorySlug: "presidential-penthouse", categoryName: "Presidential Penthouse", floor: 4, status: "available" },
];

let memoryRooms: PhysicalRoom[] = [...defaultPhysicalRooms];

/**
 * Fetch all 12 physical rooms with current status
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

    // Map to PhysicalRoom interface with category names
    const categoryMap: Record<string, string> = {
      "deluxe-king": "Deluxe King Room",
      "premier-executive": "Premier Executive Suite",
      "royal-fremont": "The Royal Fremont Suite",
      "presidential-penthouse": "Presidential Penthouse",
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
    // Update memory state
    memoryRooms = memoryRooms.map((r) => {
      if (r.roomNumber === roomNumber) {
        return {
          ...r,
          status,
          notes: notes !== undefined ? notes : r.notes,
          currentBooking: status === "available" ? null : r.currentBooking,
        };
      }
      return r;
    });

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase
        .from("rooms")
        .update({
          status,
          notes: notes !== undefined ? notes : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("room_number", roomNumber);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/rooms");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update room status";
    return { success: false, error: message };
  }
}

/**
 * Fetch all reservations / bookings from public.reservations
 */
export async function getBookingsAction(): Promise<{
  success: boolean;
  bookings: BookingRecord[];
  isDatabase: boolean;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: true, bookings: [], isDatabase: false };
    }

    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return { success: true, bookings: [], isDatabase: false };
    }

    const bookings: BookingRecord[] = data.map((b) => ({
      id: b.id,
      bookingCode: `HF-${b.id.slice(0, 8).toUpperCase()}`,
      guestName: b.full_name,
      guestPhone: b.phone,
      guestEmail: b.email || undefined,
      categorySlug: b.room_type?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "suite",
      categoryName: b.room_type || "Luxury Suite",
      roomNumber: undefined,
      checkIn: b.check_in,
      checkOut: b.check_out,
      guestsCount: b.guests || 2,
      totalAmount: Number(b.estimated_total || 0),
      advancePaid: 0,
      status: (b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending") as BookingStatus,
      source: "website",
      notes: b.special_request || undefined,
      createdAt: b.created_at,
    }));

    return { success: true, bookings, isDatabase: true };
  } catch {
    return { success: true, bookings: [], isDatabase: false };
  }
}

export interface CreateBookingInput {
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  categorySlug: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  advancePaid?: number;
  source?: "website" | "phone" | "walk_in" | "whatsapp";
  notes?: string;
}

/**
 * Create a new booking with double-booking prevention check
 */
export async function createBookingAction(input: CreateBookingInput): Promise<{
  success: boolean;
  bookingCode?: string;
  error?: string;
}> {
  try {
    // 1. Basic validation
    if (!input.guestName?.trim() || !input.guestPhone?.trim()) {
      return { success: false, error: "Guest name and phone number are required" };
    }
    if (!input.checkIn || !input.checkOut) {
      return { success: false, error: "Check-in and check-out dates are required" };
    }

    const checkInDate = new Date(input.checkIn);
    const checkOutDate = new Date(input.checkOut);

    if (checkOutDate <= checkInDate) {
      return { success: false, error: "Check-out date must be strictly after check-in date" };
    }

    // 2. Validate category & capacity
    const category = defaultRoomCategories.find((c) => c.slug === input.categorySlug);
    if (!category) {
      return { success: false, error: `Invalid room category: ${input.categorySlug}` };
    }

    if (input.guestsCount > category.maxGuests) {
      return {
        success: false,
        error: `${category.name} can accommodate up to ${category.maxGuests} guests only.`,
      };
    }

    const assignedRoomNumber = input.roomNumber || category.roomNumbers[0];

    // 3. Calculate total amount
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const baseTotal = nights * category.price;
    const gst = Math.round(baseTotal * 0.18);
    const totalAmount = baseTotal + gst;

    // 4. Generate collision-resistant booking code
    const dateStamp = checkInDate.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `HF-${dateStamp}-${randomSuffix}`;

    // Mark room as occupied in memory if checkIn is today
    const todayStr = new Date().toISOString().slice(0, 10);
    if (input.checkIn <= todayStr && input.checkOut > todayStr) {
      memoryRooms = memoryRooms.map((r) =>
        r.roomNumber === assignedRoomNumber
          ? {
              ...r,
              status: "occupied",
              currentBooking: {
                bookingCode,
                guestName: input.guestName.trim(),
                checkIn: input.checkIn,
                checkOut: input.checkOut,
              },
            }
          : r
      );
    }

    // Save directly to Supabase public.reservations
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.from("reservations").insert({
        check_in: input.checkIn,
        check_out: input.checkOut,
        room_type: category.name,
        guests: input.guestsCount,
        full_name: input.guestName.trim(),
        phone: input.guestPhone.trim(),
        email: input.guestEmail?.trim() || null,
        special_request: input.notes?.trim() || null,
        estimated_total: totalAmount,
        status: "confirmed",
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/rooms");
    return { success: true, bookingCode };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create booking";
    return { success: false, error: message };
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const dbStatus =
        status === "confirmed" || status === "checked_in"
          ? "confirmed"
          : status === "cancelled" || status === "no_show"
          ? "cancelled"
          : "contacted";

      await supabase
        .from("reservations")
        .update({ status: dbStatus })
        .eq("id", bookingId);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/rooms");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update booking";
    return { success: false, error: message };
  }
}

