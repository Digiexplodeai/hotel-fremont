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
export async function getRoomTypesAction(includeInactive: boolean = false): Promise<{
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
    let query = client
      .from("room_types")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return { success: true, roomTypes: DEFAULT_ROOM_TYPES, isDatabase: false };
    }

    const roomTypes: RoomTypeConfig[] = data.map((row: any) => ({
      code: row.code,
      slug: row.slug || row.code,
      name: row.name,
      pricePerNight: Number(row.price_per_night || 2299),
      totalRooms: Number(row.rooms_total || row.total_rooms || 1),
      roomsTotal: Number(row.rooms_total || row.total_rooms || 1),
      maxGuests: Number(row.max_guests || 2),
      isActive: Boolean(row.is_active !== false),
      sortOrder: Number(row.sort_order || 0),
      sizeSqft: row.size_sqft ? Number(row.size_sqft) : undefined,
      bedType: row.bed_type || "Plush King-size bed",
      tag: row.tag || "",
      badge: row.tag || "",
      shortDescription: row.short_description || "",
      longDescription: row.long_description || "",
      description: row.short_description || row.long_description || "",
      amenities: Array.isArray(row.amenities) ? row.amenities : [],
      rateCpDouble: row.rate_cp_double ? Number(row.rate_cp_double) : undefined,
      rateCpSingle: row.rate_cp_single ? Number(row.rate_cp_single) : undefined,
      rateEpDouble: row.rate_ep_double ? Number(row.rate_ep_double) : undefined,
      rateEpSingle: row.rate_ep_single ? Number(row.rate_ep_single) : undefined,
      imageSlot: row.image_slot || undefined,
    }));

    return { success: true, roomTypes, isDatabase: true };
  } catch {
    return { success: true, roomTypes: DEFAULT_ROOM_TYPES, isDatabase: false };
  }
}

/**
 * Helper to get array of YYYY-MM-DD night dates for [checkIn, checkOut) using pure UTC
 */
function getStayNightsList(checkIn: string, checkOut: string): string[] {
  if (!checkIn || !checkOut || checkOut <= checkIn) return [];
  const [inY, inM, inD] = checkIn.split("-").map(Number);
  const [outY, outM, outD] = checkOut.split("-").map(Number);
  const dIn = new Date(Date.UTC(inY, inM - 1, inD));
  const dOut = new Date(Date.UTC(outY, outM - 1, outD));
  const diffDays = Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24));
  const nights: string[] = [];
  for (let i = 0; i < diffDays; i++) {
    const cur = new Date(dIn);
    cur.setUTCDate(cur.getUTCDate() + i);
    nights.push(cur.toISOString().slice(0, 10));
  }
  return nights;
}

