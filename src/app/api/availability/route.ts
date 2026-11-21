import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ROOM_TYPES } from "@/config/hotel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface RoomAvailabilityItem {
  code: string;
  name: string;
  price_per_night: number;
  total_rooms: number;
  rooms_left: number;
  max_guests: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn") || searchParams.get("check_in");
  const checkOut = searchParams.get("checkOut") || searchParams.get("check_out");

  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store",
  };

  // Baseline physical inventory caps
  const baselineInventory: RoomAvailabilityItem[] = [
    { code: "deluxe-room", name: "Deluxe Room", price_per_night: 2299, total_rooms: 9, rooms_left: 9, max_guests: 2 },
    { code: "super-deluxe", name: "Super Deluxe Room", price_per_night: 3299, total_rooms: 10, rooms_left: 10, max_guests: 2 },
    { code: "premium", name: "Premium Room", price_per_night: 4299, total_rooms: 2, rooms_left: 2, max_guests: 2 },
  ];

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    const list: RoomAvailabilityItem[] = [];
    baselineInventory.forEach((item) => {
      list.push(item);
      if (item.code === "super-deluxe") {
        list.push({ ...item, code: "super-deluxe-room" });
      } else if (item.code === "premium") {
        list.push({ ...item, code: "premium-room" });
      }
    });
    return NextResponse.json({ success: true, availability: list }, { headers });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!serviceKey && !anonKey)) {
    const list: RoomAvailabilityItem[] = [];
    baselineInventory.forEach((item) => {
      list.push(item);
      if (item.code === "super-deluxe") {
        list.push({ ...item, code: "super-deluxe-room" });
      } else if (item.code === "premium") {
        list.push({ ...item, code: "premium-room" });
      }
    });
    return NextResponse.json({ success: true, availability: list }, { headers });
  }

  try {
    const client = createSupabaseClient(supabaseUrl, serviceKey || anonKey!);

    // Call authoritative Supabase RPC function (SECURITY DEFINER)
    const { data: rpcData, error: rpcError } = await client.rpc("get_room_availability", {
      p_check_in: checkIn,
      p_check_out: checkOut,
    });

    if (rpcError || !rpcData || !Array.isArray(rpcData)) {
      console.warn("[API availability] RPC warning:", rpcError?.message);
      // Fallback to baseline
      return NextResponse.json({ success: true, availability: baselineInventory }, { headers });
    }

    // Enforce physical caps and generate aliases
    const availabilityMap = new Map<string, RoomAvailabilityItem>();

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

      const item: RoomAvailabilityItem = {
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

    return NextResponse.json(
      {
        success: true,
        checkIn,
        checkOut,
        availability: Array.from(availabilityMap.values()),
      },
      { headers }
    );
  } catch (err: any) {
    console.error("[API availability] Error:", err?.message);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to retrieve room availability",
        availability: baselineInventory,
      },
      { status: 500, headers }
    );
  }
}
