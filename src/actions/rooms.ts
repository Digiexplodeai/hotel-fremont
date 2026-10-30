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
  { id: "room-102", roomNumber: "102", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "occupied", currentBooking: { bookingCode: "HF-20261030-01", guestName: "Vikram Malhotra", checkIn: "2026-10-29", checkOut: "2026-10-31" } },
  { id: "room-103", roomNumber: "103", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },
  { id: "room-104", roomNumber: "104", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "cleaning" },
  { id: "room-105", roomNumber: "105", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },
  { id: "room-106", roomNumber: "106", categorySlug: "deluxe-king", categoryName: "Deluxe King Room", floor: 1, status: "available" },

  // 3 Premier Executive Suites (Floor 2)
  { id: "room-201", roomNumber: "201", categorySlug: "premier-executive", categoryName: "Premier Executive Suite", floor: 2, status: "occupied", currentBooking: { bookingCode: "HF-20261028-04", guestName: "Sarah Jenkins", checkIn: "2026-10-28", checkOut: "2026-11-01" } },
  { id: "room-202", roomNumber: "202", categorySlug: "premier-executive", categoryName: "Premier Executive Suite", floor: 2, status: "available" },
  { id: "room-203", roomNumber: "203", categorySlug: "premier-executive", categoryName: "Premier Executive Suite", floor: 2, status: "available" },

  // 2 The Royal Fremont Suites (Floor 3)
  { id: "room-301", roomNumber: "301", categorySlug: "royal-fremont", categoryName: "The Royal Fremont Suite", floor: 3, status: "occupied", currentBooking: { bookingCode: "HF-20261030-08", guestName: "Rohit & Ananya Khanna", checkIn: "2026-10-30", checkOut: "2026-11-02" } },
  { id: "room-302", roomNumber: "302", categorySlug: "royal-fremont", categoryName: "The Royal Fremont Suite", floor: 3, status: "available" },

  // 1 Presidential Penthouse (Floor 4)
  { id: "room-401", roomNumber: "401", categorySlug: "presidential-penthouse", categoryName: "Presidential Penthouse", floor: 4, status: "available" },
];

let memoryRooms: PhysicalRoom[] = [...defaultPhysicalRooms];

