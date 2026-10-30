"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { siteConfig } from "@/data/content";
import { CONTACT } from "@/data/contact";
import { HOTEL_REPUTATION } from "@/data/rooms";
import { revalidatePath } from "next/cache";

export interface SiteSettings {
  contact: {
    phoneDisplay: string;
    phoneTel: string;
    whatsappNumber: string;
    whatsappDisplay: string;
    email: string;
    address: string;
    city: string;
    directionsUrl: string;
  };
  reputation: {
    showRating: boolean;
    rating: string;
    ratingLabel: string;
    reviewsSub: string;
  };
  socials: {
    instagram: string;
    facebook: string;
    linkedin: string;
    youtube: string;
  };
  notice: {
    enabled: boolean;
    text: string;
  };
}

let memorySettings: SiteSettings = {
  contact: {
    phoneDisplay: CONTACT.phoneDisplay,
    phoneTel: CONTACT.phoneTel,
    whatsappNumber: CONTACT.whatsappNumber,
    whatsappDisplay: CONTACT.whatsappDisplay,
    email: siteConfig.contact.email,
    address: siteConfig.contact.address,
    city: siteConfig.contact.city,
    directionsUrl: siteConfig.contact.directionsUrl,
  },
  reputation: {
    showRating: true,
    rating: HOTEL_REPUTATION.rating,
    ratingLabel: HOTEL_REPUTATION.ratingLabel,
    reviewsSub: HOTEL_REPUTATION.reviewsSub,
  },
  socials: {
    instagram: siteConfig.footer.socials.find((s) => s.name === "Instagram")?.href || "",
    facebook: siteConfig.footer.socials.find((s) => s.name === "Facebook")?.href || "",
    linkedin: siteConfig.footer.socials.find((s) => s.name === "Linkedin")?.href || "",
    youtube: siteConfig.footer.socials.find((s) => s.name === "Youtube")?.href || "",
  },
  notice: {
    enabled: false,
    text: "Direct Booking Special: Enjoy complimentary VIP airport transfers when booking directly on our official website.",
  },
};

/**
 * Get current site settings
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

    const { data, error } = await supabase
      .from("site_content")
      .select("key, data");

    if (error || !data || data.length === 0) {
      return { success: true, settings: memorySettings, isDatabase: false };
    }

    const merged = { ...memorySettings };
    data.forEach((row) => {
      if (row.key === "settings.general" && row.data) {
        Object.assign(merged, row.data);
      }
    });

    return { success: true, settings: merged, isDatabase: true };
  } catch {
    return { success: true, settings: memorySettings, isDatabase: false };
  }
}

/**
 * Save site settings
 */
export async function updateSiteSettingsAction(settings: Partial<SiteSettings>): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    memorySettings = {
      ...memorySettings,
      ...settings,
      contact: { ...memorySettings.contact, ...(settings.contact || {}) },
      reputation: { ...memorySettings.reputation, ...(settings.reputation || {}) },
      socials: { ...memorySettings.socials, ...(settings.socials || {}) },
      notice: { ...memorySettings.notice, ...(settings.notice || {}) },
    };

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase
        .from("site_content")
        .upsert({
          key: "settings.general",
          data: memorySettings as unknown as Record<string, string | number | boolean>,
          updated_at: new Date().toISOString(),
        });
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/content");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return { success: false, error: message };
  }
}

