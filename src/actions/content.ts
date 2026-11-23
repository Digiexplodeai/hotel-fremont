"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import { siteConfig } from "@/data/content";
import { CONTACT } from "@/data/contact";
import { revalidatePath } from "next/cache";

export interface FacilityItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface VenueItem {
  id: string;
  name: string;
  type: "banquet" | "conference";
  count: number;
  capacity_text: string;
  description: string;
  image_slot: string;
  sort_order: number;
  is_active: boolean;
}

export interface NearbyPlaceItem {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface SiteSettings {
  contact: {
    phoneDisplay: string;
    phoneTel: string;
    cleanPhone: string;
    whatsappNumber: string;
    whatsappDisplay: string;
    whatsappLink: string;
    email: string;
    address: string;
    city: string;
    directionsUrl: string;
  };
  branding: {
    name: string;
    badge: string;
    tagline: string;
    subline: string;
    heroLine: string;
    description: string;
  };
  timings: {
    checkInTime: string;
    checkOutTime: string;
    frontDesk: string;
    idPolicy: string;
    earlyLatePolicy: string;
  };
  cancellation: {
    hours: number;
    freeWindowText: string;
    lateChargeText: string;
    noShowText: string;
    refundText: string;
  };
  gst: {
    threshold: number;
    rateLow: number;
    rateHigh: number;
  };
  restaurant: {
    name: string;
    location: string;
    covers: number;
    timings: string;
    breakfast: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
  };
  socials: {
    instagram: string;
    facebook: string;
    linkedin: string;
    youtube: string;
    twitter: string;
  };
  // Compatibility properties
  reputation?: {
    showRating: boolean;
    rating: string;
    ratingLabel: string;
    reviewsSub: string;
  };
  notice?: {
    enabled: boolean;
    text: string;
  };
}

const defaultFacilities: FacilityItem[] = [
  { id: "fac-1", title: "24-Hour Reception", description: "Front desk assistance available 24 hours a day, 7 days a week.", icon: "Clock", sort_order: 1, is_active: true },
  { id: "fac-2", title: "Complimentary Wi-Fi", description: "High-speed wireless internet access across all rooms and common areas.", icon: "Wifi", sort_order: 2, is_active: true },
  { id: "fac-3", title: "On-Site Parking", description: "Convenient and secure parking space for staying guests and visitors.", icon: "Car", sort_order: 3, is_active: true },
  { id: "fac-4", title: "Air Conditioning", description: "Fully air-conditioned guest rooms with individual climate control.", icon: "Wind", sort_order: 4, is_active: true },
  { id: "fac-5", title: "Smart TV", description: "In-room entertainment with high-definition smart television.", icon: "Tv", sort_order: 5, is_active: true },
  { id: "fac-6", title: "Tea & Coffee Kettle", description: "In-room electric kettle with daily supplies of tea and coffee.", icon: "Coffee", sort_order: 6, is_active: true },
  { id: "fac-7", title: "Central Hot Water", description: "Continuous central hot-water system for comfort around the clock.", icon: "Flame", sort_order: 7, is_active: true },
  { id: "fac-8", title: "Housekeeping Service", description: "Daily professional housekeeping service maintaining cleanliness and hygiene.", icon: "Sparkles", sort_order: 8, is_active: true },
  { id: "fac-9", title: "Premium Linen & Duvets", description: "Specially made duvets, plush king-size bed linen, and quality washroom amenities.", icon: "BedDouble", sort_order: 9, is_active: true },
];

const defaultVenues: VenueItem[] = [
  {
    id: "ven-1",
    name: "Cloud 6 Banquet",
    type: "banquet",
    count: 1,
    capacity_text: "Up to 150 guests",
    description: "An elegant venue for celebrations and special occasions.",
    image_slot: "cloud-six-banquet",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "ven-2",
    name: "Conference Hall",
    type: "conference",
    count: 1,
    capacity_text: "Approximately 40 to 50 guests",
    description: "A dedicated setting for meetings and business discussions.",
    image_slot: "conference-hall",
    sort_order: 2,
    is_active: true,
  },
];

const defaultNearbyPlaces: NearbyPlaceItem[] = [
  { id: "np-1", name: "Gurdwara Singh Shaheedan, Sohana", sort_order: 1, is_active: true },
  { id: "np-2", name: "CP67 Mall and other shopping destinations", sort_order: 2, is_active: true },
  { id: "np-3", name: "Chandigarh International Airport", sort_order: 3, is_active: true },
  { id: "np-4", name: "Mohali IT, commercial and industrial hubs", sort_order: 4, is_active: true },
  { id: "np-5", name: "Local car-wash facility in the surrounding area", sort_order: 5, is_active: true },
];

let memorySettings: SiteSettings = {
  contact: {
    phoneDisplay: CONTACT.phoneDisplay,
    phoneTel: CONTACT.phoneTel,
    cleanPhone: CONTACT.cleanPhone,
    whatsappNumber: CONTACT.whatsappNumber,
    whatsappDisplay: CONTACT.whatsappDisplay,
    whatsappLink: CONTACT.whatsappLink,
    email: CONTACT.email,
    address: siteConfig.contact.address,
    city: siteConfig.contact.city,
    directionsUrl: siteConfig.contact.directionsUrl,
  },
  branding: {
    name: "Hotel Fremont",
    badge: "3-Star Hotel",
    tagline: "Thoughtful comfort. Warm hospitality.",
    subline: "A convenient address on Airport Road.",
    heroLine: "A comfortable stay in Mohali.",
    description:
      "Hotel Fremont is a contemporary hotel on Sector 80, Airport Road, Mohali. The property brings together thoughtfully appointed guest rooms, a ground-floor dining hall, Cloud 6 Banquet and a conference room, making it a convenient choice for business and leisure stays as well as social gatherings.",
  },
  timings: {
    checkInTime: "1:00 PM",
    checkOutTime: "11:00 AM",
    frontDesk: "24x7",
    idPolicy: "Valid government-issued photo ID required at check-in for all staying guests.",
    earlyLatePolicy: "Early check-in and late check-out on request, subject to availability, with additional charges.",
  },
  cancellation: {
    hours: 24,
    freeWindowText: "Cancellations made 24 hours or more before scheduled check-in time are permitted and fully refunded to the original payment method.",
    lateChargeText: "Cancellations made within 24 hours of check-in are non-refundable.",
    noShowText: "A no-show is non-refundable.",
    refundText: "Refunds are processed to the original payment method, usually within 5 to 7 working days.",
  },
  gst: {
    threshold: 7500,
    rateLow: 5,
    rateHigh: 18,
  },
  restaurant: {
    name: "Hotel Fremont Dining Hall",
    location: "Ground Floor",
    covers: 50,
    timings: "In-house kitchen operational daily until 10:30 PM",
    breakfast: "Breakfast buffet (complimentary with breakfast-inclusive plans)",
  },
  seo: {
    title: "Hotel Fremont | Comfortable Hotel on Airport Road, Mohali",
    description:
      "Hotel Fremont is a contemporary hotel on Sector 80, Airport Road, Mohali. Offering 21 guest rooms, ground-floor dining hall, Cloud 6 Banquet and conference hall.",
    keywords: "hotel in Mohali, hotel near Chandigarh airport, hotel Airport Road Mohali, banquet hall Mohali, Hotel Fremont Sector 80",
    canonical: "https://www.hotelfremont.in",
  },
  socials: {
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: "",
    twitter: "",
  },
  reputation: {
    showRating: false,
    rating: "",
    ratingLabel: "",
    reviewsSub: "",
  },
  notice: {
    enabled: false,
    text: "",
  },
};

/**
 * Get current site settings (from site_settings table or memory)
 */
export async function getSiteSettingsAction(): Promise<{
  success: boolean;
  settings: SiteSettings;
  isDatabase: boolean;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: true, settings: memorySettings, isDatabase: false };
    }

    const { data, error } = await supabase.from("site_settings").select("key, value");

    if (error || !data || data.length === 0) {
      return { success: true, settings: memorySettings, isDatabase: false };
    }

    const merged = { ...memorySettings };
    for (const row of data) {
      if (row.key === "contact" && row.value) {
        merged.contact = {
          ...merged.contact,
          phoneDisplay: row.value.phone || merged.contact.phoneDisplay,
          cleanPhone: row.value.clean_phone || merged.contact.cleanPhone,
          whatsappDisplay: row.value.whatsapp || merged.contact.whatsappDisplay,
          whatsappLink: row.value.whatsapp_link || merged.contact.whatsappLink,
          email: row.value.email || merged.contact.email,
        };
      } else if (row.key === "address" && row.value) {
        merged.contact.address = row.value.full || merged.contact.address;
        merged.contact.city = row.value.city || merged.contact.city;
      } else if (row.key === "branding" && row.value) {
        merged.branding = { ...merged.branding, ...row.value };
      } else if (row.key === "timings" && row.value) {
        merged.timings = {
          checkInTime: row.value.check_in || merged.timings.checkInTime,
          checkOutTime: row.value.check_out || merged.timings.checkOutTime,
          frontDesk: row.value.front_desk || merged.timings.frontDesk,
          idPolicy: row.value.id_policy || merged.timings.idPolicy,
          earlyLatePolicy: row.value.early_late_policy || merged.timings.earlyLatePolicy,
        };
      } else if (row.key === "cancellation" && row.value) {
        merged.cancellation = {
          hours: Number(row.value.hours) || merged.cancellation.hours,
          freeWindowText: row.value.free_window_text || merged.cancellation.freeWindowText,
          lateChargeText: row.value.late_charge_text || merged.cancellation.lateChargeText,
          noShowText: row.value.no_show_text || merged.cancellation.noShowText,
          refundText: row.value.refund_text || merged.cancellation.refundText,
        };
      } else if (row.key === "gst" && row.value) {
        merged.gst = {
          threshold: Number(row.value.threshold) || merged.gst.threshold,
          rateLow: Number(row.value.rate_low) || merged.gst.rateLow,
          rateHigh: Number(row.value.rate_high) || merged.gst.rateHigh,
        };
      } else if (row.key === "restaurant" && row.value) {
        merged.restaurant = { ...merged.restaurant, ...row.value };
      } else if (row.key === "seo" && row.value) {
        merged.seo = { ...merged.seo, ...row.value };
      } else if (row.key === "social_links" && row.value) {
        merged.socials = { ...merged.socials, ...row.value };
      }
    }

    return { success: true, settings: merged, isDatabase: true };
  } catch {
    return { success: true, settings: memorySettings, isDatabase: false };
  }
}

