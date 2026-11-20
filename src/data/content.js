/**
 * HOTEL FREMONT - MASTER CONTENT & CONFIGURATION
 * 
 * Real client profile data (honest 3-star hotel).
 * Single source of truth for fallback website text and structure.
 */

import { roomCategories, TOTAL_ROOMS } from "./rooms";
import { CONTACT } from "./contact";

export const siteConfig = {
  brand: {
    name: "Hotel Fremont",
    tagline: "Thoughtful comfort. Warm hospitality.",
    subline: "A convenient address on Airport Road.",
    heroLine: "A comfortable stay in Mohali.",
    badge: "3-Star Hotel",
    shortDescription:
      "Hotel Fremont is a contemporary hotel on Sector 80, Airport Road, Mohali. The property brings together thoughtfully appointed guest rooms, an in-house restaurant, a dedicated banquet venue and a conference room, making it a convenient choice for business and leisure stays as well as social gatherings.",
    accentColor: "#E02B1D",
    goldColor: "#C9A96E",
    darkColor: "#0E0E10",
    ivoryColor: "#F7F3EC",
    logoPath: "/assets/logo.png",
    iconPath: "/assets/f-icon.png",
  },

  contact: {
    address:
      "Hotel Fremont, Khasra No 186, Sector 80, Village Mauli Baidwan, Airport Road, Mohali (SAS Nagar), Punjab - 140308",
    city: "Mohali (SAS Nagar)",
    state: "Punjab",
    postalCode: "140308",
    country: "India",
    phone: CONTACT.phoneDisplay,
    phoneDisplay: CONTACT.phoneDisplay,
    phoneTel: CONTACT.phoneTel,
    phoneRaw: CONTACT.phoneRaw,
    whatsapp: CONTACT.whatsappDisplay,
    whatsappNumber: CONTACT.whatsappNumber,
    whatsappLink: CONTACT.whatsappLink,
    email: "hotelfremont1@gmail.com",
    bookingEmail: "hotelfremont1@gmail.com",
    eventsEmail: "hotelfremont1@gmail.com",
    receptionEmail: "hotelfremont1@gmail.com",
    directionsUrl:
      "https://maps.google.com/?q=Hotel+Fremont+Airport+Road+Sector+80+SAS+Nagar+Mohali+Punjab",
  },

  navLinks: [
    { label: "Rooms & Stays", href: "/#rooms" },
    { label: "Dining", href: "/#dining" },
    { label: "Facilities", href: "/#amenities" },
    { label: "Events", href: "/#events" },
    { label: "Gallery", href: "/#gallery" },
    { label: "Location", href: "/#location" },
    { label: "Contact", href: "/#contact" },
  ],

  hero: {
    eyebrow: "3-STAR HOTEL · AIRPORT ROAD, MOHALI",
    badge: "3-Star Hotel",
    headlinePart1: "A comfortable stay",
    headlinePart2: "in Mohali.",
    tagline: "Thoughtful comfort. Warm hospitality.",
    subline: "A convenient address on Airport Road.",
    description:
      "Hotel Fremont brings together thoughtfully appointed guest rooms, an in-house restaurant, a dedicated banquet venue and a conference room on Airport Road, Sector 80, Mohali.",
    ctaPrimary: "Book Your Stay",
    ctaSecondary: "View Rooms",
    startingRateText: "From Rs 2,299 + taxes",
  },

  stats: [
    { value: 21, suffix: " Rooms", label: "Guest Rooms", sub: "Deluxe, Super Deluxe & Premium" },
    { value: 3, suffix: " Categories", label: "Room Categories", sub: "Designed for Comfort" },
    { value: "50", suffix: " Covers", label: "In-House Restaurant", sub: "Ground Floor Dining" },
    { value: "150", suffix: " Guests", label: "Cloud Six Banquet", sub: "Celebrations & Meetings" },
  ],

  about: {
    eyebrow: "ABOUT HOTEL FREMONT",
    title: "A Contemporary Hotel on Airport Road, Mohali",
    paragraph1:
      "Hotel Fremont is a contemporary hotel on Sector 80, Airport Road, Mohali. The property brings together thoughtfully appointed guest rooms, an in-house restaurant, a dedicated banquet venue and a conference room, making it a convenient choice for business and leisure stays as well as social gatherings.",
    paragraph2:
      "Guests enjoy 24-hour reception assistance, high-speed Wi-Fi, secure on-site parking, and an in-house kitchen open daily until 10:30 PM. With three room categories accommodating singles and couples, Hotel Fremont provides practical comfort along Mohali's premier arterial road.",
    features: [
      {
        title: "Three Room Categories",
        desc: "21 guest rooms across Deluxe, Super Deluxe, and Premium categories, featuring plush king-size beds and air-conditioning.",
      },
      {
        title: "Dining & Celebrations",
        desc: "Hotel Fremont Restaurant on the ground floor (50 covers), Cloud Six Banquet (150 guests), and conference hall (40-50 guests).",
      },
      {
        title: "Convenient Location",
        desc: "Situated on Airport Road, Sector 80, with straightforward access to Sohana, IT hubs, shopping malls, and Chandigarh Airport.",
      },
      {
        title: "Essential Modern Comforts",
        desc: "24-hour front desk, complimentary Wi-Fi, Smart TV, in-room tea and coffee maker, central hot water, and on-site parking.",
      },
    ],
  },

  rooms: roomCategories,

  amenities: [
    {
      icon: "Clock",
      title: "24-Hour Reception",
      desc: "Front desk assistance available 24 hours a day, 7 days a week.",
    },
    {
      icon: "Wifi",
      title: "Complimentary Wi-Fi",
      desc: "High-speed wireless internet access across all rooms and common areas.",
    },
    {
      icon: "Car",
      title: "On-Site Parking",
      desc: "Convenient and secure parking space for staying guests and visitors.",
    },
    {
      icon: "Wind",
      title: "Air Conditioning",
      desc: "Fully air-conditioned guest rooms with individual climate control.",
    },
    {
      icon: "Tv",
      title: "Smart TV",
      desc: "In-room entertainment with high-definition smart television.",
    },
    {
      icon: "Coffee",
      title: "Tea & Coffee Kettle",
      desc: "In-room electric kettle with daily supplies of tea and coffee.",
    },
    {
      icon: "Flame",
      title: "Central Hot Water",
      desc: "Continuous central hot-water system for comfort around the clock.",
    },
    {
      icon: "Sparkles",
      title: "Housekeeping Service",
      desc: "Daily professional housekeeping maintaining cleanliness and hygiene.",
    },
    {
      icon: "BedDouble",
      title: "Premium Linen & Duvets",
      desc: "Specially made duvets, plush king-size bed linen, and quality washroom amenities.",
    },
  ],

  dining: {
    eyebrow: "IN-HOUSE DINING",
    name: "Hotel Fremont Restaurant",
    tagline: "Thoughtfully prepared meals on the ground floor",
    location: "Ground Floor",
    covers: "50 Covers",
    timing: "Daily until 10:30 PM",
    description:
      "Hotel Fremont Restaurant is located on the ground floor with seating for approximately 50 covers. Guests enjoy a morning breakfast buffet and fresh à la carte dining from our in-house kitchen open daily until 10:30 PM. Breakfast is complimentary with breakfast-inclusive room rates.",
    features: [
      "Ground Floor Location",
      "50 Covers Seating",
      "Breakfast Buffet",
      "In-House Kitchen Daily until 10:30 PM",
    ],
  },

  events: {
    eyebrow: "BANQUET & MEETINGS",
    title: "Celebrations & Conference Venues",
    subtitle:
      "Dedicated venues for private celebrations, corporate meetings, and social gatherings in Mohali.",
    venues: [
      {
        name: "Cloud Six Banquet",
        type: "Banquet Venue",
        capacity: "Up to 150 guests",
        imageSlot: "cloud-six-banquet",
        desc: "An elegant venue for celebrations and special occasions, accommodating up to 150 guests.",
      },
      {
        name: "Conference Hall",
        type: "Conference Hall",
        capacity: "40 to 50 guests",
        imageSlot: "conference-hall",
        desc: "A dedicated setting for meetings, seminars, and business discussions with contemporary layout options.",
      },
    ],
  },

  location: {
    eyebrow: "ACCESSIBILITY & NEIGHBOURHOOD",
    title: "Airport Road, Sector 80, Mohali",
    address:
      "Hotel Fremont, Khasra No 186, Sector 80, Village Mauli Baidwan, Airport Road, Mohali (SAS Nagar), Punjab - 140308",
    note: "Travel times vary with route and traffic.",
    nearbyPlaces: [
      "Gurdwara Singh Shaheedan, Sohana",
      "CP67 Mall and other shopping destinations",
      "Chandigarh International Airport",
      "Mohali IT, commercial and industrial hubs",
      "Local car-wash facility in the surrounding area",
    ],
    convenientFor: [
      "Business travellers",
      "Guests attending meetings and events",
      "Visitors exploring Sohana and the Tricity",
      "Families",
    ],
  },

  finalCta: {
    eyebrow: "RESERVE YOUR STAY",
    title: "Thoughtful Comfort. Warm Hospitality.",
    subtitle: "Experience convenient comfort on Airport Road, Mohali.",
    description:
      "Experience convenient comfort on Airport Road, Mohali. Book direct for verified best rates.",
    ctaPrimary: "Book Your Room",
    ctaSecondary: "Contact Front Desk",
  },

  footer: {
    about:
      "A contemporary 3-star hotel on Sector 80, Airport Road, Mohali. Thoughtfully appointed rooms, in-house restaurant, banquet and conference facilities.",
    brandDescription:
      "A contemporary 3-star hotel on Sector 80, Airport Road, Mohali. Thoughtfully appointed rooms, in-house restaurant, banquet and conference facilities.",
    quickLinks: [
      { label: "Rooms & Stays", href: "/#rooms" },
      { label: "Dining", href: "/#dining" },
      { label: "Facilities", href: "/#amenities" },
      { label: "Events", href: "/#events" },
      { label: "Gallery", href: "/#gallery" },
      { label: "Location", href: "/#location" },
      { label: "Contact Us", href: "/contact-us" },
    ],
    legalLinks: [
      { label: "Cancellation & Refund", href: "/cancellation-refund-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
    ],
    copyright: "© 2026 Hotel Fremont. All rights reserved.",
    links: [
      { label: "Rooms & Stays", href: "/#rooms" },
      { label: "Dining", href: "/#dining" },
      { label: "Facilities", href: "/#amenities" },
      { label: "Events", href: "/#events" },
      { label: "Gallery", href: "/#gallery" },
      { label: "Location", href: "/#location" },
      { label: "Contact Us", href: "/contact-us" },
      { label: "Cancellation & Refund", href: "/cancellation-refund-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
    ],
    socials: [], // Empty by default; only show if set in admin
  },
};
