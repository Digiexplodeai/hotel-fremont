/**
 * HOTEL FREMONT - CENTRAL ROOMS DATA SOURCE
 * 
 * Single source of truth for all room categories, inventory, and capacity.
 * Exactly 21 rooms in total across 3 distinct categories.
 */

export interface RoomRatePlans {
  cpDouble: number; // With Breakfast, Double Occupancy
  cpSingle: number; // With Breakfast, Single Occupancy
  epDouble: number; // Without Breakfast, Double Occupancy
  epSingle: number; // Without Breakfast, Single Occupancy
}

export interface RoomCategory {
  slug: string;
  id: string; // compatibility with existing code
  code: string;
  name: string;
  title: string; // compatibility with existing components
  totalRooms: number;
  roomsTotal: number;
  inventoryLabel: string;
  roomNumbers: string[];
  price: number;
  priceLabel: string;
  startingPriceLabel: string;
  size: string;
  sizeSqft: number;
  maxGuests: number;
  bed: string;
  bedType: string;
  occupancy: string;
  badge: string;
  tag: string;
  view: string;
  description: string;
  shortDescription: string;
  longDescription: string;
  highlights: string[];
  amenities: string[];
  image: string;
  imageSlot: string;
  gallery: string[];
  ratePlans: RoomRatePlans;
}

export const TOTAL_ROOMS = 21;

const COMMON_AMENITIES = [
  "Air Conditioning",
  "Smart TV",
  "Tea & Coffee Kettle",
  "Complimentary Wi-Fi",
  "Washroom Amenities",
  "Central Hot Water",
  "Housekeeping Service",
  "Premium Linen & Duvets",
];

export const roomCategories: RoomCategory[] = [
  {
    slug: "deluxe-room",
    id: "deluxe-room",
    code: "deluxe-room",
    name: "Deluxe Room",
    title: "Deluxe Room",
    totalRooms: 9,
    roomsTotal: 9,
    inventoryLabel: "9 Rooms",
    roomNumbers: ["101", "102", "103", "104", "105", "106", "107", "108", "109"],
    price: 2299,
    priceLabel: "₹2,299",
    startingPriceLabel: "From Rs 2,299 + taxes",
    size: "approx. 160 sq ft",
    sizeSqft: 160,
    maxGuests: 2,
    bed: "Plush King-size bed",
    bedType: "Plush King-size bed",
    occupancy: "Up to 2 Guests",
    badge: "",
    tag: "",
    view: "City View",
    shortDescription: "A practical, comfortable stay with essential modern conveniences.",
    longDescription:
      "A practical, comfortable stay with essential modern conveniences. Features a plush king-size bed, air conditioning, Smart TV, tea and coffee maker, and complimentary Wi-Fi.",
    description:
      "A practical, comfortable stay with essential modern conveniences. Features a plush king-size bed, air conditioning, Smart TV, tea and coffee maker, and complimentary Wi-Fi.",
    highlights: [
      "Plush King-size Bed",
      "Air Conditioning",
      "Smart TV & Wi-Fi",
      "Tea & Coffee Kettle",
      "Central Hot Water",
    ],
    amenities: COMMON_AMENITIES,
    image: "",
    imageSlot: "deluxe-room",
    gallery: [],
    ratePlans: {
      cpDouble: 2799,
      cpSingle: 2499,
      epDouble: 2499,
      epSingle: 2299,
    },
  },
  {
    slug: "super-deluxe-room",
    id: "super-deluxe-room",
    code: "super-deluxe-room",
    name: "Super Deluxe Room",
    title: "Super Deluxe Room",
    totalRooms: 10,
    roomsTotal: 10,
    inventoryLabel: "10 Rooms",
    roomNumbers: ["201", "202", "203", "204", "205", "206", "207", "208", "209", "210"],
    price: 3299,
    priceLabel: "₹3,299",
    startingPriceLabel: "From Rs 3,299 + taxes",
    size: "approx. 250 sq ft",
    sizeSqft: 250,
    maxGuests: 2,
    bed: "Plush King-size bed",
    bedType: "Plush King-size bed",
    occupancy: "Up to 2 Guests",
    badge: "Best choice for corporate stays",
    tag: "Best choice for corporate stays",
    view: "Airport Road & City View",
    shortDescription: "More room to unwind, with a calm palette and inviting interiors.",
    longDescription:
      "More room to unwind, with a calm palette and inviting interiors. The Super Deluxe Room pairs a plush king-size bed with warm wood finishes, soft lighting and a calm, contemporary look.",
    description:
      "More room to unwind, with a calm palette and inviting interiors. The Super Deluxe Room pairs a plush king-size bed with warm wood finishes, soft lighting and a calm, contemporary look.",
    highlights: [
      "Best choice for corporate stays",
      "Plush King-size Bed",
      "Work-friendly seating",
      "Smart TV & Wi-Fi",
      "Tea & Coffee Kettle",
    ],
    amenities: COMMON_AMENITIES,
    image: "",
    imageSlot: "super-deluxe",
    gallery: [],
    ratePlans: {
      cpDouble: 3799,
      cpSingle: 3499,
      epDouble: 3499,
      epSingle: 3299,
    },
  },
  {
    slug: "premium-room",
    id: "premium-room",
    code: "premium-room",
    name: "Premium Room",
    title: "Premium Room",
    totalRooms: 2,
    roomsTotal: 2,
    inventoryLabel: "2 Rooms",
    roomNumbers: ["301", "302"],
    price: 4299,
    priceLabel: "₹4,299",
    startingPriceLabel: "From Rs 4,299 + taxes",
    size: "approx. 365 sq ft",
    sizeSqft: 365,
    maxGuests: 2,
    bed: "Plush King-size bed",
    bedType: "Plush King-size bed",
    occupancy: "Up to 2 Guests",
    badge: "",
    tag: "",
    view: "Expansive Horizon View",
    shortDescription: "A more spacious stay with distinctive styling and a refined feel.",
    longDescription:
      "A more spacious stay with distinctive styling and a refined feel. The Premium Room features elegant burgundy interiors, a plush king-size bed and contemporary furnishings. Its generous layout offers a welcoming place to relax, work or recharge.",
    description:
      "A more spacious stay with distinctive styling and a refined feel. The Premium Room features elegant burgundy interiors, a plush king-size bed and contemporary furnishings. Its generous layout offers a welcoming place to relax, work or recharge.",
    highlights: [
      "Generous 365 sq ft Layout",
      "Elegant Burgundy Interiors",
      "Plush King-size Bed",
      "Smart TV & Wi-Fi",
      "Tea & Coffee Kettle",
    ],
    amenities: COMMON_AMENITIES,
    image: "",
    imageSlot: "premium",
    gallery: [],
    ratePlans: {
      cpDouble: 4799,
      cpSingle: 4499,
      epDouble: 4499,
      epSingle: 4299,
    },
  },
];
