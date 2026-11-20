import { siteConfig } from "@/data/content";
import { roomCategories as defaultRoomCategories, RoomCategory } from "@/data/rooms";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface SlotData {
  url: string;
  altText: string;
  focalPoint: string;
  isCustom: boolean;
  isActive?: boolean;
  is_active?: boolean;
  updatedAt?: string;
}

export const DEFAULT_SLOTS: Record<string, { url: string; altText: string; focalPoint: string }> = {
  "branding.logo": { url: "/assets/logo.png", altText: "Hotel Fremont Official Logo", focalPoint: "50% 50%" },
  "branding.icon": { url: "/assets/f-icon.png", altText: "Hotel Fremont Favicon", focalPoint: "50% 50%" },
  "seo.og_image": { url: "/assets/logo.png", altText: "Hotel Fremont OpenGraph Preview", focalPoint: "50% 50%" },

  // Four Real Photo Slots
  exterior: { url: "", altText: "Hotel Fremont Exterior on Airport Road, Mohali", focalPoint: "50% 50%" },
  "super-deluxe": { url: "", altText: "Super Deluxe Room at Hotel Fremont", focalPoint: "50% 50%" },
  premium: { url: "", altText: "Premium Room with burgundy styling at Hotel Fremont", focalPoint: "50% 50%" },
  "cloud-six-banquet": { url: "", altText: "Cloud Six Banquet Hall at Hotel Fremont", focalPoint: "50% 50%" },

  // Additional Real Venue / Room Slots
  "deluxe-room": { url: "", altText: "Deluxe Room at Hotel Fremont", focalPoint: "50% 50%" },
  restaurant: { url: "", altText: "Hotel Fremont Restaurant Ground Floor", focalPoint: "50% 50%" },
  "conference-hall": { url: "", altText: "Conference Hall for meetings and discussions", focalPoint: "50% 50%" },

  // Legacy mappings aliased to real slots
  "hero.slide_1": { url: "", altText: "Hotel Fremont Exterior", focalPoint: "50% 50%" },
  "about.image_primary": { url: "", altText: "Hotel Fremont Exterior", focalPoint: "50% 50%" },
  "rooms.deluxe-room.main": { url: "", altText: "Deluxe Room", focalPoint: "50% 50%" },
  "rooms.super-deluxe-room.main": { url: "", altText: "Super Deluxe Room", focalPoint: "50% 50%" },
  "rooms.premium-room.main": { url: "", altText: "Premium Room", focalPoint: "50% 50%" },
  "dining.banner_primary": { url: "", altText: "Hotel Fremont Restaurant", focalPoint: "50% 50%" },
  "events.venue_1": { url: "", altText: "Cloud Six Banquet", focalPoint: "50% 50%" },
  "events.venue_2": { url: "", altText: "Conference Hall", focalPoint: "50% 50%" },
};

/**
 * Loads dynamic slot pointers from the Supabase image_slots table.
 * Filters for active slots only.
 */
export async function getImageSlotsMap(): Promise<Record<string, SlotData>> {
  const map: Record<string, SlotData> = {};
  for (const [key, val] of Object.entries(DEFAULT_SLOTS)) {
    map[key] = {
      url: val.url,
      altText: val.altText,
      focalPoint: val.focalPoint,
      isCustom: false,
      isActive: true,
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      return map;
    }

    const { data: rows, error } = await supabase
      .from("image_slots")
      .select("slot_key, url, alt_text, focal_x, focal_y, is_active, updated_at");

    if (error) {
      console.warn("[Slots Read] Error reading image_slots table:", error.message);
      return map;
    }

    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (!row.slot_key) continue;
        // If row is explicitly deactivated, set isActive to false
        const isActive = row.is_active !== false;

        let finalUrl = row.url || "";
        if (finalUrl && row.updated_at) {
          const v = new Date(row.updated_at).getTime();
          finalUrl = `${finalUrl}${finalUrl.includes("?") ? "&" : "?"}v=${v}`;
        }

        const focalX = row.focal_x || "50%";
        const focalY = row.focal_y || "50%";
        const focalPoint = `${focalX} ${focalY}`;

        const slotData: SlotData = {
          url: finalUrl,
          altText: row.alt_text || DEFAULT_SLOTS[row.slot_key]?.altText || "Hotel Fremont",
          focalPoint,
          isCustom: !!row.url,
          isActive,
          updatedAt: row.updated_at,
        };

        map[row.slot_key] = slotData;

        // Alias convenient aliases
        if (row.slot_key === "exterior") {
          map["hero.slide_1"] = slotData;
          map["about.image_primary"] = slotData;
        } else if (row.slot_key === "super-deluxe") {
          map["rooms.super-deluxe-room.main"] = slotData;
        } else if (row.slot_key === "premium") {
          map["rooms.premium-room.main"] = slotData;
        } else if (row.slot_key === "deluxe-room") {
          map["rooms.deluxe-room.main"] = slotData;
        } else if (row.slot_key === "cloud-six-banquet") {
          map["events.venue_1"] = slotData;
        } else if (row.slot_key === "conference-hall") {
          map["events.venue_2"] = slotData;
        } else if (row.slot_key === "restaurant") {
          map["dining.banner_primary"] = slotData;
        }
      }
    }

    return map;
  } catch (err) {
    console.warn("[Slots Read] Exception during image_slots read:", err);
    return map;
  }
}

export interface SiteData {
  config: typeof siteConfig;
  rooms: RoomCategory[];
  imageSlots: Record<string, { url: string; altText: string; focalPoint?: string }>;
  isUsingDatabase: boolean;
}

export async function getSiteData(): Promise<SiteData> {
  const slotsMap = await getImageSlotsMap();
  return {
    config: siteConfig,
    rooms: defaultRoomCategories,
    imageSlots: slotsMap,
    isUsingDatabase: true,
  };
}
