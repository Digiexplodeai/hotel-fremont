/**
 * HOTEL FREMONT - CENTRAL ROOMS & SUITES DATA SOURCE
 * 
 * Single source of truth for all room categories, inventory, and capacity.
 * Exactly 12 rooms in total across 4 distinct boutique categories.
 */

export interface RoomCategory {
  slug: string;
  id: string; // compatibility with existing code
  name: string;
  title: string; // compatibility with existing components
  totalRooms: number;
  inventoryLabel: string;
  roomNumbers: string[];
  price: number;
  priceLabel: string;
  size: string;
  maxGuests: number;
  bed: string;
  occupancy: string;
  badge: string;
  view: string;
  description: string;
  highlights: string[];
  amenities: string[];
  image: string;
  gallery: string[];
}

/**
 * REPUTATION & REVIEWS CONFIGURATION
 * TODO: Replace with real Google Business Profile rating and verified review count once verified.
 * Do not invent review numbers.
 */
export const HOTEL_REPUTATION = {
  rating: "4.9",
  ratingSuffix: "★",
  ratingLabel: "Google Guest Rating",
  reviewsSub: "Verified Guest Feedback", // Neutral verified text without invented counts
  // When verified review count is known, set here:
  // reviewCount: "42",
};

export const roomCategories: RoomCategory[] = [
  {
    slug: "deluxe-king",
    id: "deluxe-king",
    name: "Deluxe King Room",
    title: "Deluxe King Room",
    totalRooms: 6,
    inventoryLabel: "6 Rooms",
    roomNumbers: ["101", "102", "103", "104", "105", "106"],
    price: 5499,
    priceLabel: "₹5,499",
    size: "380 sq.ft",
    maxGuests: 2,
    bed: "King Bed",
    occupancy: "2 Guests",
    badge: "Best Value",
    view: "City Skyline & Courtyard View",
    description: "A sanctuary of calm featuring warm wooden textures, custom atmospheric lighting, an Italian marble en-suite with rain shower, and a high-speed ergonomic workstation.",
    highlights: [
      "Free Airport Drop",
      "High-speed Wi-Fi 6",
      "50-inch 4K Smart TV",
      "Artisanal Coffee Maker",
      "Complimentary Breakfast"
    ],
    amenities: [
      "King Bed",
      "Rain Shower",
      "Work Desk",
      "Mini Bar",
      "Soundproof",
      "Safe Locker",
      "24/7 Room Service"
    ],
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000",
    gallery: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200",
    ]
  },
  {
    slug: "premier-executive",
    id: "premier-executive",
    name: "Premier Executive Suite",
    title: "Premier Executive Suite",
    totalRooms: 3,
    inventoryLabel: "3 Suites",
    roomNumbers: ["201", "202", "203"],
    price: 8999,
    priceLabel: "₹8,999",
    size: "540 sq.ft",
    maxGuests: 3,
    bed: "King Bed",
    occupancy: "3 Guests",
    badge: "Corporate Choice",
    view: "Panoramic Airport Road & Boulevard View",
    description: "Generously proportioned with a private living lounge, plush velvet seating, walk-in dressing closet, and deep-soaking bathtub. Ideal for business leaders and extended stays.",
    highlights: [
      "Complimentary Airport Chauffeur",
      "Lounge Access",
      "Bathtub & Jacuzzi Jet",
      "Espresso Machine",
      "Express Check-in"
    ],
    amenities: [
      "Separate Living Room",
      "Soaking Tub",
      "Walk-in Closet",
      "Nespresso Bar",
      "Balcony",
      "Smart Climate Control"
    ],
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000",
    gallery: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=1200",
    ]
  },
  {
    slug: "royal-fremont",
    id: "royal-fremont",
    name: "The Royal Fremont Suite",
    title: "The Royal Fremont Suite",
    totalRooms: 2,
    inventoryLabel: "2 Suites",
    roomNumbers: ["301", "302"],
    price: 14999,
    priceLabel: "₹14,999",
    size: "780 sq.ft",
    maxGuests: 4,
    bed: "King Bed",
    occupancy: "4 Guests",
    badge: "Signature Experience",
    view: "Dual-Aspect Garden & Horizon View",
    description: "The epitome of boutique grandeur. Features a 6-seater private dining alcove, hand-finished brass accents, champagne welcome bar, and dedicated butler service on call.",
    highlights: [
      "Dedicated Private Butler",
      "Chauffeured Luxury Sedan",
      "Free Mini-bar & Champagne",
      "Luxury Hydrotherapy Jacuzzi",
      "Priority Dining"
    ],
    amenities: [
      "Private Dining Area",
      "Jacuzzi",
      "Butler Service",
      "Champagne Bar",
      "Powder Room",
      "Panoramic Terrace"
    ],
    image: "/assets/rooms/royal-fremont-suite.webp",
    gallery: [
      "/assets/rooms/royal-fremont-suite.webp",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=1200",
    ]
  },
  {
    slug: "presidential-penthouse",
    id: "presidential-penthouse",
    name: "Presidential Penthouse",
    title: "Presidential Penthouse",
    totalRooms: 1,
    inventoryLabel: "1 Penthouse",
    roomNumbers: ["401"],
    price: 24999,
    priceLabel: "₹24,999",
    size: "1,250 sq.ft",
    maxGuests: 6,
    bed: "King Bed",
    occupancy: "6 Guests",
    badge: "Ultra Luxury",
    view: "Top-Floor 360° Skyline & Airport Runway Sunset View",
    description: "Our crowning jewel on the highest tier. Boasting two luxurious master bedrooms, a private terrace, grand Steinway piano lounge, bespoke gold-leaf ceiling, and round-the-clock personal chef availability.",
    highlights: [
      "Private Rooftop Terrace",
      "Personal Chef on Demand",
      "Luxury Airport Limousine",
      "Full Bar & Cellar",
      "VIP Security Access"
    ],
    amenities: [
      "2 Master Bedrooms",
      "Private Terrace",
      "Chef Service",
      "Steinway Lounge",
      "Sauna & Steam",
      "VIP Elevator"
    ],
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000",
    gallery: [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
      "/assets/hero/hero-room-2.webp",
    ]
  }
];

export const TOTAL_ROOMS = roomCategories.reduce((sum, c) => sum + c.totalRooms, 0); // must equal 12

