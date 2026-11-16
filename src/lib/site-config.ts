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

export const TO_BE_CONFIRMED_MARKER = "[TO BE CONFIRMED]";

export interface CancellationPolicyConfig {
  freeCancellationHours: number | null;
  lateCancellationCharge: string | null;
  noShowCharge: string | null;
  refundDays: number | null;
  refundMethod: string;
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
  email: string;
  checkInTime: string | null;
  checkOutTime: string | null;
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
  phone: "+91 98727 68514",
  phoneRaw: "+919872768514",
  phoneTel: "tel:+919872768514",
  email: "hotelfremont1@gmail.com",
  checkInTime: null, // [TO BE CONFIRMED]
  checkOutTime: null, // [TO BE CONFIRMED]
  cancellation: {
    freeCancellationHours: null, // [TO BE CONFIRMED]
    lateCancellationCharge: null, // [TO BE CONFIRMED]
    noShowCharge: null, // [TO BE CONFIRMED]
    refundDays: null, // [TO BE CONFIRMED]
    refundMethod: "original payment method",
  },
  lastUpdated: "November 16, 2026",
  googleMapsUrl: "https://maps.google.com/?q=Hotel+Fremont+Airport+Road+Sector+80+SAS+Nagar+Mohali+Punjab",
  coordinates: {
    latitude: "30.6865",
    longitude: "76.7214",
  },
};

/**
 * Returns formatted value or the prominent "[TO BE CONFIRMED]" marker if null/undefined.
 */
export function formatPolicyValue(val: string | number | null | undefined, suffix: string = ""): string {
  if (val === null || val === undefined) {
    return TO_BE_CONFIRMED_MARKER;
  }
  return `${val}${suffix}`;
}

export default siteConfig;