/**
 * Public action: Check availability across [checkIn, checkOut) for all room types.
 * Authoritative, date-specific calculation:
 * - Verified physical inventory: Deluxe (9), Super Deluxe (10), Premium (2).
 * - Half-open stay date interval [checkIn, checkOut).
 * - Excludes cancelled, closed, failed, and expired temporary holds.
 * - Deduplicates between online bookings and front-desk reservations.
 * - Strictly bounds availability between 0 and verified physical inventory.
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
    const nights = getStayNightsList(checkIn, checkOut);

    // Baseline verified physical inventory
    const baselineInventory = [
      { code: "deluxe-room", name: "Deluxe Room", price_per_night: 2299, total_rooms: 9, max_guests: 2 },
      { code: "super-deluxe", name: "Super Deluxe Room", price_per_night: 3299, total_rooms: 10, max_guests: 2 },
      { code: "premium", name: "Premium Room", price_per_night: 4299, total_rooms: 2, max_guests: 2 },
    ];

    if (nights.length === 0) {
      const fullList: RoomAvailabilityResult[] = [];
      baselineInventory.forEach((item) => {
        fullList.push({ ...item, rooms_left: item.total_rooms });
        if (item.code === "super-deluxe") {
          fullList.push({ ...item, code: "super-deluxe-room", rooms_left: item.total_rooms });
        } else if (item.code === "premium") {
          fullList.push({ ...item, code: "premium-room", rooms_left: item.total_rooms });
        }
      });
      return { success: true, availability: fullList };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || (!serviceKey && !anonKey)) {
      const fullList: RoomAvailabilityResult[] = [];
      baselineInventory.forEach((item) => {
        fullList.push({ ...item, rooms_left: item.total_rooms });
        if (item.code === "super-deluxe") {
          fullList.push({ ...item, code: "super-deluxe-room", rooms_left: item.total_rooms });
        } else if (item.code === "premium") {
          fullList.push({ ...item, code: "premium-room", rooms_left: item.total_rooms });
        }
      });
      return { success: true, availability: fullList };
    }

    const client = createSupabaseClient(supabaseUrl, serviceKey || anonKey!);

    // 1. Authoritative: Execute Supabase RPC get_room_availability (SECURITY DEFINER)
    const { data: rpcData, error: rpcError } = await client.rpc("get_room_availability", {
      p_check_in: checkIn,
      p_check_out: checkOut,
    });

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      const availabilityMap = new Map<string, RoomAvailabilityResult>();

      for (const row of rpcData) {
        const code = String(row.code);
        const name = String(row.name);
        const price_per_night = Number(row.price_per_night || 2299);
        const max_guests = Number(row.max_guests || 2);

        let physicalKeys = 9;
        if (code === "deluxe-room" || code === "deluxe") physicalKeys = 9;
        else if (code === "super-deluxe" || code === "super-deluxe-room") physicalKeys = 10;
        else if (code === "premium" || code === "premium-room") physicalKeys = 2;
        else physicalKeys = Number(row.total_rooms || 1);

        const rawLeft = Number(row.rooms_left !== undefined ? row.rooms_left : physicalKeys);
        const rooms_left = Math.max(0, Math.min(physicalKeys, rawLeft));

        const item: RoomAvailabilityResult = {
          code,
          name,
          price_per_night,
          total_rooms: physicalKeys,
          rooms_left,
          max_guests,
        };

        availabilityMap.set(code, item);

        if (code === "super-deluxe") {
          availabilityMap.set("super-deluxe-room", { ...item, code: "super-deluxe-room" });
        } else if (code === "super-deluxe-room") {
          availabilityMap.set("super-deluxe", { ...item, code: "super-deluxe" });
        } else if (code === "premium") {
          availabilityMap.set("premium-room", { ...item, code: "premium-room" });
        } else if (code === "premium-room") {
          availabilityMap.set("premium", { ...item, code: "premium" });
        }
      }

      return {
        success: true,
        availability: Array.from(availabilityMap.values()),
      };
    }

    // 2. Fallback: Direct table calculation if RPC is unavailable
    const nowIso = new Date().toISOString();

    // 1. Fetch active room types from database
    const { data: rtData } = await client
      .from("room_types")
      .select("code, name, price_per_night, total_rooms, rooms_total, max_guests")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    // 2. Fetch reservations overlapping [checkIn, checkOut)
    const { data: resData } = await client
      .from("reservations")
      .select("id, reference_code, room_type, room_type_code, rooms_requested, check_in, check_out, status")
      .in("status", ["confirmed", "converted", "paid", "checked_in", "checked_out"])
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);

    // 3. Fetch bookings overlapping [checkIn, checkOut)
    const { data: bookData } = await client
      .from("bookings")
      .select("id, booking_ref, room_category, rooms_requested, rooms_count, check_in, check_out, status, expires_at")
      .in("status", ["paid", "confirmed", "checked_in", "checked_out", "pending"])
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);

    const reservationsList = resData || [];
    const countedRefs = new Set(reservationsList.map((r) => r.reference_code).filter(Boolean));

    // Deduplicate: Exclude expired pending holds and bookings already counted in reservations
    const validBookings = (bookData || []).filter((b) => {
      if (b.status === "pending") {
        if (!b.expires_at || b.expires_at <= nowIso) return false;
      }
      if (b.booking_ref && countedRefs.has(b.booking_ref)) {
        return false;
      }
      return true;
    });

    const matchesCategory = (categoryCode: string, targetCode: string, targetName: string) => {
      const c = (categoryCode || "").toLowerCase();
      const tc = targetCode.toLowerCase();
      const tn = targetName.toLowerCase();

      if (tc === "deluxe-room" || tc === "deluxe") {
        return c === "deluxe-room" || c === "deluxe" || c.includes("deluxe room");
      }
      if (tc === "super-deluxe" || tc === "super-deluxe-room") {
        return c === "super-deluxe" || c === "super-deluxe-room" || c.includes("super deluxe");
      }
      if (tc === "premium" || tc === "premium-room") {
        return c === "premium" || c === "premium-room" || c.includes("premium room");
      }
      return c === tc || c === tn;
    };

    const evaluatedCategories = (rtData && rtData.length > 0 ? rtData : baselineInventory).map((row: any) => {
      const code = row.code;
      const name = row.name;
      const price_per_night = Number(row.price_per_night || 2299);
      const max_guests = Number(row.max_guests || 2);

      // Enforce verified physical inventory: Deluxe=9, Super Deluxe=10, Premium=2
      let physicalKeys = 9;
      if (code === "deluxe-room" || code === "deluxe") physicalKeys = 9;
      else if (code === "super-deluxe" || code === "super-deluxe-room") physicalKeys = 10;
      else if (code === "premium" || code === "premium-room") physicalKeys = 2;
      else physicalKeys = Number(row.rooms_total || row.total_rooms || 1);

      // Nightly peak usage across all nights of the requested stay
      let peakBooked = 0;
      for (const night of nights) {
        let nightBooked = 0;

        for (const res of reservationsList) {
          const resCat = res.room_type_code || res.room_type || "";
          if (matchesCategory(resCat, code, name)) {
            if (res.check_in <= night && res.check_out > night) {
              nightBooked += Number(res.rooms_requested || 1);
            }
          }
        }

        for (const b of validBookings) {
          const bookCat = b.room_category || "";
          if (matchesCategory(bookCat, code, name)) {
            if (b.check_in <= night && b.check_out > night) {
              nightBooked += Number(b.rooms_count || b.rooms_requested || 1);
            }
          }
        }

        if (nightBooked > peakBooked) {
          peakBooked = nightBooked;
        }
      }

      const rooms_left = Math.max(0, Math.min(physicalKeys, physicalKeys - peakBooked));

      return {
        code,
        name,
        price_per_night,
        total_rooms: physicalKeys,
        rooms_left,
        max_guests,
      };
    });

    // Provide both canonical and aliased keys so every frontend lookup succeeds
    const availabilityMap = new Map<string, RoomAvailabilityResult>();
    for (const item of evaluatedCategories) {
      availabilityMap.set(item.code, item);
      if (item.code === "super-deluxe") {
        availabilityMap.set("super-deluxe-room", { ...item, code: "super-deluxe-room" });
      } else if (item.code === "super-deluxe-room") {
        availabilityMap.set("super-deluxe", { ...item, code: "super-deluxe" });
      } else if (item.code === "premium") {
        availabilityMap.set("premium-room", { ...item, code: "premium-room" });
      } else if (item.code === "premium-room") {
        availabilityMap.set("premium", { ...item, code: "premium" });
      }
    }

    return {
      success: true,
      availability: Array.from(availabilityMap.values()),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to calculate room availability.",
      availability: [],
    };
  }
}

/**
 * Admin action: Update a room category (rates, total_rooms, amenities, photo slot, etc.)
 */
