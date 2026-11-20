"use client";

import { useState } from "react";
import { Calendar, Users, BedDouble } from "lucide-react";
import { roomCategories } from "@/data/rooms";

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
  const getFormattedDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
  };

  const [checkIn, setCheckIn] = useState(getFormattedDate(1));
  const [checkOut, setCheckOut] = useState(getFormattedDate(3));
  const [roomType, setRoomType] = useState(roomCategories[0].slug);
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
      className={`w-full max-w-5xl mx-auto bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.65)] relative z-20 ${className}`}
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 items-center">
        {/* Check-In Date */}
        <div className="h-[62px] px-3.5 py-2 rounded-xl bg-[#16161A]/80 border border-white/10 hover:border-[#C9A96E]/50 transition-colors flex flex-col justify-center">
          <label className="text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold flex items-center space-x-1 mb-0.5">
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
            suppressHydrationWarning
          />
        </div>

        {/* Check-Out Date */}
        <div className="h-[62px] px-3.5 py-2 rounded-xl bg-[#16161A]/80 border border-white/10 hover:border-[#C9A96E]/50 transition-colors flex flex-col justify-center">
          <label className="text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold flex items-center space-x-1 mb-0.5">
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
            suppressHydrationWarning
          />
        </div>

        {/* Room Category */}
        <div className="h-[62px] px-3.5 py-2 rounded-xl bg-[#16161A]/80 border border-white/10 hover:border-[#C9A96E]/50 transition-colors flex flex-col justify-center">
          <label className="text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold flex items-center space-x-1 mb-0.5">
            <BedDouble className="w-3 h-3 text-[#E02B1D]" />
            <span>Room Category</span>
          </label>
          <div className="relative flex items-center">
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#F7F3EC] focus:outline-none cursor-pointer appearance-none pr-6 truncate"
            >
              {roomCategories.map((r) => (
                <option key={r.slug} value={r.slug} className="bg-[#16161A] text-[#F7F3EC]">
                  {r.name} ({r.startingPriceLabel || r.priceLabel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Guests & Action Button */}
        <div className="flex items-center gap-2">
          <div className="h-[62px] flex-1 px-3 py-2 rounded-xl bg-[#16161A]/80 border border-white/10 hover:border-[#C9A96E]/50 transition-colors flex flex-col justify-center">
            <label className="text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold flex items-center space-x-1 mb-0.5">
              <Users className="w-3 h-3 text-[#E02B1D]" />
              <span>Guests</span>
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value, 10))}
              className="w-full bg-transparent text-sm font-medium text-[#F7F3EC] focus:outline-none cursor-pointer"
            >
              <option value={1} className="bg-[#16161A] text-[#F7F3EC]">1 Guest</option>
              <option value={2} className="bg-[#16161A] text-[#F7F3EC]">2 Guests (Max)</option>
            </select>
          </div>

          <button
            type="submit"
            className="h-[62px] px-5 sm:px-6 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white text-xs font-sans uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-[0_4px_25px_rgba(224,43,29,0.4)] flex items-center justify-center whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Book Now</span>
          </button>
        </div>
      </form>
    </div>
  );
}
