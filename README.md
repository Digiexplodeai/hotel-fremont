# HOTEL FREMONT &mdash; Luxury Boutique Hotel Website &amp; Enterprise Admin

A 5-star, mobile-first, fully animated web application and enterprise management system for **Hotel Fremont**, located on Airport Road, Sector 80, SAS Nagar, Mohali, Punjab.

Built with an ultra-premium aesthetic: elegant, cinematic, spacious, and confident.

---

## 💎 Brand Identity & Physical Inventory

- **Name:** Hotel Fremont (*HOTEL FREMONT* in wordmark, *Hotel Fremont* in body text)
- **Tagline:** *"Stay Beyond Ordinary."*
- **Address:** Hotel Fremont, Airport Road, Sector 80, SAS Nagar, Mohali, Punjab &mdash; 140308
- **USP:** Just **10 Minutes from Chandigarh International Airport (IXC)**
- **Contact:** `+91 98727 68514` &middot; WhatsApp: `919872768514`
- **Physical Keys (Exactly 12 Rooms):**
  - **Deluxe King Room (6 Keys):** Rooms 101, 102, 103, 104, 105, 106 &middot; Floor 1 &middot; Max 2 Guests &middot; ₹5,499/night
  - **Premier Executive Suite (3 Keys):** Rooms 201, 202, 203 &middot; Floor 2 &middot; Max 3 Guests &middot; ₹8,999/night
  - **The Royal Fremont Suite (2 Keys):** Rooms 301, 302 &middot; Floor 3 &middot; Max 4 Guests &middot; ₹14,999/night
  - **Presidential Penthouse (1 Key):** Room 401 &middot; Floor 4 &middot; Max 6 Guests &middot; ₹24,999/night
- **Brand Colors:**
  - **Signature Red:** `#E02B1D` (CTAs, interactive highlights, and active states)
  - **Deep Charcoal / Obsidian:** `#0E0E10` (Primary luxury dark canvas)
  - **Warm Ivory:** `#F7F3EC` (High-contrast typography)
  - **Champagne Gold:** `#C9A96E` (Fine architectural lines, borders, and star accents)

---

## 🚀 Modern Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Styling:** Tailwind CSS v4 + Vanilla CSS custom design tokens
- **Media Storage:** Cloudflare R2 Object Storage (direct browser-to-R2 presigned PUT uploads)
- **Database:** Supabase PostgreSQL with Row Level Security (RLS) &amp; seamless local fallback
- **Hosting & Edge:** Netlify (`@netlify/plugin-nextjs`, Serverless Functions &amp; Edge CDN)
- **Animations:**
  - **Lenis:** Momentum-based buttery-smooth page scrolling
  - **GSAP (ScrollTrigger):** Viewport synchronization and reveal triggers
  - **Framer Motion:** Micro-interactions, spring cursor, and layout animations
- **Drag & Drop:** `@dnd-kit/core` &amp; `@dnd-kit/sortable` for gallery reordering
- **Media Optimization:** Client-side canvas resizing (max 2400px), EXIF GPS stripping, WebP conversion, and blur placeholders

---

## 🏛️ Public Website Features

1. **Preloader:** Obsidian canvas, red line-draw animation, and curtain-lift into the site.
2. **Sticky Frosted Glass Navbar:** Brand logo, desktop navigation, phone link, red "Book Now" CTA, and animated mobile full-screen overlay menu.
3. **Hero Section:** Full-screen cinematic visual backdrop, split-word serif headline reveal, floating glassmorphism Booking Bar, and animated scroll indicator.
4. **Interactive Booking Bar:** Dynamic check-in / check-out date pickers, suite selector, and capacity-aware guest count dropdown.
5. **About & Heritage:** Split layout with storytelling, overlapping parallax imagery, and authentic verified metrics.
6. **Rooms & Suites Showcase:** 4 bespoke categories for exactly 12 keys, price tags, and an interactive **Room Detail Modal** featuring an image gallery and specifications.
7. **8-Icon Luxury Amenities Grid:** High-Speed Wi-Fi 6, Airport Chauffeur, Aura Gourmet Dining, Grand Banquet, Valet & EV Charging, 24/7 Room Service, Fitness Suite, and 24/7 Concierge.
8. **Aura Restaurant & Lounge:** Atmospheric banner, chef's signature dish highlights with pricing, and an interactive **Table Reservation Modal** connected to WhatsApp.
9. **Banquets & Event Venues:** The Grand Fremont Ballroom (600 guests), Terrace Lawn (350 guests), and Executive Boardroom (35 delegates) with a dedicated **Event Enquiry Modal**.
10. **Curated Photo Gallery:** Filterable masonry grid (Architecture, Suites, Dining, Events) with an interactive fullscreen **Lightbox Viewer** supporting keyboard and touch navigation.
11. **Verified Testimonials:** Google Guest Rating card with verified feedback without invented counts.
12. **Location & Transit Map:** Google Maps embed, exact address card, and transit distance cards highlighting the 10-minute drive to Chandigarh Airport (IXC) + "Get Directions" button.
13. **Floating Mobile Sticky Bar:** Quick Call, WhatsApp, and Book buttons on mobile screens.

