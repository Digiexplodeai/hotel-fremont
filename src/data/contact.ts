/**
 * HOTEL FREMONT - CENTRAL CONTACT & COMMUNICATION CONFIGURATION
 * 
 * Single source of truth for all phone numbers, WhatsApp links, and direct inquiry channels.
 */

const DEFAULT_WHATSAPP_MESSAGE = "Hello Hotel Fremont, I would like to inquire about a booking.";

export const CONTACT = {
  phoneDisplay: "+91 79734 50281",
  phoneTel: "tel:+917973450281",
  phoneRaw: "+917973450281",
  cleanPhone: "917973450281",
  whatsappNumber: "917973450281",
  whatsappDisplay: "+91 79734 50281",
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
  whatsappLink: `https://wa.me/917973450281?text=${encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE)}`,
  email: "hotelfremont1@gmail.com",
};
