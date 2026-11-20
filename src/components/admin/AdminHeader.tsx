"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  ExternalLink,
  Plus,
  CalendarCheck,
  Bell,
  Sparkles,
} from "lucide-react";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
  onNewReservation?: () => void;
  onNewEnquiry?: () => void;
}

export default function AdminHeader({
  title = "Dashboard",
  subtitle = "Hotel Fremont · Property Management & Operations",
  onMobileMenuToggle,
  onNewReservation,
  onNewEnquiry,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#EAE8E3] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-[#4B5563] hover:text-[#24272B] hover:bg-[#F8F7F4] transition"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-serif font-bold text-[#24272B] tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-[#6B7280] hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick New Reservation button */}
        {onNewReservation ? (
          <button
            onClick={onNewReservation}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 shadow-sm shadow-[#742B40]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Reservation</span>
            <span className="sm:hidden">Book</span>
          </button>
        ) : (
          <Link
            href="/admin/reservations?action=new"
            className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white text-xs font-semibold tracking-wide transition flex items-center gap-1.5 shadow-sm shadow-[#742B40]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Reservation</span>
            <span className="sm:hidden">Book</span>
          </Link>
        )}

        {/* View Live Site Link */}
        <Link
          href="/"
          target="_blank"
          className="px-3 py-1.5 rounded-xl bg-[#F8F7F4] hover:bg-white text-[#4B5563] hover:text-[#24272B] border border-[#EAE8E3] text-xs font-medium transition flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#B69A68]" />
          <span className="hidden md:inline">Live Site</span>
        </Link>
      </div>
    </header>
  );
}