/**
 * Save site settings (admin only)
 */
export async function updateSiteSettingsAction(settings: Partial<SiteSettings>): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") {
      return { success: false, error: "Unauthorized: Admin session required." };
    }

    memorySettings = {
      ...memorySettings,
      ...settings,
      contact: { ...memorySettings.contact, ...(settings.contact || {}) },
      branding: { ...memorySettings.branding, ...(settings.branding || {}) },
      timings: { ...memorySettings.timings, ...(settings.timings || {}) },
      cancellation: { ...memorySettings.cancellation, ...(settings.cancellation || {}) },
      gst: { ...memorySettings.gst, ...(settings.gst || {}) },
      restaurant: { ...memorySettings.restaurant, ...(settings.restaurant || {}) },
      seo: { ...memorySettings.seo, ...(settings.seo || {}) },
      socials: { ...memorySettings.socials, ...(settings.socials || {}) },
    };

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      if (settings.contact) {
        await supabase.from("site_settings").upsert({
          key: "contact",
          value: {
            phone: memorySettings.contact.phoneDisplay,
            clean_phone: memorySettings.contact.cleanPhone,
            whatsapp: memorySettings.contact.whatsappDisplay,
            whatsapp_link: memorySettings.contact.whatsappLink,
            email: memorySettings.contact.email,
          },
          updated_at: new Date().toISOString(),
        });
        await supabase.from("site_settings").upsert({
          key: "address",
          value: {
            full: memorySettings.contact.address,
            city: memorySettings.contact.city,
          },
          updated_at: new Date().toISOString(),
        });
      }

      if (settings.branding) {
        await supabase.from("site_settings").upsert({
          key: "branding",
          value: memorySettings.branding,
          updated_at: new Date().toISOString(),
        });
      }

      if (settings.timings) {
        await supabase.from("site_settings").upsert({
          key: "timings",
          value: {
            check_in: memorySettings.timings.checkInTime,
            check_out: memorySettings.timings.checkOutTime,
            front_desk: memorySettings.timings.frontDesk,
            id_policy: memorySettings.timings.idPolicy,
            early_late_policy: memorySettings.timings.earlyLatePolicy,
          },
          updated_at: new Date().toISOString(),
        });
      }

      if (settings.cancellation) {
        await supabase.from("site_settings").upsert({
          key: "cancellation",
          value: {
            hours: memorySettings.cancellation.hours,
            free_window_text: memorySettings.cancellation.freeWindowText,
            late_charge_text: memorySettings.cancellation.lateChargeText,
            no_show_text: memorySettings.cancellation.noShowText,
            refund_text: memorySettings.cancellation.refundText,
          },
          updated_at: new Date().toISOString(),
        });
      }

      if (settings.gst) {
        await supabase.from("site_settings").upsert({
          key: "gst",
          value: {
            threshold: memorySettings.gst.threshold,
            rate_low: memorySettings.gst.rateLow,
            rate_high: memorySettings.gst.rateHigh,
          },
          updated_at: new Date().toISOString(),
        });
      }

      if (settings.restaurant) {
        await supabase.from("site_settings").upsert({
          key: "restaurant",
          value: memorySettings.restaurant,
          updated_at: new Date().toISOString(),
        });
      }

      if (settings.seo) {
        await supabase.from("site_settings").upsert({
          key: "seo",
          value: memorySettings.seo,
          updated_at: new Date().toISOString(),
        });
      }

      if (settings.socials) {
        await supabase.from("site_settings").upsert({
          key: "social_links",
          value: memorySettings.socials,
          updated_at: new Date().toISOString(),
        });
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/content");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return { success: false, error: message };
  }
}