export async function updateRoomTypeAction(
  code: string,
  updates: {
    name?: string;
    slug?: string;
    pricePerNight?: number;
    totalRooms?: number;
    roomsTotal?: number;
    maxGuests?: number;
    isActive?: boolean;
    sortOrder?: number;
    sizeSqft?: number;
    bedType?: string;
    tag?: string;
    shortDescription?: string;
    longDescription?: string;
    amenities?: string[];
    rateCpDouble?: number;
    rateCpSingle?: number;
    rateEpDouble?: number;
    rateEpSingle?: number;
    imageSlot?: string;
    forceOverride?: boolean;
  }
): Promise<{ success: boolean; error?: string; warning?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database connection unavailable." };
    }

    const roomsCount = updates.roomsTotal !== undefined ? updates.roomsTotal : updates.totalRooms;
    if (typeof roomsCount === "number" && roomsCount < 0) {
      return { success: false, error: "Total rooms cannot be negative." };
    }

    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbPayload.name = updates.name.trim();
    if (updates.slug !== undefined) dbPayload.slug = updates.slug.trim();
    if (typeof updates.pricePerNight === "number") dbPayload.price_per_night = updates.pricePerNight;
    if (typeof roomsCount === "number") {
      dbPayload.total_rooms = roomsCount;
      dbPayload.rooms_total = roomsCount;
    }
    if (typeof updates.maxGuests === "number") dbPayload.max_guests = updates.maxGuests;
    if (typeof updates.isActive === "boolean") dbPayload.is_active = updates.isActive;
    if (typeof updates.sortOrder === "number") dbPayload.sort_order = updates.sortOrder;
    if (typeof updates.sizeSqft === "number") dbPayload.size_sqft = updates.sizeSqft;
    if (updates.bedType !== undefined) dbPayload.bed_type = updates.bedType;
    if (updates.tag !== undefined) dbPayload.tag = updates.tag;
    if (updates.shortDescription !== undefined) dbPayload.short_description = updates.shortDescription;
    if (updates.longDescription !== undefined) dbPayload.long_description = updates.longDescription;
    if (updates.amenities !== undefined) dbPayload.amenities = updates.amenities;
    if (typeof updates.rateCpDouble === "number") dbPayload.rate_cp_double = updates.rateCpDouble;
    if (typeof updates.rateCpSingle === "number") dbPayload.rate_cp_single = updates.rateCpSingle;
    if (typeof updates.rateEpDouble === "number") dbPayload.rate_ep_double = updates.rateEpDouble;
    if (typeof updates.rateEpSingle === "number") {
      dbPayload.rate_ep_single = updates.rateEpSingle;
      // also keep base price_per_night synced to lowest rate
      dbPayload.price_per_night = updates.rateEpSingle;
    }
    if (updates.imageSlot !== undefined) dbPayload.image_slot = updates.imageSlot;

    const { error } = await supabase.from("room_types").update(dbPayload).eq("code", code);

    if (error) {
      console.error("[RoomTypes] Update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update room category." };
  }
}

