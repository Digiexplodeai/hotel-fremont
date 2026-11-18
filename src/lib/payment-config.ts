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
  GST_RATE: 0.18, // 18% Luxury Hotel GST in India
  BRAND_NAME: "Hotel Fremont",
  THEME_COLOR: "#E02B1D", // Hotel Fremont crimson brand accent
  DEFAULT_HOTEL_EMAIL: "hotelfremont1@gmail.com",
  CANCELLATION_SUMMARY:
    "Free cancellation up to 48 hours before check-in. Cancellations within 48 hours retain one night's tariff and the rest is refunded. A no-show retains the first night's tariff. Refunds go to the original payment method within 5 to 7 working days.",
} as const;

export interface PriceBreakdown {
  nights: number;
  ratePerNight: number;
  roomsRequested: number;
  subtotal: number;
  gst: number;
  totalAmount: number;
  amountInPaise: number;
  roomTypeName: string;
}

/**
 * Calculates booking amounts strictly on the server.
 * Never trusts prices or subtotals sent by the client.
 */
export function calculateServerBookingPrice(
  roomTypeCode: string,
  checkInStr: string,
  checkOutStr: string,
  roomsRequested = 1,
  roomTypesOverride?: RoomTypeConfig[]
): PriceBreakdown {
  const roomTypes = roomTypesOverride || DEFAULT_ROOM_TYPES;
  const room =
    roomTypes.find(
      (r) =>
        r.code === roomTypeCode ||
        r.name.toLowerCase() === roomTypeCode.toLowerCase()
    ) || roomTypes[0];

  const d1 = new Date(checkInStr);
  const d2 = new Date(checkOutStr);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  const nights = Math.max(1, isNaN(diffDays) ? 1 : diffDays);

  const cleanRooms = Math.max(1, Math.min(roomsRequested, room.totalRooms || 12));
  const ratePerNight = room.pricePerNight;
  const subtotal = nights * ratePerNight * cleanRooms;
  const gst = Math.round(subtotal * PAYMENT_CONFIG.GST_RATE);
  const totalAmount = subtotal + gst;
  const amountInPaise = Math.round(totalAmount * 100);

  return {
    nights,
    ratePerNight,
    roomsRequested: cleanRooms,
    subtotal,
    gst,
    totalAmount,
    amountInPaise,
    roomTypeName: room.name,
  };
}