let memoryBookings: BookingRecord[] = [
  {
    id: "b-1",
    bookingCode: "HF-20261030-01",
    guestName: "Vikram Malhotra",
    guestPhone: "+91 98111 22334",
    guestEmail: "vikram.m@example.com",
    categorySlug: "deluxe-king",
    categoryName: "Deluxe King Room",
    roomNumber: "102",
    checkIn: "2026-10-29",
    checkOut: "2026-10-31",
    guestsCount: 2,
    totalAmount: 12978,
    advancePaid: 5000,
    status: "checked_in",
    source: "website",
    notes: "Late checkout requested (1:00 PM)",
    createdAt: "2026-10-27T10:00:00Z",
  },
  {
    id: "b-2",
    bookingCode: "HF-20261028-04",
    guestName: "Sarah Jenkins",
    guestPhone: "+44 7911 123456",
    guestEmail: "sarah.j@techleaders.co.uk",
    categorySlug: "premier-executive",
    categoryName: "Premier Executive Suite",
    roomNumber: "201",
    checkIn: "2026-10-28",
    checkOut: "2026-11-01",
    guestsCount: 1,
    totalAmount: 42475,
    advancePaid: 42475,
    status: "checked_in",
    source: "phone",
    notes: "Requires airport transfer to IXC on Nov 1",
    createdAt: "2026-10-25T14:30:00Z",
  },
  {
    id: "b-3",
    bookingCode: "HF-20261030-08",
    guestName: "Rohit & Ananya Khanna",
    guestPhone: "+91 98760 11223",
    guestEmail: "rohit.khanna@delhicap.in",
    categorySlug: "royal-fremont",
    categoryName: "The Royal Fremont Suite",
    roomNumber: "301",
    checkIn: "2026-10-30",
    checkOut: "2026-11-02",
    guestsCount: 2,
    totalAmount: 53096,
    advancePaid: 25000,
    status: "confirmed",
    source: "website",
    notes: "Anniversary celebration. Champagne setup in room.",
    createdAt: "2026-10-28T09:15:00Z",
  },
  {
    id: "b-4",
    bookingCode: "HF-20261102-12",
    guestName: "Arunav Singhania",
    guestPhone: "+91 99201 88472",
    guestEmail: "arunav@singhaniaholdings.com",
    categorySlug: "presidential-penthouse",
    categoryName: "Presidential Penthouse",
    roomNumber: "401",
    checkIn: "2026-11-02",
    checkOut: "2026-11-05",
    guestsCount: 4,
    totalAmount: 88496,
    advancePaid: 44248,
    status: "confirmed",
    source: "whatsapp",
    notes: "VIP guests arriving via private jet.",
    createdAt: "2026-10-29T16:45:00Z",
  },
];

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
 * Fetch all bookings with optional filters
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

    const { data, error } = await supabase
      .from("bookings")
      .select("*, rooms(room_number)")
      .order("check_in", { ascending: false });

    if (error || !data || data.length === 0) {
      return { success: true, bookings: memoryBookings, isDatabase: false };
    }

    const categoryMap: Record<string, string> = {
      "deluxe-king": "Deluxe King Room",
      "premier-executive": "Premier Executive Suite",
      "royal-fremont": "The Royal Fremont Suite",
      "presidential-penthouse": "Presidential Penthouse",
    };

    const bookings: BookingRecord[] = data.map((b) => ({
      id: b.id,
      bookingCode: b.booking_code,
      guestName: b.guest_name,
      guestPhone: b.guest_phone,
      guestEmail: b.guest_email || undefined,
      categorySlug: b.category_slug,
      categoryName: categoryMap[b.category_slug] || b.category_slug,
      roomNumber: b.rooms?.room_number || undefined,
      checkIn: b.check_in,
      checkOut: b.check_out,
      guestsCount: b.guests_count,
      totalAmount: Number(b.total_amount),
      advancePaid: Number(b.advance_paid || 0),
      status: b.status as BookingStatus,
      source: b.source,
      notes: b.notes || undefined,
      createdAt: b.created_at,
    }));

    return { success: true, bookings, isDatabase: true };
  } catch {
    return { success: true, bookings: memoryBookings, isDatabase: false };
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

    // 3. Double-booking check
    // Check if the chosen room or any room in this category is free for these dates
    const assignedRoomNumber = input.roomNumber || category.roomNumbers[0];

    const hasConflict = memoryBookings.some((b) => {
      if (b.status === "cancelled" || b.status === "no_show") return false;
      if (b.roomNumber !== assignedRoomNumber) return false;

      const existingIn = new Date(b.checkIn);
      const existingOut = new Date(b.checkOut);

      // Overlap condition: startA < endB && endA > startB
      return checkInDate < existingOut && checkOutDate > existingIn;
    });

    if (hasConflict) {
      return {
        success: false,
        error: `Room ${assignedRoomNumber} is already booked for overlapping dates. Please select another room or adjust the dates.`,
      };
    }

    // 4. Calculate total amount
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const baseTotal = nights * category.price;
    const gst = Math.round(baseTotal * 0.18);
    const totalAmount = baseTotal + gst;

    // 5. Generate collision-resistant booking code
    const dateStamp = checkInDate.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `HF-${dateStamp}-${randomSuffix}`;

    const newBooking: BookingRecord = {
      id: `b-${Date.now()}`,
      bookingCode,
      guestName: input.guestName.trim(),
      guestPhone: input.guestPhone.trim(),
      guestEmail: input.guestEmail?.trim() || undefined,
      categorySlug: input.categorySlug,
      categoryName: category.name,
      roomNumber: assignedRoomNumber,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestsCount: input.guestsCount,
      totalAmount,
      advancePaid: input.advancePaid || 0,
      status: "confirmed",
      source: input.source || "phone",
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Save to memory
    memoryBookings = [newBooking, ...memoryBookings];

    // Mark room as occupied if checkIn is today
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

    // Attempt Supabase insert
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      // Find room id
      const { data: roomRecord } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_number", assignedRoomNumber)
        .single();

      await supabase.from("bookings").insert({
        booking_code: bookingCode,
        guest_name: input.guestName.trim(),
        guest_phone: input.guestPhone.trim(),
        guest_email: input.guestEmail?.trim() || null,
        category_slug: input.categorySlug,
        room_id: roomRecord?.id || null,
        check_in: input.checkIn,
        check_out: input.checkOut,
        guests_count: input.guestsCount,
        total_amount: totalAmount,
        advance_paid: input.advancePaid || 0,
        status: "confirmed",
        source: input.source || "phone",
        notes: input.notes?.trim() || null,
      });

      if (input.checkIn <= todayStr && input.checkOut > todayStr && roomRecord?.id) {
        await supabase
          .from("rooms")
          .update({ status: "occupied" })
          .eq("id", roomRecord.id);
      }
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
    memoryBookings = memoryBookings.map((b) => (b.id === bookingId ? { ...b, status } : b));

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase
        .from("bookings")
        .update({ status, updated_at: new Date().toISOString() })
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

