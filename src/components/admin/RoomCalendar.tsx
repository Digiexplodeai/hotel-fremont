"use client";

import React, { useState, useMemo } from "react";
import { CalendarDaySummary, CalendarDayStay } from "@/actions/roomTypes";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  BedDouble,
  Clock,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";

interface RoomCalendarProps {
  initialCalendar: CalendarDaySummary[];
}

export default function RoomCalendar({ initialCalendar }: RoomCalendarProps) {
  const [calendar] = useState<CalendarDaySummary[]>(initialCalendar);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<CalendarDaySummary | null>(null);
  const [pageOffset, setPageOffset] = useState<number>(0);

  // Group into pages of 28 days
  const pageSize = 28;
  const maxPages = Math.ceil(calendar.length / pageSize);

  const visibleDays = useMemo(() => {
    const start = pageOffset * pageSize;
    return calendar.slice(start, start + pageSize);
  }, [calendar, pageOffset]);

  const currentMonthLabel = useMemo(() => {
    if (visibleDays.length === 0) return "";
    const firstDate = new Date(visibleDays[0].date);
    const lastDate = new Date(visibleDays[visibleDays.length - 1].date);
    return `${firstDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })} — ${lastDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }, [visibleDays]);

  return (
    <div className="space-y-6">
      {/* Calendar Control Toolbar */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#F8F7F4] p-1 rounded-xl border border-[#EAE8E3]">
            <button
              onClick={() => setPageOffset(Math.max(0, pageOffset - 1))}
              disabled={pageOffset === 0}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#24272B] hover:bg-white disabled:opacity-30 transition cursor-pointer"
              title="Previous 4 weeks"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-[#24272B] min-w-[170px] text-center">
              {currentMonthLabel}
            </span>
            <button
              onClick={() => setPageOffset(Math.min(maxPages - 1, pageOffset + 1))}
              disabled={pageOffset >= maxPages - 1}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#24272B] hover:bg-white disabled:opacity-30 transition cursor-pointer"
              title="Next 4 weeks"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setPageOffset(0)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-[#742B40] hover:bg-[#742B40]/10 border border-[#742B40]/20 transition"
          >
            Today
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-xs font-medium text-[#24272B] focus:outline-none focus:border-[#742B40]"
          >
            <option value="all">All 21 Physical Keys</option>
            <option value="deluxe-room">Deluxe Room (9 Keys)</option>
            <option value="super-deluxe">Super Deluxe (10 Keys)</option>
            <option value="premium">Premium Room (2 Keys)</option>
          </select>
        </div>
      </div>

      {/* 28-Day Matrix Calendar Grid */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl p-5 shadow-sm space-y-4">
        {/* Days Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {visibleDays.map((day) => {
            const isToday = day.date === new Date().toISOString().slice(0, 10);
            const isSoldOut = day.totalOccupied >= (day.totalInventory || 21);
            const isHighDemand = day.occupancyPercentage >= 75;

            // Compute category-specific occupancy if filtered
            let displayBooked = day.totalOccupied;
            let displayTotal = day.totalInventory || 21;
            if (selectedCategory !== "all") {
              const catData = day.byRoomType[selectedCategory];
              displayBooked = catData?.booked || 0;
              displayTotal = catData?.total || (selectedCategory === "deluxe-room" ? 9 : selectedCategory === "super-deluxe" ? 10 : 2);
            }

            const pct = displayTotal > 0 ? Math.round((displayBooked / displayTotal) * 100) : 0;
            const isSelected = selectedDay?.date === day.date;

            return (
              <div
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                  isSelected
                    ? "bg-[#742B40]/5 border-[#742B40] ring-2 ring-[#742B40]/20"
                    : isToday
                    ? "bg-[#FAF9F7] border-[#B69A68] shadow-sm"
                    : isSoldOut
                    ? "bg-rose-50/50 border-rose-200"
                    : isHighDemand
                    ? "bg-amber-50/40 border-amber-200"
                    : "bg-white border-[#EAE8E3] hover:border-[#742B40]/40"
                }`}
              >
                {/* Date & Day Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold uppercase text-[#6B7280]">
                    {day.dayOfWeek}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      isToday ? "text-[#742B40]" : "text-[#24272B]"
                    }`}
                  >
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Progress / Occupancy Badge */}
                <div className="my-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#6B7280]">Booked</span>
                    <span
                      className={`font-bold ${
                        isSoldOut
                          ? "text-rose-600"
                          : isHighDemand
                          ? "text-amber-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {displayBooked}/{displayTotal}
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#EAE8E3] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSoldOut
                          ? "bg-rose-600"
                          : isHighDemand
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                {/* Category mini breakdown */}
                {selectedCategory === "all" ? (
                  <div className="pt-2 border-t border-[#EAE8E3] text-[10px] font-mono space-y-0.5 text-[#6B7280]">
                    <div className="flex justify-between">
                      <span>Deluxe:</span>
                      <span className="font-semibold text-[#24272B]">
                        {(day.byRoomType["deluxe-room"]?.booked ?? day.byRoomType["deluxe"]?.booked) || 0}/9
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>S. Deluxe:</span>
                      <span className="font-semibold text-[#24272B]">
                        {(day.byRoomType["super-deluxe"]?.booked ?? day.byRoomType["super-deluxe-room"]?.booked) || 0}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium:</span>
                      <span className="font-semibold text-[#24272B]">
                        {(day.byRoomType["premium"]?.booked ?? day.byRoomType["premium-room"]?.booked) || 0}/2
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#EAE8E3] text-[10px] text-[#6B7280] flex items-center justify-between">
                    <span>Available:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {Math.max(0, displayTotal - displayBooked)} Keys
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#EAE8E3] text-xs text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
            <span>Available (Normal Demand)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>High Occupancy (&ge; 75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600" />
            <span>Sold Out (100% Occupancy)</span>
          </div>
        </div>
      </div>

      {/* Date Details Drawer */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#9CA3AF] block">
                    Daily Occupancy Roster
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#742B40]">
                    {new Date(selectedDay.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#24272B] hover:bg-[#F8F7F4]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Day Overview Cards */}
              <div className="grid grid-cols-2 gap-3 pt-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3]">
                  <span className="text-[#6B7280] block text-[11px]">Occupied Keys</span>
                  <span className="text-xl font-serif font-bold text-[#742B40]">
                    {selectedDay.totalOccupied} / {selectedDay.totalInventory || 21}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3]">
                  <span className="text-[#6B7280] block text-[11px]">Rooms Left</span>
                  <span className="text-xl font-serif font-bold text-emerald-700">
                    {Math.max(0, (selectedDay.totalInventory || 21) - selectedDay.totalOccupied)} Keys
                  </span>
                </div>
              </div>

              {/* In-House Guest Stays */}
              <div className="pt-6 space-y-3">
                <h4 className="text-xs font-sans uppercase font-bold tracking-wider text-[#9CA3AF]">
                  In-House Guests on this Date ({selectedDay.activeStays.length})
                </h4>

                {selectedDay.activeStays.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedDay.activeStays.map((stay, idx) => (
                      <div
                        key={`${stay.reservationId}-${idx}`}
                        className="p-3.5 rounded-xl bg-white border border-[#EAE8E3] hover:border-[#742B40]/30 transition shadow-sm space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#24272B]">{stay.guestName}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#F8F7F4] text-[#742B40] font-semibold border border-[#EAE8E3]">
                            {stay.referenceCode}
                          </span>
                        </div>
                        <div className="text-xs text-[#6B7280] flex items-center justify-between">
                          <span>{stay.roomTypeName}</span>
                          <span>{stay.roomsCount} Key(s)</span>
                        </div>
                        <div className="text-[11px] text-[#9CA3AF] flex items-center justify-between pt-1 border-t border-[#EAE8E3]">
                          <span>Stay: {stay.checkIn} &rarr; {stay.checkOut}</span>
                          <span className="font-mono">{stay.guestPhone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#6B7280] bg-[#FAF9F7] rounded-xl border border-[#EAE8E3]">
                    No in-house reservations recorded for this date.
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-[#EAE8E3]">
              <button
                onClick={() => setSelectedDay(null)}
                className="w-full py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white text-xs font-semibold transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
