"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { DEFAULT_ROOM_TYPES, RoomTypeConfig, HOTEL_CONFIG } from "@/config/hotel";
import { revalidatePath } from "next/cache";

export interface RoomAvailabilityResult {
  code: string;
  name: string;
  price_per_night: number;
  total_rooms: number;
  rooms_left: number;
  max_guests: number;
}

export interface CalendarDayStay {
  reservationId: string;
  referenceCode: string;
  guestName: string;
  guestPhone: string;
  roomTypeCode: string;
  roomTypeName: string;
  roomsCount: number;
  checkIn: string;
  checkOut: string;
}

export interface CalendarDaySummary {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Mon, Tue...
  dayOfMonth: number;
  totalOccupied: number;
  totalInventory: number;
  occupancyPercentage: number;
  byRoomType: Record<string, { booked: number; total: number; roomsLeft: number }>;
  activeStays: CalendarDayStay[];
}

/**
 * Public action: Fetches all active room types from Supabase public.room_types.
 * Falls back to DEFAULT_ROOM_TYPES if database table is not yet migrated.
 */
export async function getRoomTypesAction(): Promise<{
  success: boolean;
  roomTypes: RoomTypeConfig[];
  isDatabase: boolean;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return { success: true, roomTypes: DEFAULT_ROOM_TYPES, isDatabase: false };
    }

    const client = createSupabaseClient(supabaseUrl, anonKey);
    const { data, error } = await client
      .from("room_types")
      .select("code, name, price_per_night, total_rooms, max_guests, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return { success: true, roomTypes: DEFAULT_ROOM_TYPES, isDatabase: false };
    }

    const roomTypes: RoomTypeConfig[] = data.map((row) => ({
      code: row.code,
      name: row.name,
      pricePerNight: Number(row.price_per_night),
      totalRooms: Number(row.total_rooms),
      maxGuests: Number(row.max_guests),
      isActive: Boolean(row.is_active),
      sortOrder: Number(row.sort_order),
    }));

    return { success: true, roomTypes, isDatabase: true };
  } catch {
    return { success: true, roomTypes: DEFAULT_ROOM_TYPES, isDatabase: false };
  }
}

/**
 * Public action: Check availability across [checkIn, checkOut) for all room types.
 * Calls RPC `get_room_availability`. Exposes zero private guest data.
 */
export async function getRoomAvailabilityAction(
  checkIn: string,
  checkOut: string
): Promise<{
  success: boolean;
  availability: RoomAvailabilityResult[];
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return {
        success: true,
        availability: DEFAULT_ROOM_TYPES.map((rt) => ({
          code: rt.code,
          name: rt.name,
          price_per_night: rt.pricePerNight,
          total_rooms: rt.totalRooms,
          rooms_left: rt.totalRooms,
          max_guests: rt.maxGuests,
        })),
      };
    }

    const client = createSupabaseClient(supabaseUrl, anonKey);

    // Call Supabase RPC get_room_availability
    const { data, error } = await client.rpc("get_room_availability", {
      p_check_in: checkIn,
      p_check_out: checkOut,
    });

    if (error) {
      console.warn("[Availability] RPC get_room_availability fallback:", error.message);
      // Fallback: Query room types directly with full inventory if unmigrated
      const { data: rtData } = await client
        .from("room_types")
        .select("code, name, price_per_night, total_rooms, max_guests")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const fallbackList = (rtData && rtData.length > 0 ? rtData : DEFAULT_ROOM_TYPES).map((r: any) => ({
        code: r.code,
        name: r.name,
        price_per_night: Number(r.price_per_night || r.pricePerNight),
        total_rooms: Number(r.total_rooms || r.totalRooms),
        rooms_left: Number(r.total_rooms || r.totalRooms),
        max_guests: Number(r.max_guests || r.maxGuests),
      }));

      return { success: true, availability: fallbackList };
    }

    const availability: RoomAvailabilityResult[] = (data || []).map((row: any) => ({
      code: row.code,
      name: row.name,
      price_per_night: Number(row.price_per_night),
      total_rooms: Number(row.total_rooms),
      rooms_left: Number(row.rooms_left),
      max_guests: Number(row.max_guests),
    }));

    return { success: true, availability };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to calculate room availability.",
      availability: [],
    };
  }
}

/**
 * Admin action: Update a room type's price, total rooms, max guests, or active status.
 * Prevents reducing total_rooms below active confirmed reservations without warning.
 */
export async function updateRoomTypeAction(
  code: string,
  updates: {
    name?: string;
    pricePerNight?: number;
    totalRooms?: number;
    maxGuests?: number;
    isActive?: boolean;
    sortOrder?: number;
    forceOverride?: boolean;
  }
): Promise<{ success: boolean; error?: string; warning?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database connection unavailable." };
    }

    // If changing total_rooms, check for future confirmed bookings conflict
    if (typeof updates.totalRooms === "number") {
      if (updates.totalRooms < 0) {
        return { success: false, error: "Total rooms cannot be negative." };
      }

      // Check peak confirmed bookings for this room type starting today
      const today = new Date().toISOString().slice(0, 10);
      const { data: activeRes } = await supabase
        .from("reservations")
        .select("rooms_requested, check_in, check_out")
        .eq("room_type_code", code)
        .in("status", ["confirmed", "converted"])
        .gte("check_out", today);

      if (activeRes && activeRes.length > 0) {
        // Calculate max booked across any upcoming day
        const dayCounts: Record<string, number> = {};
        for (const res of activeRes) {
          const start = new Date(res.check_in);
          const end = new Date(res.check_out);
          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().slice(0, 10);
            dayCounts[dateKey] = (dayCounts[dateKey] || 0) + (res.rooms_requested || 1);
          }
        }

        const maxBooked = Math.max(0, ...Object.values(dayCounts));
        if (updates.totalRooms < maxBooked && !updates.forceOverride) {
          return {
            success: false,
            warning: `Cannot reduce rooms to ${updates.totalRooms}. Upcoming dates have up to ${maxBooked} confirmed bookings for this room category.`,
          };
        }
      }
    }

    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name) dbPayload.name = updates.name.trim();
    if (typeof updates.pricePerNight === "number") dbPayload.price_per_night = updates.pricePerNight;
    if (typeof updates.totalRooms === "number") dbPayload.total_rooms = updates.totalRooms;
    if (typeof updates.maxGuests === "number") dbPayload.max_guests = updates.maxGuests;
    if (typeof updates.isActive === "boolean") dbPayload.is_active = updates.isActive;
    if (typeof updates.sortOrder === "number") dbPayload.sort_order = updates.sortOrder;

    const { error } = await supabase.from("room_types").update(dbPayload).eq("code", code);

    if (error) {
      console.error("[RoomTypes] Update error:", error);
      return { success: false, error: error.message };
    }

    try {
      revalidatePath("/admin/rooms");
      revalidatePath("/admin");
      revalidatePath("/");
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update room category." };
  }
}

