/**
 * HOTEL FREMONT - MASTER CONTENT & CONFIGURATION
 * 
 * All website text, prices, contact details, and images are managed here.
 * You can edit this file to update any information across the entire website instantly.
 */

export const siteConfig = {
  brand: {
    name: "Hotel Fremont",
    legalName: "Hotel Fremont Hospitality Pvt Ltd",
    logoWordmark: "HOTEL FREMONT",
    tagline: "Stay Beyond Ordinary.",
    shortDescription: "A 5-star boutique luxury hotel on Airport Road, Sector 80, Mohali, offering refined suites, gourmet dining, and magnificent celebration venues.",
    accentColor: "#E02B1D",
    goldColor: "#C9A96E",
    darkColor: "#0E0E10",
    ivoryColor: "#F7F3EC",
    logoPath: "/assets/logo.png",
    iconPath: "/assets/f-icon.png",
  },

  contact: {
    address: "Hotel Fremont, Airport Road, Sector 80, SAS Nagar, Mohali, Punjab",
    city: "Mohali",
    state: "Punjab",
    postalCode: "140308",
    country: "India",
    airportDistance: "10 Minutes from Chandigarh International Airport (IXC)",
    phone: "+91 98765 43210",
    phoneDisplay: "+91 98765 43210",
    phoneTel: "tel:+919876543210",
    whatsapp: "+91 98765 43210",
    whatsappNumber: "919876543210",
    whatsappLink: "https://wa.me/919876543210?text=Hello%20Hotel%20Fremont%2C%20I%20would%20like%20to%20inquire%20about%20a%20reservation.",
    email: "stay@hotelfremont.com",
    bookingEmail: "reservations@hotelfremont.com",
    eventsEmail: "banquets@hotelfremont.com",
    receptionEmail: "frontdesk@hotelfremont.com",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13725.291307738392!2d76.711448!3d30.686523!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390feb02fa5d6545%3A0x6b9d6a2f4cfbe6e8!2sSector%2080%2C%20Sahibzada%20Ajit%20Singh%20Nagar%2C%20Punjab!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
    directionsUrl: "https://maps.google.com/?q=Hotel+Fremont+Airport+Road+Sector+80+SAS+Nagar+Mohali+Punjab",
  },

  navLinks: [
    { label: "Suites", href: "#rooms" },
    { label: "Dining", href: "#dining" },
    { label: "Amenities", href: "#amenities" },
    { label: "Events", href: "#events" },
    { label: "Gallery", href: "#gallery" },
    { label: "Location", href: "#location" },
    { label: "Contact", href: "#contact" },
  ],

  hero: {
    eyebrow: "MOHALI'S FINEST BOUTIQUE LUXURY",
    headlinePart1: "Stay Beyond",
    headlinePart2: "Ordinary.",
    description: "Welcome to Hotel Fremont on Airport Road, Mohali. A seamless fusion of bespoke architecture, personalized 5-star service, and peaceful indulgence minutes from Chandigarh International Airport.",
    ctaPrimary: "Book Your Stay",
    ctaSecondary: "Explore Suites",
    // Replace with local video or high-res photography
    bgImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2000",
    videoUrl: null, // Optional mp4 video stream url if available
  },

  stats: [
    { value: 48, suffix: "+", label: "Luxury Suites", sub: "Designed for Tranquility" },
    { value: 120, suffix: "k+", label: "Happy Guests", sub: "From Around the World" },
    { value: 10, suffix: " Mins", label: "Airport Proximity", sub: "Shaheed Bhagat Singh IXC" },
    { value: 4.9, suffix: "★", label: "Google Guest Rating", sub: "Over 1,800+ Verified Reviews" },
  ],

  about: {
    eyebrow: "OUR HERITAGE & SPIRIT",
    title: "An Oasis of Modern Royalty on Airport Road",
    paragraph1: "Rising gracefully along Mohali’s thriving Airport Road, Hotel Fremont redefines boutique luxury in Punjab. Conceived for the cosmopolitan traveler, business visionary, and destination wedding parties, every detail—from our Italian marble corridors to custom silk furnishings—radiates calm authority.",
    paragraph2: "Whether you are landing from an international red-eye flight, hosting a royal celebration in our Grand Fremont Ballroom, or savoring artisanal Punjabi flavours at Aura, our dedicated 24-hour concierge and butler service ensures your stay is nothing short of exceptional.",
    features: [
      { title: "Direct Airport Arterial", desc: "Effortless 10-minute commute to Chandigarh International Airport (IXC) via smooth six-lane expressway." },
      { title: "Bespoke Hospitality", desc: "Private butler assistance, personalized pillow menus, and custom in-room dining around the clock." },
      { title: "Grand Celebration Hub", desc: "Pillarless banquet halls and manicured lawns catering to up to 600 wedding and corporate guests." },
      { title: "Architectural Peace", desc: "Acoustic triple-glazed sound insulation ensuring complete sanctuary from the bustling city." }
    ],
    // High-resolution photography for about section
    imagePrimary: "/assets/hero/hero-room-1.webp",
    imageSecondary: "/assets/hero/hero-room-2.webp",
    imageInterior: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=900",
  },

  rooms: [
    {
      id: "deluxe-king",
      title: "Deluxe King Room",
      badge: "Best Value",
      price: 5499,
      priceLabel: "₹5,499",
      size: "380 sq.ft",
      occupancy: "2 Adults + 1 Child",
      bed: "Super King Bed with 400TC Egyptian Cotton",
      view: "City Skyline & Courtyard View",
      description: "A sanctuary of calm featuring warm wooden textures, custom atmospheric lighting, an Italian marble en-suite with rain shower, and a high-speed ergonomic workstation.",
      highlights: ["Free Airport Drop", "High-speed Wi-Fi 6", "50-inch 4K Smart TV", "Artisanal Coffee Maker", "Complimentary Breakfast"],
      amenities: ["King Bed", "Rain Shower", "Work Desk", "Mini Bar", "Soundproof", "Safe Locker", "24/7 Room Service"],
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000",
      gallery: [
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200",
      ]
    },
    {
      id: "executive-suite",
      title: "Premier Executive Suite",
      badge: "Corporate Choice",
      price: 8999,
      priceLabel: "₹8,999",
      size: "540 sq.ft",
      occupancy: "3 Adults or 2 Adults + 2 Children",
      bed: "Plush California King Bed",
      view: "Panoramic Airport Road & Boulevard View",
      description: "Generously proportioned with a private living lounge, plush velvet seating, walk-in dressing closet, and deep-soaking bathtub. Ideal for business leaders and extended stays.",
      highlights: ["Complimentary Airport Chauffeur", "Lounge Access", "Bathtub & Jacuzzi Jet", "Espresso Machine", "Express Check-in"],
      amenities: ["Separate Living Room", "Soaking Tub", "Walk-in Closet", "Nespresso Bar", "Balcony", "Smart Climate Control"],
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000",
      gallery: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=1200",
      ]
    },
    {
      id: "royal-fremont-suite",
      title: "The Royal Fremont Suite",
      badge: "Signature Experience",
      price: 14999,
      priceLabel: "₹14,999",
      size: "780 sq.ft",
      occupancy: "4 Guests",
      bed: "Royal Grand King + Daybed",
      view: "Dual-Aspect Garden & Horizon View",
      description: "The epitome of boutique grandeur. Features a 6-seater private dining alcove, hand-finished brass accents, champagne welcome bar, and dedicated butler service on call.",
      highlights: ["Dedicated Private Butler", "Chauffeured Luxury Sedan", "Free Mini-bar & Champagne", "Luxury Hydrotherapy Jacuzzi", "Priority Dining"],
      amenities: ["Private Dining Area", "Jacuzzi", "Butler Service", "Champagne Bar", "Powder Room", "Panoramic Terrace"],
      image: "/assets/rooms/royal-fremont-suite.webp",
      gallery: [
        "/assets/rooms/royal-fremont-suite.webp",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=1200",
      ]
    },
    {
      id: "presidential-penthouse",
      title: "Presidential Penthouse",
      badge: "Ultra Luxury",
      price: 24999,
      priceLabel: "₹24,999",
      size: "1,250 sq.ft",
      occupancy: "Up to 5 Guests",
      bed: "Master King Suite + Guest Bedroom",
      view: "Top-Floor 360° Skyline & Airport Runway Sunset View",
      description: "Our crowning jewel on the highest tier. Boasting two luxurious master bedrooms, a private terrace, grand Steinway piano lounge, bespoke gold-leaf ceiling, and round-the-clock personal chef availability.",
      highlights: ["Private Rooftop Terrace", "Personal Chef on Demand", "Luxury Airport Limousine", "Full Bar & Cellar", "VIP Security Access"],
      amenities: ["2 Master Bedrooms", "Private Terrace", "Chef Service", "Steinway Lounge", "Sauna & Steam", "VIP Elevator"],
      image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000",
      gallery: [
        "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
        "/assets/hero/hero-room-2.webp",
      ]
    }
  ],

  amenities: [
    {
      icon: "Wifi",
      title: "High-Speed Wi-Fi 6",
      desc: "Ultra-fast encrypted connectivity property-wide for uninterrupted video conferences and streaming."
    },
    {
      icon: "Plane",
      title: "Airport Chauffeur",
      desc: "Chauffeured luxury transfers directly to and from Chandigarh International Airport (IXC) in 10 mins."
    },
    {
      icon: "UtensilsCrossed",
      title: "Aura Gourmet Dining",
      desc: "Celebrated multi-cuisine dining, authentic Amritsari specialties, and signature wood-fired delicacies."
    },
    {
      icon: "Crown",
      title: "Grand Banquet Hall",
      desc: "Opulent pillarless event venues accommodating up to 600 guests for weddings, galas, and corporate summits."
    },
    {
      icon: "Car",
      title: "Valet & EV Charging",
      desc: "Secure basement parking with 24-hour valet service and high-speed DC fast-chargers for all electric vehicles."
    },
    {
      icon: "Clock",
      title: "24/7 In-Room Dining",
      desc: "Around-the-clock chef-crafted dining brought to your room with white-glove presentation."
    },
    {
      icon: "Dumbbell",
      title: "Fitness & Wellness",
      desc: "Technogym cardiovascular equipment, free weights, yoga deck, and private wellness trainers on request."
    },
    {
      icon: "ShieldCheck",
      title: "24/7 Concierge & Security",
      desc: "Discreet multi-tier security, smart card access, baggage handling, and tailored Mohali/Chandigarh tours."
    }
  ],

  dining: {
    name: "AURA RESTAURANT & LOUNGE",
    eyebrow: "CULINARY EXCELLENCE",
    tagline: "An Epicurean Journey of Modern Heritage",
    description: "Immerse yourself in a warm, amber-lit sanctuary where our master chefs transform seasonal ingredients into sublime works of art. Featuring Punjab's rich tandoori traditions alongside delicate European bistro favorites and handcrafted botanical cocktails.",
    timing: "Breakfast: 7:00 AM – 10:30 AM | All-Day Dining: 12:00 PM – 11:30 PM",
    features: ["Live Tandoor & Robata Grill", "Handpicked Global Wine Cellar", "Private Dining Room (PDR) for 16", "Artisanal High Tea Service"],
    highlights: [
      { name: "Dal Fremont Dum Pukht", desc: "Slow-simmered overnight over charcoal embers, finished with organic churned butter.", price: "₹650" },
      { name: "Truffle & Wild Porcini Risotto", desc: "Acquerello aged carnaroli rice, winter black truffle shavings, aged parmesan.", price: "₹850" },
      { name: "Charred Bhatti Murgh", desc: "Free-range chicken steeped in crushed spices, mustard oil and pomegranate reduction.", price: "₹795" },
      { name: "Saffron Tres Leches & Pistachio Tuile", desc: "Kashmiri saffron-infused sponge soaked in cardamom milk with Iranian pistachios.", price: "₹450" }
    ],
    imagePrimary: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
    imageSecondary: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800",
  },

  events: {
    eyebrow: "CELEBRATIONS & SUMMITS",
    title: "Unforgettable Moments in Regal Splendour",
    subtitle: "From fairytale Punjabi weddings to high-profile corporate summits, Hotel Fremont offers the most prestigious event spaces in Mohali.",
    venues: [
      {
        name: "The Grand Fremont Ballroom",
        capacity: "Up to 600 Guests",
        area: "7,500 sq.ft",
        type: "Weddings, Receptions & Galas",
        desc: "Pillarless grand hall with crystal chandelier ceilings, motorized stage lighting, bridal vanity suite, and private pre-function lobby.",
        image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000",
      },
      {
        name: "The Fremont Terrace Lawn",
        capacity: "Up to 350 Guests",
        area: "5,000 sq.ft",
        type: "Cocktail Evenings & Sangeet",
        desc: "Open-air landscaped terrace under the starlit sky, featuring live barbecue counters and ambient fire pits.",
        image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=1000",
      },
      {
        name: "The Executive Boardroom",
        capacity: "Up to 35 Delegates",
        area: "1,200 sq.ft",
        type: "Board Meetings & Strategic Conclaves",
        desc: "Equipped with 85-inch 4K conferencing display, noise-cancelling directional mics, and dedicated butler refreshments.",
        image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=1000",
      }
    ]
  },

  gallery: [
    { id: 1, title: "Hotel Fremont Facade at Dusk", category: "Architecture", src: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200", span: "col-span-2 row-span-2" },
    { id: 2, title: "Royal Fremont Suite Master Bedroom", category: "Suites", src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000", span: "col-span-1 row-span-1" },
    { id: 3, title: "Aura Fine Dining & Cocktail Bar", category: "Dining", src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000", span: "col-span-1 row-span-1" },
    { id: 4, title: "Grand Ballroom Wedding Setup", category: "Events", src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000", span: "col-span-1 row-span-2" },
    { id: 5, title: "Presidential Penthouse Living Lounge", category: "Suites", src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000", span: "col-span-1 row-span-1" },
    { id: 6, title: "Italian Marble En-Suite Bathroom", category: "Suites", src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000", span: "col-span-1 row-span-1" },
    { id: 7, title: "Chef's Signature Tandoor Platter", category: "Dining", src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000", span: "col-span-1 row-span-1" },
    { id: 8, title: "Deluxe King Room Sanctuary", category: "Suites", src: "/assets/hero/hero-room-1.webp", span: "col-span-1 row-span-1" },
  ],

  testimonials: [
    {
      id: 1,
      name: "Vikramaditya Sharma",
      role: "Managing Director, Global Logistics",
      rating: 5,
      date: "October 2026",
      source: "Google Verified Review",
      text: "Hotel Fremont is an absolute benchmark for luxury in Mohali. Being just 10 minutes from the airport makes it the most convenient stay for our international executives. The suites are whisper-quiet, the food at Aura is world-class, and the staff treats you like royalty.",
    },
    {
      id: 2,
      name: "Dr. Harpreet & Jasleen Kaur",
      role: "Destination Wedding Hosts",
      rating: 5,
      date: "September 2026",
      source: "Google Verified Review",
      text: "We hosted our daughter's wedding reception at the Grand Fremont Ballroom. Our guests are still raving about the chandelier decor, the flawless catering, and the spacious guest suites. Every single request was handled with grace and warmth. Unforgettable!",
    },
    {
      id: 3,
      name: "Aanya Chawla",
      role: "Architectural Consultant, New Delhi",
      rating: 5,
      date: "August 2026",
      source: "Google Verified Review",
      text: "As an architect, I am deeply impressed by the restraint and polish of the interiors. No gaudy excess—pure elegance, impeccable Italian marble, high ceilings, and sublime lighting design. Hotel Fremont is truly in a league of its own.",
    },
    {
      id: 4,
      name: "Rajeshwar Sen",
      role: "Frequent Flyer & Tech Founder",
      rating: 5,
      date: "July 2026",
      source: "Google Verified Review",
      text: "The complimentary airport drop in their private sedan at 5:00 AM was punctual to the second, complete with a warm breakfast box packed for my flight. This attention to detail is why Fremont is my only stay in the Tricity.",
    }
  ],

  location: {
    eyebrow: "PRIME MOHALI SANCTUARY",
    headline: "Minutes from the Airport, Connected to Everything",
    description: "Strategically situated directly on Airport Road in Sector 80, SAS Nagar, Hotel Fremont offers immediate transit to the airport terminal, Mohali's premier business corridors, and Chandigarh's iconic landmarks.",
    addressLine: "Hotel Fremont, Airport Road, Sector 80, SAS Nagar, Mohali, Punjab - 140308",
    distances: [
      { destination: "Chandigarh Int'l Airport (IXC)", time: "10 Mins", dist: "8.5 km", highlight: true },
      { destination: "Mohali Cricket Stadium (PCA)", time: "8 Mins", dist: "5.2 km", highlight: false },
      { destination: "IT City Mohali / Bestech Mall", time: "6 Mins", dist: "3.8 km", highlight: false },
      { destination: "Sector 17 City Centre, Chandigarh", time: "18 Mins", dist: "12.5 km", highlight: false },
      { destination: "Fortis Hospital Mohali", time: "5 Mins", dist: "3.5 km", highlight: false },
    ]
  },

  finalCta: {
    eyebrow: "YOUR SANCTUARY AWAITS",
    title: "Experience Punjab’s Foremost Luxury Boutique Hotel",
    subtitle: "Book direct today for guaranteed best rates, complimentary airport drop, and priority suite upgrades.",
    buttonText: "Reserve Your Experience",
    callText: "Speak with Reservations: +91 98765 43210",
  },

  footer: {
    about: "Hotel Fremont is an architectural luxury boutique destination on Airport Road, Sector 80, Mohali. Dedicated to authentic hospitality, culinary passion, and unforgettable stays.",
    quickLinks: [
      { label: "Home", href: "#" },
      { label: "Rooms & Suites", href: "#rooms" },
      { label: "Dining & Bar", href: "#dining" },
      { label: "Banquets & Weddings", href: "#events" },
      { label: "Hotel Amenities", href: "#amenities" },
      { label: "Photo Gallery", href: "#gallery" },
      { label: "Location & Directions", href: "#location" },
    ],
    legalLinks: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cancellation Policy", href: "#" },
      { label: "Guest Safety & Hygiene", href: "#" },
    ],
    socials: [
      { name: "Instagram", href: "https://instagram.com", icon: "Instagram" },
      { name: "Facebook", href: "https://facebook.com", icon: "Facebook" },
      { name: "LinkedIn", href: "https://linkedin.com", icon: "Linkedin" },
      { name: "YouTube", href: "https://youtube.com", icon: "Youtube" },
    ],
    copyright: "© 2026 Hotel Fremont. All Rights Reserved. Crafted for Discerning Guests."
  }
};
