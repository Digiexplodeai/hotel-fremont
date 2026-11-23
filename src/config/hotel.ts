/**
 * HOTEL FREMONT - CENTRAL INVENTORY & RATE CONFIGURATION
 * 
 * 21 Keys Inventory · Airport Road, Sector 80, Mohali
 * Single source of truth for config constants, fallback room types, and tax rates.
 */

export interface RoomTypeConfig {
  code: string;
  name: string;
  slug?: string;
  pricePerNight: number;
  totalRooms: number;
  roomsTotal?: number;
  maxGuests: number;
  isActive: boolean;
  sortOrder: number;
  sizeSqft?: number;
  bedType?: string;
  badge?: string;
  tag?: string;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  amenities?: string[];
  rateCpDouble?: number;
  rateCpSingle?: number;
  rateEpDouble?: number;
  rateEpSingle?: number;
  imageSlot?: string;
}

export const HOTEL_CONFIG = {
  name: "Hotel Fremont",
  tagline: "Thoughtful comfort. Warm hospitality.",
  subline: "A convenient address on Airport Road.",
  heroLine: "A comfortable stay in Mohali.",
  badge: "3-Star Hotel",
  phone: "+91 79734 50281",
  cleanPhone: "917973450281",
  whatsappNumber: "917973450281",
  whatsappLink: "https://wa.me/917973450281",
  email: "hotelfremont1@gmail.com",
  address: "Hotel Fremont, Khasra No 186, Sector 80, Village Mauli Baidwan, Airport Road, Mohali (SAS Nagar), Punjab - 140308",
  checkInTime: "1:00 PM",
  checkOutTime: "11:00 AM",
  cancellationHours: 24,
  // GST Threshold Rules (per room per night)
  gstThreshold: 7500,
  gstRate: 0.05,
  gstRateLow: 0.05, // 5% GST for base tariff up to Rs 7,500
  gstRateHigh: 0.18, // 18% GST for base tariff above Rs 7,500
  maxStayNights: 30,
  maxRoomsPerBooking: 21,
  totalHotelKeys: 21,
  currencySymbol: "₹",
  refCodePrefix: "FRM-",
};

/**
 * 21 Physical Rooms Inventory across 3 room categories
 * Exactly 21 keys total:
 * - Deluxe Room: 9 rooms (approx 160 sq ft, rates from Rs 2,299)
 * - Super Deluxe Room: 10 rooms (approx 250 sq ft, rates from Rs 3,299)
 * - Premium Room: 2 rooms (approx 365 sq ft, rates from Rs 4,299)
 */
