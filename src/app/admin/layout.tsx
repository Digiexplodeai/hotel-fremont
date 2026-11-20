import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Admin Portal | Hotel Fremont",
  description: "Property Management & Operations Platform for Hotel Fremont",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#24272B] antialiased selection:bg-[#742B40] selection:text-white font-sans">
      {children}
    </div>
  );
}
