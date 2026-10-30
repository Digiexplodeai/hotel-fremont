# HOTEL FREMONT &mdash; Luxury Boutique Hotel Website

A 5-star, mobile-first, fully animated web application for **Hotel Fremont**, located on Airport Road, Sector 80, SAS Nagar, Mohali, Punjab.

Built with an ultra-premium aesthetic: elegant, cinematic, spacious, and confident.

---

## 💎 Brand Identity

- **Name:** Hotel Fremont (*HOTEL FREMONT* in wordmark, *Hotel Fremont* in body text)
- **Tagline:** *"Stay Beyond Ordinary."*
- **Address:** Hotel Fremont, Airport Road, Sector 80, SAS Nagar, Mohali, Punjab &mdash; 140308
- **USP:** Just **10 Minutes from Chandigarh International Airport (IXC)**
- **Brand Colors:**
  - **Signature Red:** `#E02B1D` (CTAs, interactive highlights, and active states)
  - **Deep Charcoal / Obsidian:** `#0E0E10` (Primary luxury dark canvas)
  - **Warm Ivory:** `#F7F3EC` (High-contrast typography)
  - **Champagne Gold:** `#C9A96E` (Fine architectural lines, borders, and star accents)
- **Typography:**
  - Headings: `Playfair Display` (Bespoke serif)
  - Body: `Manrope` / `Inter` (Crisp modern sans-serif)

---

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Styling:** Tailwind CSS v4 + Vanilla CSS custom tokens
- **Animations:**
  - **Lenis:** Momentum-based buttery-smooth page scrolling
  - **GSAP (ScrollTrigger):** Viewport synchronization and reveal triggers
  - **Framer Motion:** Micro-interactions, spring cursor, and layout animations
- **Icons:** Lucide React
- **Media Optimization:** `next/image` with AVIF/WebP formats, lazy-loading, and blur placeholders
- **SEO & Schema:** JSON-LD `Hotel` structured data, dynamic `sitemap.xml`, and `robots.txt`

---

## 🏛️ Sections & Features

1. **Preloader:** Obsidian canvas, red line-draw animation, and curtain-lift into the site.
2. **Sticky Frosted Glass Navbar:** Brand logo, desktop navigation, phone link, red "Book Now" CTA, and animated mobile full-screen overlay menu.
3. **Hero Section:** Full-screen cinematic visual backdrop, split-word serif headline reveal, floating glassmorphism Booking Bar, and animated scroll indicator.
4. **Interactive Booking Bar:** Check-in / check-out date pickers, suite selector, guest count dropdown, and "Check Rates" action.
5. **About & Heritage:** Split layout with storytelling, overlapping parallax imagery, and animated counters (48+ Suites, 120k+ Guests, 10 Mins Airport, 4.9★ Google Rating).
6. **Rooms & Suites Showcase:** Deluxe King, Premier Executive Suite, Royal Fremont Suite, and Presidential Penthouse with hover zoom, price tags, and an interactive **Room Detail Modal** featuring an image gallery and specifications.
7. **8-Icon Luxury Amenities Grid:** High-Speed Wi-Fi 6, Airport Chauffeur, Aura Gourmet Dining, Grand Banquet, Valet & EV Charging, 24/7 Room Service, Fitness Suite, and 24/7 Concierge.
8. **Aura Restaurant & Lounge:** Atmospheric banner, chef's signature dish highlights with pricing, and an interactive **Table Reservation Modal** connected to WhatsApp.
9. **Banquets & Event Venues:** The Grand Fremont Ballroom (600 guests), Terrace Lawn (350 guests), and Executive Boardroom (35 delegates) with a dedicated **Event Enquiry Modal**.
10. **Curated Photo Gallery:** Filterable masonry grid (Architecture, Suites, Dining, Events) with an interactive fullscreen **Lightbox Viewer** supporting keyboard and touch navigation.
11. **Verified Testimonials:** Google 4.9★ review carousel with star ratings and verified guest comments.
12. **Location & Transit Map:** Google Maps embed, exact address card, and transit distance cards highlighting the 10-minute drive to Chandigarh Airport (IXC) + "Get Directions" button.
13. **Final CTA Band:** Grand headline with instant reservation triggers and direct phone link.
14. **Footer:** Brand summary, quick links, contact info, social icons, and back-to-top button.
15. **Floating Mobile Sticky Bar:** Quick Call, WhatsApp, and Book buttons on mobile screens.
16. **Custom Desktop Cursor:** Signature red dot with an expanding champagne ring.

---

## 🛠️ Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v20+)
- npm or yarn

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

To build for production:
```bash
npm run build
npm run start
```

---

## ✏️ Easy Content Management: How to Update Text, Prices & Images

All website copy, room prices, phone numbers, emails, and images are centralized in a single file:

📁 **`/data/content.js`** (also accessible at `src/data/content.js`)

### 1. Update Contact Information & WhatsApp
In `data/content.js`:
```javascript
contact: {
  phone: "+91 98727 68514",               // Display phone number
  whatsapp: "+91 98727 68514",            // Display WhatsApp number
  whatsappNumber: "919872768514",         // Direct WhatsApp number (without + or spaces)
  bookingEmail: "stay@hotelfremont.com",  // Booking email
  directionsUrl: "https://maps.google.com/?q=Hotel+Fremont+Airport+Road+Sector+80+SAS+Nagar+Mohali+Punjab",
}
```

### 2. Update Room Prices & Suites
Under `rooms`:
```javascript
{
  id: "deluxe-king",
  title: "Deluxe King Room",
  price: 5499,                            // Numerical price for GST calculation
  priceLabel: "₹5,499",                  // Display label
  size: "380 sq.ft",
  image: "/path/or/unsplash/url",         // Replace with your photo
  gallery: [ ... ]                        // Gallery photos
}
```

### 3. Replace Photos with Real Hotel Photos
- Drop your high-res hotel photographs into `/public/assets/` or `/public/images/`.
- In `data/content.js`, update the relevant image URLs (e.g., `image: "/assets/my-suite.jpg"`).

### 4. Replace or Customize the Logo
- The logo is located at `/public/assets/logo.png` (and `/public/assets/logo.svg`).
- Favicon icon is located at `/public/assets/f-icon.png`.
- You can replace these files anytime with your own files using the same filenames.

---

## 🚢 Deployment (Vercel)

The project is pre-configured for seamless 1-click deployment on **Vercel**:

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Framework Preset: **Next.js** (auto-detected).
5. Click **"Deploy"**.

Vercel will automatically build the static assets, optimize images, and deploy to their global edge network.

---

## 📄 License & Credits
Designed and developed for **Hotel Fremont, Mohali, Punjab**. All rights reserved.