/**
 * Admin action: Add a new room category
 */
export async function addRoomTypeAction(
  data: Partial<RoomTypeConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database connection unavailable." };
    }

    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Room category name is required." };
    }

    const code = (data.code || data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/(^-|-$)/g, "");
    const roomsCount = data.roomsTotal || data.totalRooms || 1;
    const epSingle = data.rateEpSingle || data.pricePerNight || 2299;

    const dbPayload = {
      code,
      slug: code,
      name: data.name.trim(),
      price_per_night: epSingle,
      total_rooms: roomsCount,
      rooms_total: roomsCount,
      max_guests: data.maxGuests || 2,
      is_active: data.isActive !== false,
      sort_order: data.sortOrder || 10,
      size_sqft: data.sizeSqft || 200,
      bed_type: data.bedType || "Plush King-size bed",
      tag: data.tag || "",
      short_description: data.shortDescription || "",
      long_description: data.longDescription || "",
      amenities: data.amenities || [
        "Air Conditioning",
        "Smart TV",
        "Tea & Coffee Kettle",
        "Complimentary Wi-Fi",
        "Washroom Amenities",
      ],
      rate_cp_double: data.rateCpDouble || epSingle + 500,
      rate_cp_single: data.rateCpSingle || epSingle + 200,
      rate_ep_double: data.rateEpDouble || epSingle + 200,
      rate_ep_single: epSingle,
      image_slot: data.imageSlot || code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("room_types").insert(dbPayload);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to add room category." };
  }
}