export const DEFAULT_ROOM_TYPES: RoomTypeConfig[] = [
  {
    code: "deluxe-room",
    slug: "deluxe-room",
    name: "Deluxe Room",
    pricePerNight: 2299,
    totalRooms: 9,
    roomsTotal: 9,
    maxGuests: 2,
    isActive: true,
    sortOrder: 1,
    sizeSqft: 160,
    bedType: "Plush King-size bed",
    tag: "",
    shortDescription: "A practical, comfortable stay with essential modern conveniences.",
    longDescription: "A practical, comfortable stay with essential modern conveniences. Features a plush king-size bed, air conditioning, Smart TV, tea and coffee maker, and complimentary Wi-Fi.",
    description: "A practical, comfortable stay with essential modern conveniences. Features a plush king-size bed, air conditioning, Smart TV, tea and coffee maker, and complimentary Wi-Fi.",
    amenities: [
      "Air Conditioning",
      "Smart TV",
      "Tea & Coffee Kettle",
      "Complimentary Wi-Fi",
      "Washroom Amenities",
      "Central Hot Water",
      "Housekeeping Service",
      "Premium Linen & Duvets",
    ],
    rateCpDouble: 2799,
    rateCpSingle: 2499,
    rateEpDouble: 2499,
    rateEpSingle: 2299,
    imageSlot: "deluxe-room",
  },
  {
    code: "super-deluxe-room",
    slug: "super-deluxe-room",
    name: "Super Deluxe Room",
    pricePerNight: 3299,
    totalRooms: 10,
    roomsTotal: 10,
    maxGuests: 2,
    isActive: true,
    sortOrder: 2,
    sizeSqft: 250,
    bedType: "Plush King-size bed",
    tag: "Best choice for corporate stays",
    badge: "Best choice for corporate stays",
    shortDescription: "More room to unwind, with a calm palette and inviting interiors.",
    longDescription: "More room to unwind, with a calm palette and inviting interiors. The Super Deluxe Room pairs a plush king-size bed with warm wood finishes, soft lighting and a calm, contemporary look.",
    description: "More room to unwind, with a calm palette and inviting interiors. The Super Deluxe Room pairs a plush king-size bed with warm wood finishes, soft lighting and a calm, contemporary look.",
    amenities: [
      "Air Conditioning",
      "Smart TV",
      "Tea & Coffee Kettle",
      "Complimentary Wi-Fi",
      "Washroom Amenities",
      "Central Hot Water",
      "Housekeeping Service",
      "Premium Linen & Duvets",
    ],
    rateCpDouble: 3799,
    rateCpSingle: 3499,
    rateEpDouble: 3499,
    rateEpSingle: 3299,
    imageSlot: "super-deluxe",
  },
  {
    code: "premium-room",
    slug: "premium-room",
    name: "Premium Room",
    pricePerNight: 4299,
    totalRooms: 2,
    roomsTotal: 2,
    maxGuests: 2,
    isActive: true,
    sortOrder: 3,
    sizeSqft: 365,
    bedType: "Plush King-size bed",
    tag: "",
    shortDescription: "A more spacious stay with distinctive styling and a refined feel.",
    longDescription: "A more spacious stay with distinctive styling and a refined feel. The Premium Room features elegant burgundy interiors, a plush king-size bed and contemporary furnishings. Its generous layout offers a welcoming place to relax, work or recharge.",
    description: "A more spacious stay with distinctive styling and a refined feel. The Premium Room features elegant burgundy interiors, a plush king-size bed and contemporary furnishings. Its generous layout offers a welcoming place to relax, work or recharge.",
    amenities: [
      "Air Conditioning",
      "Smart TV",
      "Tea & Coffee Kettle",
      "Complimentary Wi-Fi",
      "Washroom Amenities",
      "Central Hot Water",
      "Housekeeping Service",
      "Premium Linen & Duvets",
    ],
    rateCpDouble: 4799,
    rateCpSingle: 4499,
    rateEpDouble: 4499,
    rateEpSingle: 4299,
    imageSlot: "premium",
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
 * Comprehensive contact phone validation for enquiries and bookings:
 * - Validates 10-digit Indian mobile numbers (must start with 6, 7, 8, or 9).
 * - Supports Indian numbers with leading +91, 91, or 0.
 * - Supports international numbers with explicit leading '+' (8 to 15 digits according to ITU-T E.164).
 * - Rejects ambiguous un-prefixed non-10 digit numbers (e.g. 12 digits without '+').
 */
export function validateContactPhone(phoneInput: string): {
  isValid: boolean;
  formattedPhone: string;
  cleanDigits: string;
  isIndian: boolean;
  error?: string;
} {
  if (!phoneInput || typeof phoneInput !== "string") {
    return { isValid: false, formattedPhone: "", cleanDigits: "", isIndian: false, error: "Phone number is required." };
  }

  const trimmed = phoneInput.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  // 1. Explicit International Number with leading '+'
  if (hasPlus) {
    // If it has India's country code +91
    if (digits.startsWith("91")) {
      const national = digits.slice(2);
      if (national.length === 10 && /^[6-9]/.test(national)) {
        return {
          isValid: true,
          formattedPhone: `+91 ${national.slice(0, 5)} ${national.slice(5)}`,
          cleanDigits: `91${national}`,
          isIndian: true,
        };
      }
      return {
        isValid: false,
        formattedPhone: trimmed,
        cleanDigits: digits,
        isIndian: true,
        error: "Indian mobile numbers after +91 must be 10 digits starting with 6, 7, 8, or 9.",
      };
    }

    // Other international countries: E.164 standard (8 to 15 digits total)
    if (digits.length >= 8 && digits.length <= 15) {
      return {
        isValid: true,
        formattedPhone: `+${digits}`,
        cleanDigits: digits,
        isIndian: false,
      };
    }
    return {
      isValid: false,
      formattedPhone: trimmed,
      cleanDigits: digits,
      isIndian: false,
      error: "International numbers must have between 8 and 15 digits including country code.",
    };
  }

  // 2. Starts with 91 but no explicit '+'
  if (digits.length === 12 && digits.startsWith("91")) {
    const national = digits.slice(2);
    if (/^[6-9]/.test(national)) {
      return {
        isValid: true,
        formattedPhone: `+91 ${national.slice(0, 5)} ${national.slice(5)}`,
        cleanDigits: digits,
        isIndian: true,
      };
    }
    return {
      isValid: false,
      formattedPhone: trimmed,
      cleanDigits: digits,
      isIndian: true,
      error: "Indian mobile numbers after 91 must be 10 digits starting with 6, 7, 8, or 9.",
    };
  }

  // 3. Leading 0 (Indian trunk code: 0XXXXXXXXXX)
  if (digits.length === 11 && digits.startsWith("0")) {
    const national = digits.slice(1);
    if (/^[6-9]/.test(national)) {
      return {
        isValid: true,
        formattedPhone: `+91 ${national.slice(0, 5)} ${national.slice(5)}`,
        cleanDigits: `91${national}`,
        isIndian: true,
      };
    }
  }

  // 4. Standard 10-digit Indian mobile
  if (digits.length === 10) {
    if (/^[6-9]/.test(digits)) {
      return {
        isValid: true,
        formattedPhone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
        cleanDigits: `91${digits}`,
        isIndian: true,
      };
    }
    return {
      isValid: false,
      formattedPhone: trimmed,
      cleanDigits: digits,
      isIndian: true,
      error: "Indian mobile numbers must start with 6, 7, 8, or 9.",
    };
  }

  // 5. Number is too short
  if (digits.length < 10) {
    return {
      isValid: false,
      formattedPhone: trimmed,
      cleanDigits: digits,
      isIndian: false,
      error: "Phone number is too short. Please enter a 10-digit Indian mobile number or international number with '+' (e.g. +1...).",
    };
  }

  // 6. Number is > 10 digits without '+'
  return {
    isValid: false,
    formattedPhone: trimmed,
    cleanDigits: digits,
    isIndian: false,
    error: "Please enter a 10-digit Indian mobile number, or include '+' with country code for international numbers (e.g. +1...).",
  };
}

/**
 * Format currency with Indian grouping (e.g. ₹2,299)
 */
export function formatINR(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}
