import { siteConfig } from "@/data/content";
import { roomCategories as defaultRoomCategories, RoomCategory } from "@/data/rooms";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ImageSlotData {
  url: string;
  altText: string;
  focalPoint?: string;
}

export interface SiteData {
  config: typeof siteConfig;
  rooms: RoomCategory[];
  imageSlots: Record<string, ImageSlotData>;
  isUsingDatabase: boolean;
}

/**
 * Loads dynamic content and media slots from Supabase PostgreSQL,
 * with seamless fallback to static content.js and rooms.ts if the DB is unconfigured or unreachable.
 */
export async function getSiteData(): Promise<SiteData> {
  // Default fallback data
  const defaultSlots: Record<string, ImageSlotData> = {
    "branding.logo": { url: siteConfig.brand.logoPath, altText: "Hotel Fremont" },
    "branding.icon": { url: siteConfig.brand.iconPath, altText: "Hotel Fremont Icon" },
    "hero.slide_1": { url: "/assets/hero/hero-suite.webp", altText: "Classic Luxury Suite" },
    "hero.slide_2": { url: "/assets/hero/hero-room-1.webp", altText: "Deluxe King Room" },
    "hero.slide_3": { url: "/assets/hero/hero-lobby.webp", altText: "Panoramic Modern Suite" },
    "hero.slide_4": { url: "/assets/hero/hero-room-2.webp", altText: "Executive Lounge Suite" },
    "about.image_primary": { url: siteConfig.about.imagePrimary, altText: "Hotel Fremont Suite Sanctuary" },
    "about.image_secondary": { url: siteConfig.about.imageSecondary, altText: "Luxury Interior" },
    "dining.banner_primary": { url: siteConfig.dining.imagePrimary, altText: siteConfig.dining.name },
  };

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return {
        config: siteConfig,
        rooms: defaultRoomCategories,
        imageSlots: defaultSlots,
        isUsingDatabase: false,
      };
    }

    // Parallel fetch from database
    const [slotsRes, roomsRes, contentRes] = await Promise.all([
      supabase
        .from("image_slots")
        .select("slot_key, fallback_url, alt_text, focal_point, media_assets(url, alt_text)"),
      supabase
        .from("room_categories")
        .select("*")
        .eq("is_active", true),
      supabase
        .from("site_content")
        .select("key, data"),
    ]);

    interface DBImageSlot {
      slot_key: string;
      fallback_url: string;
      alt_text: string | null;
      focal_point: string | null;
      media_assets?: { url: string; alt_text: string | null } | null;
    }

    interface DBRoomCategory {
      slug: string;
      name: string;
      price: number;
      size: string;
      max_guests: number;
      bed: string;
      badge: string | null;
      view: string | null;
      description: string;
      highlights: string[] | null;
      amenities: string[] | null;
      fallback_image: string;
      gallery_fallback: string[] | null;
    }

    interface DBSiteContent {
      key: string;
      data: Record<string, string | number | boolean>;
    }

    const imageSlots = { ...defaultSlots };

    if (slotsRes.data && slotsRes.data.length > 0) {
      (slotsRes.data as unknown as DBImageSlot[]).forEach((slot) => {
        const media = slot.media_assets;
        imageSlots[slot.slot_key] = {
          url: media?.url || slot.fallback_url,
          altText: media?.alt_text || slot.alt_text || "Hotel Fremont",
          focalPoint: slot.focal_point || "50% 50%",
        };
      });
    }

    // Room categories mapping
    let rooms = defaultRoomCategories;
    if (roomsRes.data && roomsRes.data.length > 0) {
      rooms = (roomsRes.data as unknown as DBRoomCategory[]).map((r) => {
        const matchingDefault = defaultRoomCategories.find((dr) => dr.slug === r.slug);
        return {
          slug: r.slug,
          id: r.slug,
          name: r.name,
          title: r.name,
          totalRooms: matchingDefault?.totalRooms || 2,
          inventoryLabel: matchingDefault?.inventoryLabel || "Suites",
          roomNumbers: matchingDefault?.roomNumbers || [],
          price: r.price,
          priceLabel: `₹${r.price.toLocaleString("en-IN")}`,
          size: r.size,
          maxGuests: r.max_guests,
          bed: r.bed,
          occupancy: `${r.max_guests} Guests`,
          badge: r.badge || "",
          view: r.view || "",
          description: r.description,
          highlights: r.highlights || matchingDefault?.highlights || [],
          amenities: r.amenities || matchingDefault?.amenities || [],
          image: r.fallback_image,
          gallery: r.gallery_fallback || matchingDefault?.gallery || [],
        };
      });
    }

    // Override dynamic settings
    const config = { ...siteConfig };
    if (contentRes.data) {
      const contentRows = contentRes.data as unknown as DBSiteContent[];
      const settingsRow = contentRows.find((c) => c.key === "site_settings");
      if (settingsRow?.data) {
        const s = settingsRow.data;
        if (typeof s.phoneDisplay === "string") config.contact.phone = s.phoneDisplay;
        if (typeof s.phoneDisplay === "string") config.contact.phoneDisplay = s.phoneDisplay;
        if (typeof s.phoneTel === "string") config.contact.phoneTel = s.phoneTel;
        if (typeof s.whatsappNumber === "string") config.contact.whatsappNumber = s.whatsappNumber;
        if (typeof s.bookingEmail === "string") config.contact.bookingEmail = s.bookingEmail;
        if (typeof s.address === "string") config.contact.address = s.address;
      }
    }

    return {
      config,
      rooms,
      imageSlots,
      isUsingDatabase: true,
    };
  } catch (err) {
    console.warn("Notice: Supabase read failed, serving from local content.js fallback:", err);
    return {
      config: siteConfig,
      rooms: defaultRoomCategories,
      imageSlots: defaultSlots,
      isUsingDatabase: false,
    };
  }
}