// ==========================================
// FACILITIES CRUD
// ==========================================

export async function getFacilitiesAction(includeInactive: boolean = false): Promise<{
  success: boolean;
  facilities: FacilityItem[];
}> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: true, facilities: defaultFacilities };

    let query = supabase.from("facilities").select("*").order("sort_order", { ascending: true });
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { success: true, facilities: defaultFacilities };
    }
    return { success: true, facilities: data };
  } catch {
    return { success: true, facilities: defaultFacilities };
  }
}

export async function saveFacilityAction(
  facility: Partial<FacilityItem>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") {
      return { success: false, error: "Unauthorized" };
    }
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: false, error: "DB unavailable" };

    const payload = {
      title: facility.title?.trim() || "New Facility",
      description: facility.description?.trim() || "",
      icon: facility.icon || "Sparkles",
      sort_order: facility.sort_order || 0,
      is_active: facility.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (facility.id && !facility.id.startsWith("fac-")) {
      const { error } = await supabase.from("facilities").update(payload).eq("id", facility.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from("facilities").insert(payload);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteFacilityAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") return { success: false, error: "Unauthorized" };
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: false, error: "DB unavailable" };

    const { error } = await supabase.from("facilities").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// VENUES CRUD
// ==========================================

export async function getVenuesAction(includeInactive: boolean = false): Promise<{
  success: boolean;
  venues: VenueItem[];
}> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: true, venues: defaultVenues };

    let query = supabase.from("venues").select("*").order("sort_order", { ascending: true });
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { success: true, venues: defaultVenues };
    }
    return { success: true, venues: data };
  } catch {
    return { success: true, venues: defaultVenues };
  }
}

