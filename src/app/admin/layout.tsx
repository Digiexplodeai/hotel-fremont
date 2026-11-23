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
    <div className="admin-portal min-h-screen bg-[#0D0D10] text-[#F5F2EF] antialiased selection:bg-[#742B40] selection:text-white font-sans">
      {children}
    </div>
  );
}
