import type { Metadata, Viewport } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import { siteConfig as contentConfig } from "@/data/content";
import { TOTAL_ROOMS } from "@/data/rooms";
import { siteConfig } from "@/lib/site-config";

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
  title: "Hotel Fremont | Comfortable Hotel on Airport Road, Mohali",
  description:
    "Hotel Fremont is a contemporary hotel on Sector 80, Airport Road, Mohali. The property brings together thoughtfully appointed guest rooms, an in-house restaurant, a dedicated banquet venue and a conference room, making it a convenient choice for business and leisure stays as well as social gatherings.",
  keywords: [
    "hotel in Mohali",
    "hotel near Chandigarh airport",
    "hotel Airport Road Mohali",
    "banquet hall Mohali",
    "Hotel Fremont Sector 80",
  ],
  authors: [{ name: "Hotel Fremont Hospitality" }],
  creator: "Hotel Fremont",
  publisher: "Hotel Fremont",
  metadataBase: new URL(siteConfig.siteUrl),
  alternates: {
    canonical: siteConfig.siteUrl,
  },
  openGraph: {
    title: "Hotel Fremont | Comfortable Hotel on Airport Road, Mohali",
    description:
      "Hotel Fremont is a contemporary hotel on Sector 80, Airport Road, Mohali. Thoughtfully appointed guest rooms, an in-house restaurant, a dedicated banquet venue and conference facilities.",
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${siteConfig.siteUrl}/assets/logo.png`,
        width: 1200,
        height: 630,
        alt: "Hotel Fremont",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel Fremont | Comfortable Hotel on Airport Road, Mohali",
    description:
      "Hotel Fremont on Sector 80, Airport Road, Mohali. Thoughtfully appointed guest rooms, in-house restaurant, banquet and conference facilities.",
    images: [`${siteConfig.siteUrl}/assets/logo.png`],
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
    name: siteConfig.siteName,
    description: contentConfig.brand.shortDescription,
    image: `${siteConfig.siteUrl}/assets/logo.png`,
    logo: `${siteConfig.siteUrl}/assets/logo.png`,
    url: siteConfig.siteUrl,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    priceRange: "Rs 2,299 - Rs 4,799 + taxes",
    numberOfRooms: TOTAL_ROOMS || 21,
    checkinTime: "13:00",
    checkoutTime: "11:00",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Khasra No 186, Sector 80, Village Mauli Baidwan, Airport Road",
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
    amenityFeature: contentConfig.amenities.map((a: any) => ({
      "@type": "LocationFeatureSpecification",
      name: a.title,
      value: true,
    })),
  };

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${manrope.variable} dark scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="min-h-screen bg-[#0E0E10] text-[#F7F3EC] antialiased selection:bg-[#E02B1D] selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