---

## ⚡ Enterprise Admin Panel (`/admin`)

The website includes a complete, production-ready enterprise back-office isolated at `/admin`:

### 1. Image Manager (`/admin/images`)
- Full control over every image slot on the site (Hero slides, Room cards & modals, Aura dining, Event venues, Gallery).
- Direct browser-to-Cloudflare R2 presigned PUT uploads bypassing server payload limits.
- Client-side auto-optimization: resizes to max 2400px, strips EXIF/GPS, converts to high-quality WebP, and generates 16×16 blur preview data URLs.
- 9-point focal point alignment grid (`top left`, `center`, etc.).
- Drag-and-drop gallery reordering via `@dnd-kit`.
- Orphan object detection to identify unreferenced files on R2.

### 2. 12 Keys Inventory & Status Board (`/admin/rooms`)
- Real-time room status board for all 12 physical rooms across 4 floors.
- 1-click status switching: Available, Occupied, Cleaning, Maintenance, Blocked.
- 14-day interactive Tape Chart calendar timeline.
- Double-booking prevention algorithm.
- Printable official guest reservation voucher and GST billing invoice.

### 3. Guest Enquiries & Leads Pipeline (`/admin/enquiries`)
- Captures all public submissions from Check Rates, Room Booking, Dining Aura, and Event forms.
- 1-click Direct WhatsApp follow-up with contextual greetings.
- 1-click Direct Phone Call button.
- Status progression: `New Lead` &rarr; `Contacted` &rarr; `Converted` &rarr; `Closed`.
- Front desk notes editor to log guest interactions.

### 4. Website CMS & Global Settings (`/admin/content`)
- Change official phone display, click-to-call links, and WhatsApp number.
- Toggle visibility of Google ratings and reputation badges.
- Manage social media profile URLs.
- Enable promotional announcement alert banners.

---

## 🛠️ Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or yarn

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open in browser
http://localhost:3000
http://localhost:3000/admin/login
```

### Admin Credentials
- **Master Admin Access Key:** `fremont-admin-2026`
- **Staff Credentials:** Email &amp; Password authenticated via Supabase Auth.

---

## 🚢 Deployment (Netlify)

The project is pre-configured for seamless production deployment on **Netlify** via `netlify.toml` and `@netlify/plugin-nextjs`:

1. Push your repository to GitHub.
2. In Netlify Dashboard, create a new site from your Git repository.
3. Configure the following environment variables in **Netlify &gt; Site settings &gt; Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://gtfkgsbkalldvlueveks.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable__...`
   - `R2_ACCOUNT_ID`: `93888554ef9d9e0b8c18b322683a9652`
   - `R2_ACCESS_KEY_ID`: `73da086d59ec3361f3c8922ebea6cd80`
   - `R2_SECRET_ACCESS_KEY`: `<your-r2-secret-key>`
   - `R2_BUCKET_NAME`: `hotel-fremont-media`
   - `PUBLIC_R2_PUBLIC_URL`: `https://pub-583d3181aad14cfaac7a1be83ef68da2.r2.dev`
   - `ADMIN_MASTER_KEY`: `fremont-admin-2026`
4. Deploy! Netlify will automatically build the Next.js App Router application with edge media rendering and server actions.

---

## 📄 License & Credits
Designed and developed for **Hotel Fremont, Mohali, Punjab**. All rights reserved.
