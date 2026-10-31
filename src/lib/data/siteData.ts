import { siteConfig } from "@/data/content";
import { roomCategories as defaultRoomCategories, RoomCategory } from "@/data/rooms";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface SlotData {
  url: string;
  altText: string;
  focalPoint: string;
  isCustom: boolean;
  updatedAt?: string;
}

export const DEFAULT_SLOTS: Record<string, { url: string; altText: string; focalPoint: string }> = {
  "branding.logo": { url: "/assets/logo.png", altText: "Hotel Fremont Official Logo", focalPoint: "50% 50%" },
  "branding.icon": { url: "/assets/f-icon.png", altText: "Hotel Fremont Favicon", focalPoint: "50% 50%" },
  "seo.og_image": { url: "/assets/logo.png", altText: "Hotel Fremont OpenGraph Preview", focalPoint: "50% 50%" },

  "hero.slide_1": { url: "/assets/hero/hero-suite.webp", altText: "Classic Luxury Suite", focalPoint: "50% 50%" },
  "hero.slide_2": { url: "/assets/hero/hero-room-1.webp", altText: "Deluxe King Room", focalPoint: "50% 50%" },
  "hero.slide_3": { url: "/assets/hero/hero-lobby.webp", altText: "Panoramic Modern Suite", focalPoint: "50% 50%" },
  "hero.slide_4": { url: "/assets/hero/hero-room-2.webp", altText: "Executive Lounge Suite", focalPoint: "50% 50%" },

  "about.image_primary": { url: "/assets/hero/hero-room-1.webp", altText: "Hotel Fremont Suite Sanctuary", focalPoint: "50% 50%" },
  "about.image_secondary": { url: "/assets/hero/hero-room-2.webp", altText: "Luxury Interior", focalPoint: "50% 50%" },
  "about.image_interior": { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=900", altText: "Architectural Interior", focalPoint: "50% 50%" },

  "rooms.deluxe-king.main": { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000", altText: "Deluxe King Room", focalPoint: "50% 50%" },
  "rooms.deluxe-king.gallery.1": { url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000", altText: "Deluxe King Room Detail", focalPoint: "50% 50%" },
  "rooms.deluxe-king.gallery.2": { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000", altText: "Deluxe King Bathroom", focalPoint: "50% 50%" },

  "rooms.premier-executive.main": { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000", altText: "Premier Executive Suite", focalPoint: "50% 50%" },
  "rooms.premier-executive.gallery.1": { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000", altText: "Executive Suite Living Area", focalPoint: "50% 50%" },
  "rooms.premier-executive.gallery.2": { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000", altText: "Executive Suite Bed View", focalPoint: "50% 50%" },

  "rooms.royal-fremont.main": { url: "/assets/rooms/royal-fremont-suite.webp", altText: "The Royal Fremont Suite", focalPoint: "50% 50%" },
  "rooms.royal-fremont.gallery.1": { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000", altText: "Royal Fremont Alcove", focalPoint: "50% 50%" },
  "rooms.royal-fremont.gallery.2": { url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000", altText: "Royal Fremont Champagne Bar", focalPoint: "50% 50%" },

  "rooms.presidential-penthouse.main": { url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000", altText: "Presidential Penthouse", focalPoint: "50% 50%" },
  "rooms.presidential-penthouse.gallery.1": { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000", altText: "Penthouse Terrace", focalPoint: "50% 50%" },
  "rooms.presidential-penthouse.gallery.2": { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000", altText: "Penthouse Dining", focalPoint: "50% 50%" },

  "dining.banner_primary": { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200", altText: "Aura Gourmet Restaurant and Lounge", focalPoint: "50% 50%" },

  "events.venue_1": { url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000", altText: "The Grand Fremont Ballroom", focalPoint: "50% 50%" },
  "events.venue_2": { url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=1000", altText: "The Fremont Terrace Lawn", focalPoint: "50% 50%" },
  "events.venue_3": { url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1000", altText: "The Executive Boardroom", focalPoint: "50% 50%" },
};

/**
 * Loads dynamic slot pointers from the Supabase image_slots table.
 * Appends cache-busting (?v=<updated_at>) and falls back to default assets when no row exists.
 */
export async function getImageSlotsMap(): Promise<Record<string, SlotData>> {
  // Start with default slots
  const map: Record<string, SlotData> = {};
  for (const [key, val] of Object.entries(DEFAULT_SLOTS)) {
    map[key] = {
      url: val.url,
      altText: val.altText,
      focalPoint: val.focalPoint,
      isCustom: false,
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      console.log("[Slots Read] Supabase client unavailable, using default assets.");
      return map;
    }

    const { data: rows, error } = await supabase
      .from("image_slots")
      .select("slot_key, url, alt_text, focal_x, focal_y, updated_at");

    if (error) {
      console.warn("[Slots Read] Error reading image_slots table:", error.message);
      return map;
    }

    if (rows && rows.length > 0) {
      console.log(`[Slots Read] Successfully read ${rows.length} rows from image_slots table:`);
      for (const row of rows) {
        if (!row.slot_key || !row.url) continue;

        // Cache busting with updated_at timestamp
        let finalUrl = row.url;
        if (row.updated_at) {
          const v = new Date(row.updated_at).getTime();
          finalUrl = `${row.url}${row.url.includes("?") ? "&" : "?"}v=${v}`;
        }

        const focalX = row.focal_x || "50%";
        const focalY = row.focal_y || "50%";
        const focalPoint = `${focalX} ${focalY}`;

        map[row.slot_key] = {
          url: finalUrl,
          altText: row.alt_text || DEFAULT_SLOTS[row.slot_key]?.altText || "Hotel Fremont",
          focalPoint,
          isCustom: true,
          updatedAt: row.updated_at,
        };

        console.log(`  -> Slot '${row.slot_key}' mapped to: ${finalUrl}`);
      }
    } else {
      console.log("[Slots Read] image_slots table returned 0 rows (using default assets).");
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
