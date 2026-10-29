import type { Metadata, Viewport } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/content";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#0E0E10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Hotel Fremont | Luxury Hotel near Airport Road, Mohali",
  description:
    "Experience 5-star boutique luxury at Hotel Fremont, Airport Road, Sector 80, SAS Nagar, Mohali. 10 minutes from Chandigarh International Airport (IXC). Bespoke suites, fine dining, and grand banquets.",
  keywords: [
    "hotel in Mohali",
    "hotel near Chandigarh airport",
    "best hotel Airport Road Mohali",
    "luxury hotel Mohali",
    "banquet hall Mohali",
    "wedding venue Mohali",
    "Hotel Fremont",
    "Sector 80 Mohali hotels",
    "boutique hotel Chandigarh Tricity",
  ],
  authors: [{ name: "Hotel Fremont Hospitality" }],
  creator: "Hotel Fremont",
  publisher: "Hotel Fremont",
  metadataBase: new URL("https://hotelfremont.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hotel Fremont | Luxury Boutique Hotel near Airport Road, Mohali",
    description:
      "Stay Beyond Ordinary. 5-star boutique hotel in Mohali, Punjab, minutes from Chandigarh Airport. Luxury suites, fine dining, and banquet venues.",
    url: "https://hotelfremont.com",
    siteName: "Hotel Fremont",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/assets/logo.png",
        width: 1200,
        height: 630,
        alt: "Hotel Fremont - Luxury Hotel Mohali",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel Fremont | Luxury Hotel near Airport Road, Mohali",
    description:
      "Stay Beyond Ordinary at Hotel Fremont, Sector 80, Airport Road, Mohali. 10 mins from Chandigarh Airport.",
    images: ["/assets/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/assets/f-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Rich JSON-LD Schema for Hotel SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: siteConfig.brand.name,
    legalName: siteConfig.brand.legalName,
    alternateName: siteConfig.brand.logoWordmark,
    description: siteConfig.brand.shortDescription,
    image: "https://hotelfremont.com/assets/logo.png",
    logo: "https://hotelfremont.com/assets/logo.png",
    url: "https://hotelfremont.com",
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: "₹₹₹₹",
    starRating: {
      "@type": "Rating",
      ratingValue: "5",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "1840",
      bestRating: "5",
      worstRating: "1",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Airport Road, Sector 80",
      addressLocality: "SAS Nagar, Mohali",
      addressRegion: "Punjab",
      postalCode: "140308",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "30.6865",
      longitude: "76.7214",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    amenityFeature: siteConfig.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a.title,
      value: true,
    })),
  };

  return (
    <html lang="en" className={`${playfair.variable} ${manrope.variable} dark scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#0E0E10] text-[#F7F3EC] antialiased selection:bg-[#E02B1D] selection:text-white">
        {children}
      </body>
    </html>
  );
}
