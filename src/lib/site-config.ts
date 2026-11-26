/**
 * HOTEL FREMONT - OFFICIAL SITE CONFIGURATION & SINGLE SOURCE OF TRUTH
 * 
 * Used across all pages, SEO metadata, JSON-LD schema, footer, contact section,
 * and Razorpay compliance legal/policy pages.
 * 
 * Never hardcode site domain, email, address, or policy values elsewhere.
 */

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.hotelfremont.in";
// Ensure no trailing slash in base site URL
export const siteUrl = rawSiteUrl.replace(/\/+$/, "");

export interface CancellationPolicyConfig {
  freeCancellationHours: string;
  lateCancellationCharge: string;
  noShowCharge: string;
  refundDays: string;
  refundMethod: string;
  refundTimelineText: string;
}

export interface SiteConfig {
  siteUrl: string;
  siteName: string;
  tradeName: string;
  proprietorName: string;
  address: string;
  addressComponents: {
    street: string;
    khasraNo: string;
    sector: string;
    village: string;
    city: string;
    district: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  phoneRaw: string;
  phoneTel: string;
  whatsappLink: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  cancellation: CancellationPolicyConfig;
  lastUpdated: string;
  googleMapsUrl: string;
  coordinates: {
    latitude: string;
    longitude: string;
  };
}

export const siteConfig: SiteConfig = {
  siteUrl,
  siteName: "Hotel Fremont",
  tradeName: "Hotel Fremont",
  proprietorName: "Harmanpreet Singh",
  address: "Hotel Fremont, Khasra No 186, Sector 80, Village Mauli Baidwan, Airport Road, Mohali (SAS Nagar), Punjab - 140308",
  addressComponents: {
    street: "Airport Road",
    khasraNo: "Khasra No 186",
    sector: "Sector 80",
    village: "Village Mauli Baidwan",
    city: "Mohali",
    district: "SAS Nagar",
    state: "Punjab",
    postalCode: "140308",
    country: "India",
  },
  phone: "+91 79734 50281",
  phoneRaw: "+917973450281",
  phoneTel: "tel:+917973450281",
  whatsappLink: "https://wa.me/917973450281",
  email: "hotelfremont1@gmail.com",
  checkInTime: "12:00 PM",
  checkOutTime: "11:00 AM",
  cancellation: {
    freeCancellationHours: "24 hours",
    lateCancellationCharge: "1 Night Room Tariff",
    noShowCharge: "1 Night Room Tariff",
    refundDays: "5 to 7 working days",
    refundMethod: "original payment method",
    refundTimelineText: "Refunds are processed to the original payment method, usually within 5 to 7 working days.",
  },
  lastUpdated: "November 26, 2026",
  googleMapsUrl: "https://maps.google.com/?q=Hotel+Fremont+Airport+Road+Sector+80+SAS+Nagar+Mohali+Punjab",
  coordinates: {
    latitude: "30.6865",
    longitude: "76.7214",
  },
};

/**
 * Returns formatted value or empty string if null/undefined.
 */
export function formatPolicyValue(val: string | number | null | undefined, suffix: string = ""): string {
  if (val === null || val === undefined) {
    return "";
  }
  return `${val}${suffix}`;
}

export const SITE_CONFIG = siteConfig;

export default siteConfig;
