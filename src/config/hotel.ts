/**
 * HOTEL FREMONT - CENTRAL INVENTORY & RATE CONFIGURATION
 * 
 * 12 Keys Luxury Boutique Inventory (Airport Road, Mohali)
 * Single source of truth for config constants, fallback room types, and tax rates.
 */

export interface RoomTypeConfig {
  code: string;
  name: string;
  pricePerNight: number;
  totalRooms: number;
  maxGuests: number;
  isActive: boolean;
  sortOrder: number;
  description?: string;
  badge?: string;
}

export const HOTEL_CONFIG = {
  name: "Hotel Fremont",
  tagline: "12 Luxury Keys · Airport Road, Sector 80, Mohali",
  phone: "+91 98727 68514",
  cleanPhone: "919872768514",
  whatsappNumber: "919872768514",
  gstRate: 0.18, // 18% Luxury Hotel GST (editable)
  gstPercentageLabel: "18%",
  maxStayNights: 30,
  maxRoomsPerBooking: 3,
  totalHotelKeys: 12,
  currencySymbol: "₹",
  refCodePrefix: "FRM-",
};

/**
 * 12 Physical Rooms Inventory across 4 luxury room categories
 * Exactly 12 keys total:
 * - Deluxe King Room: 6 rooms (Rs 5,499)
 * - Premier Executive Suite: 3 rooms (Rs 8,999)
 * - The Royal Fremont Suite: 2 rooms (Rs 14,999)
 * - Presidential Penthouse: 1 room (Rs 24,999)
 */
export const DEFAULT_ROOM_TYPES: RoomTypeConfig[] = [
  {
    code: "deluxe-king",
    name: "Deluxe King Room",
    pricePerNight: 5499,
    totalRooms: 6,
    maxGuests: 3,
    isActive: true,
    sortOrder: 1,
    badge: "Most Popular",
    description: "Expansive king bedroom with handcrafted walnut furnishings, marble ensuite, and runway sunset views.",
  },
  {
    code: "premier-executive",
    name: "Premier Executive Suite",
    pricePerNight: 8999,
    totalRooms: 3,
    maxGuests: 3,
    isActive: true,
    sortOrder: 2,
    badge: "Executive Choice",
    description: "Separate executive lounge, workstation, Italian espresso bar, and walk-in rain shower.",
  },
  {
    code: "royal-fremont",
    name: "The Royal Fremont Suite",
    pricePerNight: 14999,
    totalRooms: 2,
    maxGuests: 4,
    isActive: true,
    sortOrder: 3,
    badge: "Signature Experience",
    description: "Dual-aspect suites with brass accents, private dining alcove, whirlpool jacuzzi, and dedicated butler service.",
  },
  {
    code: "presidential-penthouse",
    name: "Presidential Penthouse",
    pricePerNight: 24999,
    totalRooms: 1,
    maxGuests: 6,
    isActive: true,
    sortOrder: 4,
    badge: "Ultra Luxury",
    description: "Crown jewel top floor penthouse with grand piano lounge, private rooftop terrace, and round-the-clock chef service.",
  },
];

/**
 * Validates a 10-digit Indian phone number (with optional +91 or 91 country prefix).
 */
export function validateIndianPhone(phone: string): { isValid: boolean; cleanPhone: string; error?: string } {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, cleanPhone: "", error: "Phone number is required." };
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    if (!/^[6-9]/.test(digits)) {
      return { isValid: false, cleanPhone: digits, error: "Indian mobile numbers start with 6, 7, 8, or 9." };
    }
    return { isValid: true, cleanPhone: digits };
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    if (!/^[6-9]/.test(local)) {
      return { isValid: false, cleanPhone: local, error: "Indian mobile numbers start with 6, 7, 8, or 9." };
    }
    return { isValid: true, cleanPhone: local };
  }

  return { isValid: false, cleanPhone: digits, error: "Please enter a valid 10-digit Indian mobile number." };
}

/**
 * Format currency with Indian grouping (e.g. ₹14,999)
 */
export function formatINR(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

