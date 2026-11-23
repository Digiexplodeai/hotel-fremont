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
    <header className="sticky top-0 z-30 bg-[#141316]/95 backdrop-blur-md border-b border-[#373138] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] transition cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-serif font-bold text-[#F5F2EF] tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-[#B7A9A7] hidden sm:block">
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
            className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#742B40] hover:bg-[#8B344D] text-white border border-[#C6A16A]/30 text-xs font-semibold tracking-wide transition flex items-center gap-1.5 shadow-sm shadow-[#742B40]/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Reservation</span>
            <span className="sm:hidden">Book</span>
          </button>
        ) : (
          <Link
            href="/admin/reservations?action=new"
            className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#742B40] hover:bg-[#8B344D] text-white border border-[#C6A16A]/30 text-xs font-semibold tracking-wide transition flex items-center gap-1.5 shadow-sm shadow-[#742B40]/30 cursor-pointer"
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
          className="px-3 py-1.5 rounded-xl bg-[#1A191D] hover:bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138] text-xs font-medium transition flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#C6A16A]" />
          <span className="hidden md:inline">Live Site</span>
        </Link>
      </div>
    </header>
  );
}
