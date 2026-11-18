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
  phone: "+91 98727 68514",
  phoneRaw: "+919872768514",
  phoneTel: "tel:+919872768514",
  email: "hotelfremont1@gmail.com",
  checkInTime: "2:00 PM",
  checkOutTime: "12:00 PM",
  cancellation: {
    freeCancellationHours: "48 hours",
    lateCancellationCharge: "one night's room tariff (inclusive of applicable taxes)",
    noShowCharge: "100% of the first night's room tariff",
    refundDays: "5 to 7 working days",
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
