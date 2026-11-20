"use client";

import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  userEmail?: string;
  title?: string;
  subtitle?: string;
  onNewReservation?: () => void;
  onNewEnquiry?: () => void;
}

export default function AdminLayoutShell({
  children,
  userEmail = "admin@hotelfremont.com",
  title = "Dashboard Overview",
  subtitle = "Hotel Fremont · Property Operations · 21 Verified Keys",
  onNewReservation,
  onNewEnquiry,
}: AdminLayoutShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#24272B] font-sans antialiased flex flex-col">
      {/* Collapsible/Responsive Sidebar */}
      <AdminSidebar
        userEmail={userEmail}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onNewReservation={onNewReservation}
          onNewEnquiry={onNewEnquiry}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
