/**
 * HOTEL FREMONT - CENTRAL CONTACT & COMMUNICATION CONFIGURATION
 * 
 * Single source of truth for all phone numbers, WhatsApp links, and direct inquiry channels.
 */

const DEFAULT_WHATSAPP_MESSAGE = "Hello Hotel Fremont, I would like to inquire about a reservation.";

export const CONTACT = {
  phoneDisplay: "+91 98727 68514",
  phoneTel: "tel:+919872768514",
  phoneRaw: "+919872768514",
  whatsappNumber: "919872768514",
  whatsappDisplay: "+91 98727 68514",
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
  whatsappLink: `https://wa.me/919872768514?text=${encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE)}`,
};

