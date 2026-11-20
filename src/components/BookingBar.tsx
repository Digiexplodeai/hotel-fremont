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
      className={`w-full max-w-5xl mx-auto bg-white/95 backdrop-blur-2xl border border-[#E5DFD7] rounded-2xl p-3 sm:p-5 shadow-[0_15px_45px_rgba(36,39,43,0.14)] relative z-20 ${className}`}
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 items-center">
        {/* Check-In Date */}
        <div className="h-[62px] px-3.5 py-2 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] hover:border-[#B69A68] transition-colors flex flex-col justify-center">
          <label className="text-[10px] font-sans tracking-[0.2em] text-[#64615D] uppercase font-bold flex items-center space-x-1 mb-0.5">
            <Calendar className="w-3 h-3 text-[#742B40]" />
            <span>Check-In</span>
          </label>
          <input
            type="date"
            value={checkIn}
            min={getFormattedDate(0)}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#24272B] focus:outline-none cursor-pointer [color-scheme:light]"
            required
            suppressHydrationWarning
          />
        </div>

        {/* Check-Out Date */}
        <div className="h-[62px] px-3.5 py-2 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] hover:border-[#B69A68] transition-colors flex flex-col justify-center">
          <label className="text-[10px] font-sans tracking-[0.2em] text-[#64615D] uppercase font-bold flex items-center space-x-1 mb-0.5">
            <Calendar className="w-3 h-3 text-[#742B40]" />
            <span>Check-Out</span>
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || getFormattedDate(1)}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#24272B] focus:outline-none cursor-pointer [color-scheme:light]"
            required
            suppressHydrationWarning
          />
        </div>

        {/* Room Category */}
        <div className="h-[62px] px-3.5 py-2 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] hover:border-[#B69A68] transition-colors flex flex-col justify-center">
          <label className="text-[10px] font-sans tracking-[0.2em] text-[#64615D] uppercase font-bold flex items-center space-x-1 mb-0.5">
            <BedDouble className="w-3 h-3 text-[#742B40]" />
            <span>Room Category</span>
          </label>
          <div className="relative flex items-center">
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-[#24272B] focus:outline-none cursor-pointer appearance-none pr-6 truncate"
            >
              {roomCategories.map((r) => (
                <option key={r.slug} value={r.slug} className="bg-white text-[#24272B]">
                  {r.name} ({r.startingPriceLabel || r.priceLabel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Guests & Action Button */}
        <div className="flex items-center gap-2">
          <div className="h-[62px] flex-1 px-3 py-2 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] hover:border-[#B69A68] transition-colors flex flex-col justify-center">
            <label className="text-[10px] font-sans tracking-[0.2em] text-[#64615D] uppercase font-bold flex items-center space-x-1 mb-0.5">
              <Users className="w-3 h-3 text-[#742B40]" />
              <span>Guests</span>
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value, 10))}
              className="w-full bg-transparent text-sm font-semibold text-[#24272B] focus:outline-none cursor-pointer"
            >
              <option value={1} className="bg-white text-[#24272B]">1 Guest</option>
              <option value={2} className="bg-white text-[#24272B]">2 Guests (Max)</option>
            </select>
          </div>

          <button
            type="submit"
            className="h-[62px] px-5 sm:px-6 rounded-xl bg-[#742B40] hover:bg-[#5C2033] text-white text-xs font-sans uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-[0_4px_20px_rgba(116,43,64,0.35)] hover:shadow-[0_4px_25px_rgba(116,43,64,0.55)] flex items-center justify-center whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Book Now</span>
          </button>
        </div>
      </form>
    </div>
  );
}