/**
 * Admin action: Generate 60-day availability calendar matrix with in-house stays.
 */
export async function getAvailabilityCalendarAction(
  startDateStr?: string,
  daysCount: number = 60
): Promise<{
  success: boolean;
  calendar: CalendarDaySummary[];
  totalKeys: number;
  roomTypes: RoomTypeConfig[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, calendar: [], totalKeys: 12, roomTypes: [], error: "Unauthorized" };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, calendar: [], totalKeys: 12, roomTypes: [], error: "No DB" };
    }

    // 1. Fetch room types
    const { data: rtData } = await supabase
      .from("room_types")
      .select("*")
      .order("sort_order", { ascending: true });

    const roomTypes: RoomTypeConfig[] = (rtData && rtData.length > 0 ? rtData : DEFAULT_ROOM_TYPES).map((r: any) => ({
      code: r.code,
      name: r.name,
      pricePerNight: Number(r.price_per_night || r.pricePerNight),
      totalRooms: Number(r.total_rooms || r.totalRooms),
      maxGuests: Number(r.max_guests || r.maxGuests),
      isActive: Boolean(r.is_active !== false),
      sortOrder: Number(r.sort_order || 0),
    }));

    const totalKeys = roomTypes.reduce((acc, rt) => acc + (rt.isActive ? rt.totalRooms : 0), 0) || 12;

    // 2. Determine date range
    const start = startDateStr ? new Date(startDateStr) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + daysCount);

    const minDateStr = start.toISOString().slice(0, 10);
    const maxDateStr = end.toISOString().slice(0, 10);

    // 3. Fetch confirmed reservations overlapping this 60-day period
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("id, reference_code, full_name, phone, room_type, room_type_code, rooms_requested, check_in, check_out, status")
      .in("status", ["confirmed", "converted"])
      .lt("check_in", maxDateStr)
      .gt("check_out", minDateStr);

    if (resError) {
      console.warn("[Calendar] Error loading reservations:", resError.message);
    }

    const activeReservations = reservations || [];

    // 4. Build day-by-day matrix
    const calendar: CalendarDaySummary[] = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < daysCount; i++) {
      const current = new Date(start);
      current.setDate(current.getDate() + i);
      const dateStr = current.toISOString().slice(0, 10);

      const byRoomType: Record<string, { booked: number; total: number; roomsLeft: number }> = {};
      roomTypes.forEach((rt) => {
        byRoomType[rt.code] = {
          booked: 0,
          total: rt.totalRooms,
          roomsLeft: rt.totalRooms,
        };
      });

      const dayStays: CalendarDayStay[] = [];
      let totalOccupiedTonight = 0;

      // An in-house stay on night D has check_in <= D and check_out > D
      for (const res of activeReservations) {
        if (res.check_in <= dateStr && res.check_out > dateStr) {
          const roomCode = res.room_type_code || (
            roomTypes.find((rt) => rt.name.toLowerCase() === res.room_type?.toLowerCase())?.code || "deluxe-king"
          );

          const roomsCount = Number(res.rooms_requested) || 1;
          totalOccupiedTonight += roomsCount;

          if (byRoomType[roomCode]) {
            byRoomType[roomCode].booked += roomsCount;
            byRoomType[roomCode].roomsLeft = Math.max(0, byRoomType[roomCode].total - byRoomType[roomCode].booked);
          }

          dayStays.push({
            reservationId: res.id,
            referenceCode: res.reference_code || `FRM-${res.id.slice(0, 6).toUpperCase()}`,
            guestName: res.full_name,
            guestPhone: res.phone,
            roomTypeCode: roomCode,
            roomTypeName: res.room_type || roomCode,
            roomsCount,
            checkIn: res.check_in,
            checkOut: res.check_out,
          });
        }
      }

      const occupancyPercentage = totalKeys > 0 ? Math.round((totalOccupiedTonight / totalKeys) * 100) : 0;

      calendar.push({
        date: dateStr,
        dayOfWeek: daysOfWeek[current.getDay()],
        dayOfMonth: current.getDate(),
        totalOccupied: totalOccupiedTonight,
        totalInventory: totalKeys,
        occupancyPercentage,
        byRoomType,
        activeStays: dayStays,
      });
    }

    return {
      success: true,
      calendar,
      totalKeys,
      roomTypes,
    };
  } catch (err: any) {
    return {
      success: false,
      calendar: [],
      totalKeys: 12,
      roomTypes: [],
      error: err?.message || "Failed to generate availability calendar.",
    };
  }
}

