import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Admin Portal | Hotel Fremont",
  description: "Administrative Management & Media Vault for Hotel Fremont",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F7F3EC] antialiased selection:bg-[#E02B1D] selection:text-white">
      {children}
    </div>
  );
}