export async function saveVenueAction(
  venue: Partial<VenueItem>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") return { success: false, error: "Unauthorized" };
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: false, error: "DB unavailable" };

    const payload = {
      name: venue.name?.trim() || "New Venue",
      type: venue.type || "banquet",
      count: venue.count || 1,
      capacity_text: venue.capacity_text?.trim() || "Up to 50 guests",
      description: venue.description?.trim() || "",
      image_slot: venue.image_slot || "",
      sort_order: venue.sort_order || 0,
      is_active: venue.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (venue.id && !venue.id.startsWith("ven-")) {
      const { error } = await supabase.from("venues").update(payload).eq("id", venue.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from("venues").insert(payload);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteVenueAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") return { success: false, error: "Unauthorized" };
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: false, error: "DB unavailable" };

    const { error } = await supabase.from("venues").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// NEARBY PLACES CRUD
// ==========================================

export async function getNearbyPlacesAction(includeInactive: boolean = false): Promise<{
  success: boolean;
  places: NearbyPlaceItem[];
}> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: true, places: defaultNearbyPlaces };

    let query = supabase.from("nearby_places").select("*").order("sort_order", { ascending: true });
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { success: true, places: defaultNearbyPlaces };
    }
    return { success: true, places: data };
  } catch {
    return { success: true, places: defaultNearbyPlaces };
  }
}

export async function saveNearbyPlaceAction(place: {
  id?: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") return { success: false, error: "Unauthorized" };
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: false, error: "DB unavailable" };

    const payload = {
      name: place.name.trim(),
      sort_order: place.sort_order || 0,
      is_active: place.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (place.id && !place.id.startsWith("np-")) {
      const { error } = await supabase.from("nearby_places").update(payload).eq("id", place.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from("nearby_places").insert(payload);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteNearbyPlaceAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== "admin@hotelfremont.com") return { success: false, error: "Unauthorized" };
    const supabase = await createServerSupabaseClient();
    if (!supabase) return { success: false, error: "DB unavailable" };

    const { error } = await supabase.from("nearby_places").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
