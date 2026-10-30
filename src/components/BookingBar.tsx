"use client";

import { useState } from "react";
import { Calendar, Users, BedDouble, ChevronDown, ArrowRight, Info } from "lucide-react";
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
  // Default dates: today + 1 for check-in, today + 3 for check-out
  const getFormattedDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
  };

  const [checkIn, setCheckIn] = useState(getFormattedDate(1));
  const [checkOut, setCheckOut] = useState(getFormattedDate(3));
  const [roomType, setRoomType] = useState(roomCategories[0].slug);
  const [guests, setGuests] = useState(2);

  const currentCategory =
    roomCategories.find((r) => r.slug === roomType || r.id === roomType) || roomCategories[0];
  const isOverCapacity = guests > currentCategory.maxGuests;
  const suggestedCategory = roomCategories.find((r) => r.maxGuests >= guests);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveRoomType = isOverCapacity && suggestedCategory ? suggestedCategory.slug : roomType;
    onCheckAvailability({
      checkIn,
      checkOut,
      roomType: effectiveRoomType,
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
          />
        </div>

        {/* Suite Category */}
        <div className="h-[62px] px-3.5 py-2 rounded-xl bg-[#16161A]/80 border border-white/10 hover:border-[#C9A96E]/50 transition-colors flex flex-col justify-center">
          <label className="text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold flex items-center space-x-1 mb-0.5">
            <BedDouble className="w-3 h-3 text-[#E02B1D]" />
            <span>Suite Category</span>
          </label>
          <div className="relative flex items-center">
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#F7F3EC] focus:outline-none cursor-pointer appearance-none pr-6 truncate"
            >
              {roomCategories.map((r) => (
                <option key={r.slug} value={r.slug} className="bg-[#16161A] text-[#F7F3EC]">
                  {r.name} ({r.priceLabel})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#C9A96E] absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* Guests & Action Button */}
        <div className="grid grid-cols-[minmax(86px,1.1fr)_1.35fr] gap-2 items-center">
          {/* Guests dropdown */}
          <div className="h-[62px] px-3 py-2 rounded-xl bg-[#16161A]/80 border border-white/10 hover:border-[#C9A96E]/50 transition-colors flex flex-col justify-center">
            <label className="text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold flex items-center space-x-1 mb-0.5">
              <Users className="w-3 h-3 text-[#E02B1D]" />
              <span>Guests</span>
            </label>
            <div className="relative flex items-center">
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-medium text-[#F7F3EC] focus:outline-none cursor-pointer appearance-none pr-4"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num} className="bg-[#16161A] text-[#F7F3EC]">
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#C9A96E] absolute right-0 pointer-events-none" />
            </div>
          </div>

          {/* Bigger Red Check Rates Button with Hover Glow & Arrow Micro-Animation */}
          <button
            type="submit"
            className="h-[62px] px-4 rounded-xl bg-[#E02B1D] text-white hover:bg-[#c82215] transition-all duration-300 font-semibold text-xs uppercase tracking-[0.18em] shadow-[0_4px_25px_rgba(224,43,29,0.45)] hover:shadow-[0_4px_35px_rgba(224,43,29,0.85)] flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <span>Check Rates</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </form>

      {/* Gentle inline message when selected guests exceed category max capacity */}
      {isOverCapacity && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-[#F7F3EC]/90">
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 text-[#E02B1D] shrink-0" />
            <span>
              {currentCategory.name} accommodates up to {currentCategory.maxGuests} guests.
              {suggestedCategory && (
                <span className="text-[#A8A59E] ml-1.5">
                  We recommend our{" "}
                  <button
                    type="button"
                    onClick={() => setRoomType(suggestedCategory.slug)}
                    className="text-[#C9A96E] hover:text-[#E02B1D] font-semibold underline transition-colors cursor-pointer"
                  >
                    {suggestedCategory.name}
                  </button>
                  {" "}for {guests} guests.
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