/**
 * Admin action: Delete a room category.
 * If the category has any bookings or reservations, deletion is blocked and Deactivate is recommended.
 */
export async function deleteRoomTypeAction(
  code: string
): Promise<{ success: boolean; error?: string; canDeactivate?: boolean }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database connection unavailable." };
    }

    // Check bookings
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("id")
      .eq("room_category", code)
      .limit(1);

    if (bookingsData && bookingsData.length > 0) {
      return {
        success: false,
        error: "Cannot delete this category because it has existing booking records. Deactivate it instead so it is hidden from the website.",
        canDeactivate: true,
      };
    }

    // Check reservations
    const { data: resData } = await supabase
      .from("reservations")
      .select("id")
      .eq("room_type_code", code)
      .limit(1);

    if (resData && resData.length > 0) {
      return {
        success: false,
        error: "Cannot delete this category because it has existing reservation records. Deactivate it instead so it is hidden from the website.",
        canDeactivate: true,
      };
    }

    const { error } = await supabase.from("room_types").delete().eq("code", code);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete room category." };
  }
}

/**
 * Admin action: Toggle room category active/inactive status
 */
export async function toggleRoomTypeActiveAction(
  code: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateRoomTypeAction(code, { isActive });
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
      return { success: false, calendar: [], totalKeys: 21, roomTypes: [], error: "Unauthorized" };
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, calendar: [], totalKeys: 21, roomTypes: [], error: "No DB" };
    }

    // 1. Fetch room types
    const { data: rtData } = await supabase
      .from("room_types")
      .select("*")
      .order("sort_order", { ascending: true });

    const roomTypes: RoomTypeConfig[] = (rtData && rtData.length > 0 ? rtData : DEFAULT_ROOM_TYPES).map((r: any) => {
      let physicalRooms = 9;
      const c = (r.code || "").toLowerCase();
      if (c === "deluxe-room" || c === "deluxe") physicalRooms = 9;
      else if (c === "super-deluxe" || c === "super-deluxe-room") physicalRooms = 10;
      else if (c === "premium" || c === "premium-room") physicalRooms = 2;
      else physicalRooms = Number(r.rooms_total || r.total_rooms || 1);

      return {
        code: r.code,
        name: r.name,
        pricePerNight: Number(r.price_per_night || r.pricePerNight || 2299),
        totalRooms: physicalRooms,
        roomsTotal: physicalRooms,
        maxGuests: Number(r.max_guests || r.maxGuests || 2),
        isActive: Boolean(r.is_active !== false),
        sortOrder: Number(r.sort_order || 0),
      };
    });

    const totalKeys = roomTypes.reduce((acc, rt) => acc + (rt.isActive ? rt.totalRooms : 0), 0) || 21;

    // 2. Determine date range using pure UTC to avoid local timezone drift
    const [startY, startM, startD] = (startDateStr ? startDateStr.slice(0, 10) : new Date().toISOString().slice(0, 10))
      .split("-")
      .map(Number);
    const startUtc = new Date(Date.UTC(startY, startM - 1, startD));
    const endUtc = new Date(Date.UTC(startY, startM - 1, startD + daysCount));

    const minDateStr = startUtc.toISOString().slice(0, 10);
    const maxDateStr = endUtc.toISOString().slice(0, 10);

    // 3. Fetch confirmed & operational reservations overlapping this 60-day period
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("id, reference_code, full_name, phone, room_type, room_type_code, rooms_requested, check_in, check_out, status")
      .in("status", ["confirmed", "converted", "paid", "checked_in", "checked_out"])
      .lt("check_in", maxDateStr)
      .gt("check_out", minDateStr);

    if (resError) {
      console.warn("[Calendar] Error loading reservations:", resError.message);
    }

    // Also fetch paid & operational bookings overlapping this period
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("id, booking_ref, guest_name, phone, room_category, rooms_requested, rooms_count, check_in, check_out, status")
      .in("status", ["paid", "confirmed", "checked_in", "checked_out"])
      .lt("check_in", maxDateStr)
      .gt("check_out", minDateStr);

    const activeReservations = reservations || [];
    const countedRefs = new Set(activeReservations.map((r) => r.reference_code).filter(Boolean));

    // Deduplicate bookings against reservations
    const activeBookings = (bookingsData || []).filter((b) => {
      if (b.booking_ref && countedRefs.has(b.booking_ref)) return false;
      return true;
    });

    // Category code resolver to handle aliases smoothly
    const resolveCategoryCode = (rawCode: string, rawName: string): string => {
      const rc = (rawCode || "").toLowerCase();
      const rn = (rawName || "").toLowerCase();
      if (rc === "deluxe-room" || rc === "deluxe" || rn.includes("deluxe room")) {
        return roomTypes.find((rt) => rt.code === "deluxe-room" || rt.code === "deluxe")?.code || "deluxe-room";
      }
      if (rc === "super-deluxe" || rc === "super-deluxe-room" || rn.includes("super deluxe")) {
        return roomTypes.find((rt) => rt.code === "super-deluxe" || rt.code === "super-deluxe-room")?.code || "super-deluxe";
      }
      if (rc === "premium" || rc === "premium-room" || rn.includes("premium room")) {
        return roomTypes.find((rt) => rt.code === "premium" || rt.code === "premium-room")?.code || "premium";
      }
      return rawCode || roomTypes[0]?.code || "deluxe-room";
    };

    // 4. Build day-by-day matrix
    const calendar: CalendarDaySummary[] = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < daysCount; i++) {
      const curUtc = new Date(Date.UTC(startY, startM - 1, startD + i));
      const dateStr = curUtc.toISOString().slice(0, 10);

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

      for (const res of activeReservations) {
        if (res.check_in <= dateStr && res.check_out > dateStr) {
          const roomCode = resolveCategoryCode(res.room_type_code, res.room_type);
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

      for (const b of activeBookings) {
        if (b.check_in <= dateStr && b.check_out > dateStr) {
          const roomCode = resolveCategoryCode(b.room_category, b.room_category);
          const roomsCount = Number(b.rooms_count || b.rooms_requested || 1);
          totalOccupiedTonight += roomsCount;

          if (byRoomType[roomCode]) {
            byRoomType[roomCode].booked += roomsCount;
            byRoomType[roomCode].roomsLeft = Math.max(0, byRoomType[roomCode].total - byRoomType[roomCode].booked);
          }

          dayStays.push({
            reservationId: b.id,
            referenceCode: b.booking_ref || `FRM-${b.id.slice(0, 6).toUpperCase()}`,
            guestName: b.guest_name,
            guestPhone: b.phone,
            roomTypeCode: roomCode,
            roomTypeName: roomCode,
            roomsCount,
            checkIn: b.check_in,
            checkOut: b.check_out,
          });
        }
      }

      const occupancyPercentage = totalKeys > 0 ? Math.round((totalOccupiedTonight / totalKeys) * 100) : 0;

      calendar.push({
        date: dateStr,
        dayOfWeek: daysOfWeek[curUtc.getUTCDay()],
        dayOfMonth: curUtc.getUTCDate(),
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
      totalKeys: 21,
      roomTypes: [],
      error: err?.message || "Failed to generate availability calendar.",
    };
  }
}
