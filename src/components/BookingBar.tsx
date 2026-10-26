"use client";

import { useState } from "react";
import { Calendar, Users, BedDouble, Search, ChevronDown } from "lucide-react";
import { siteConfig } from "@/data/content";

interface BookingBarProps {
  onCheckAvailability: (bookingData: {
    checkIn: string;
    checkOut: string;
    roomType: string;
    guests: number;
  }) => void;
  className?: string;
}

export default function BookingBar({ onCheckAvailability, className = "" }: BookingBarProps) {
  // Default dates: today + 1 for check-in, today + 2 for check-out
  const getFormattedDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
  };

  const [checkIn, setCheckIn] = useState(getFormattedDate(1));
  const [checkOut, setCheckOut] = useState(getFormattedDate(3));
  const [roomType, setRoomType] = useState(siteConfig.rooms[0].id);
  const [guests, setGuests] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckAvailability({
      checkIn,
      checkOut,
      roomType,
      guests,
    });
  };

  return (
    <div
      className={`w-full max-w-5xl mx-auto glass-panel rounded-2xl p-3 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.65)] border border-[#C9A96E]/30 relative z-20 ${className}`}
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 items-center">
        {/* Check-In Date */}
        <div className="relative p-2.5 sm:p-3 rounded-xl bg-[#16161A]/80 border border-white/5 hover:border-[#C9A96E]/40 transition-colors">
          <label className="block text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold mb-1 flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-[#E02B1D]" />
            <span>Check-In</span>
          </label>
          <input
            type="date"
            value={checkIn}
            min={getFormattedDate(0)}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-[#F7F3EC] focus:outline-none cursor-pointer [color-scheme:dark]"
            required
          />
        </div>

        {/* Check-Out Date */}
        <div className="relative p-2.5 sm:p-3 rounded-xl bg-[#16161A]/80 border border-white/5 hover:border-[#C9A96E]/40 transition-colors">
          <label className="block text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold mb-1 flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-[#E02B1D]" />
            <span>Check-Out</span>
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || getFormattedDate(1)}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-[#F7F3EC] focus:outline-none cursor-pointer [color-scheme:dark]"
            required
          />
        </div>

        {/* Room / Suite Type Selection */}
        <div className="relative p-2.5 sm:p-3 rounded-xl bg-[#16161A]/80 border border-white/5 hover:border-[#C9A96E]/40 transition-colors">
          <label className="block text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold mb-1 flex items-center space-x-1">
            <BedDouble className="w-3 h-3 text-[#E02B1D]" />
            <span>Suite Category</span>
          </label>
          <div className="relative">
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#F7F3EC] focus:outline-none cursor-pointer appearance-none pr-6"
            >
              {siteConfig.rooms.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#16161A] text-[#F7F3EC]">
                  {r.title} ({r.priceLabel})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#C9A96E] absolute right-0 top-1 pointer-events-none" />
          </div>
        </div>

        {/* Guests & Action Button */}
        <div className="flex items-center space-x-2">
          {/* Guests dropdown */}
          <div className="w-1/2 relative p-2.5 sm:p-3 rounded-xl bg-[#16161A]/80 border border-white/5 hover:border-[#C9A96E]/40 transition-colors">
            <label className="block text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold mb-1 flex items-center space-x-1">
              <Users className="w-3 h-3 text-[#E02B1D]" />
              <span>Guests</span>
            </label>
            <div className="relative">
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-medium text-[#F7F3EC] focus:outline-none cursor-pointer appearance-none pr-6"
              >
                <option value={1} className="bg-[#16161A] text-[#F7F3EC]">1 Guest</option>
                <option value={2} className="bg-[#16161A] text-[#F7F3EC]">2 Guests</option>
                <option value={3} className="bg-[#16161A] text-[#F7F3EC]">3 Guests</option>
                <option value={4} className="bg-[#16161A] text-[#F7F3EC]">4+ Guests</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#C9A96E] absolute right-0 top-1 pointer-events-none" />
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-1/2 h-[58px] rounded-xl bg-[#E02B1D] text-white hover:bg-[#c82215] transition-all duration-300 font-semibold text-xs uppercase tracking-[0.16em] shadow-[0_4px_20px_rgba(224,43,29,0.4)] hover:shadow-[0_4px_28px_rgba(224,43,29,0.7)] flex flex-col items-center justify-center space-y-0.5 group btn-magnetic"
          >
            <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Check Rates</span>
          </button>
        </div>
      </form>
    </div>
  );
}
