/**
 * HOTEL FREMONT - PAYMENT & RAZORPAY CONFIGURATION
 * Single source of truth for online room bookings payment settings.
 * 
 * Payment model: FULL PAYMENT (100% online tariff paid at checkout).
 * There is NO advance and NO balance payable at the hotel.
 */

import { DEFAULT_ROOM_TYPES, HOTEL_CONFIG, RoomTypeConfig } from "@/config/hotel";

export const PAYMENT_CONFIG = {
  PAYMENT_MODE: "full" as const,
  CURRENCY: "INR" as const,
  HOLD_MINUTES: 20, // Unpaid pending reservations expire after 20 minutes
  GST_THRESHOLD: 7500, // Rs 7,500 threshold
  GST_RATE_LOW: 0.05, // 5% GST for base tariff <= Rs 7,500
  GST_RATE_HIGH: 0.18, // 18% GST for base tariff > Rs 7,500
  BRAND_NAME: "Hotel Fremont",
  THEME_COLOR: "#E02B1D", // Hotel Fremont crimson brand accent
  DEFAULT_HOTEL_EMAIL: "hotelfremont1@gmail.com",
  CANCELLATION_SUMMARY:
    "Cancellations made 24 hours or more before scheduled check-in time are permitted and fully refunded to the original payment method. Cancellations made within 24 hours of check-in are non-refundable. A no-show is non-refundable. Refunds are processed to the original payment method, usually within 5 to 7 working days.",
} as const;

export type MealPlan = "with_breakfast" | "without_breakfast" | "cp" | "ep";
export type Occupancy = "single" | "double" | 1 | 2;

export interface RoomOccupancyDetail {
  roomIndex: number;
  occupancy: "single" | "double";
  ratePerNight: number;
}

export interface PriceBreakdown {
  nights: number;
  ratePerNight: number;
  roomsRequested: number;
  subtotal: number;
  baseAmount: number;
  gstPercent: number;
  gstAmount: number;
  gst: number; // alias for backwards compatibility
  totalAmount: number;
  amountInPaise: number;
  roomTypeName: string;
  roomTypeCode: string;
  mealPlan: "with_breakfast" | "without_breakfast";
  occupancy: "single" | "double";
  roomOccupancies?: ("single" | "double")[];
  roomDetails?: RoomOccupancyDetail[];
}

/**
 * Calculates booking amounts strictly on the server based on:
 * - Room Category
 * - Meal Plan (With Breakfast / Without Breakfast)
 * - Occupancy (Single / Double) - supports uniform or per-room mixed occupancy
 * - Nights & Rooms
 * - GST Threshold Rule (<= 7500 -> 5%, > 7500 -> 18%)
 * Never trusts prices or subtotals sent by the client.
 */
export function calculateServerBookingPrice(
  roomTypeCode: string,
  checkInStr: string,
  checkOutStr: string,
  roomsRequested = 1,
  mealPlanInput: MealPlan = "without_breakfast",
  occupancyInput: Occupancy = "double",
  roomTypesOverride?: RoomTypeConfig[],
  roomOccupancies?: (Occupancy | string)[]
): PriceBreakdown {
  const roomTypes = roomTypesOverride || DEFAULT_ROOM_TYPES;
  const room =
    roomTypes.find(
      (r) =>
        r.code === roomTypeCode ||
        r.slug === roomTypeCode ||
        r.name.toLowerCase() === roomTypeCode.toLowerCase()
    ) || roomTypes[0];

  const d1 = new Date(checkInStr);
  const d2 = new Date(checkOutStr);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  const nights = Math.max(1, isNaN(diffDays) ? 1 : diffDays);

  const cleanRooms = Math.max(1, Math.min(roomsRequested, room.roomsTotal || room.totalRooms || 21));

  // Normalize meal plan
  const isBreakfast =
    mealPlanInput === "with_breakfast" || mealPlanInput === "cp";
  const normalizedMealPlan: "with_breakfast" | "without_breakfast" = isBreakfast
    ? "with_breakfast"
    : "without_breakfast";

  // Helper to get rate for a single room given its occupancy
  const getRoomRate = (occ: Occupancy | string): { rate: number; normalizedOcc: "single" | "double" } => {
    const isSingle = occ === "single" || occ === 1;
    const normalizedOcc: "single" | "double" = isSingle ? "single" : "double";

    let rate = room.pricePerNight;
    if (isBreakfast) {
      if (isSingle) {
        rate = room.rateCpSingle ?? room.pricePerNight;
      } else {
        rate = room.rateCpDouble ?? room.pricePerNight;
      }
    } else {
      if (isSingle) {
        rate = room.rateEpSingle ?? room.pricePerNight;
      } else {
        rate = room.rateEpDouble ?? room.pricePerNight;
      }
    }

    if (!rate || rate <= 0) {
      rate = room.pricePerNight || 2299;
    }

    return { rate, normalizedOcc };
  };

  // If per-room occupancy array is provided, calculate each room individually
  const hasPerRoomOccupancies = Array.isArray(roomOccupancies) && roomOccupancies.length > 0;
  const roomDetails: RoomOccupancyDetail[] = [];
  const normalizedOccupanciesList: ("single" | "double")[] = [];
  let sumRoomRates = 0;

  for (let i = 0; i < cleanRooms; i++) {
    const occForThisRoom = hasPerRoomOccupancies && roomOccupancies[i]
      ? roomOccupancies[i]
      : occupancyInput;
    const { rate, normalizedOcc } = getRoomRate(occForThisRoom);
    roomDetails.push({
      roomIndex: i + 1,
      occupancy: normalizedOcc,
      ratePerNight: rate,
    });
    normalizedOccupanciesList.push(normalizedOcc);
    sumRoomRates += rate;
  }

  const baseAmount = sumRoomRates * nights;
  const primaryOccupancy = normalizedOccupanciesList[0] || (occupancyInput === "single" || occupancyInput === 1 ? "single" : "double");
  const averageRatePerNight = Math.round(sumRoomRates / cleanRooms);

  // Apply GST threshold rule: base tariff per room per night <= 7500 -> 5%, > 7500 -> 18%
  const maxRoomRate = Math.max(...roomDetails.map((r) => r.ratePerNight));
  const gstPercent = maxRoomRate <= PAYMENT_CONFIG.GST_THRESHOLD ? 5 : 18;
  const gstAmount = Math.round(baseAmount * (gstPercent / 100));
  const totalAmount = baseAmount + gstAmount;
  const amountInPaise = Math.round(totalAmount * 100);

  return {
    nights,
    ratePerNight: averageRatePerNight,
    roomsRequested: cleanRooms,
    subtotal: baseAmount,
    baseAmount,
    gstPercent,
    gstAmount,
    gst: gstAmount,
    totalAmount,
    amountInPaise,
    roomTypeName: room.name,
    roomTypeCode: room.code,
    mealPlan: normalizedMealPlan,
    occupancy: primaryOccupancy,
    roomOccupancies: normalizedOccupanciesList,
    roomDetails,
  };
}
