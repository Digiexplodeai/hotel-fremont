"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  BedDouble,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Loader2,
  Phone,
  DoorClosed,
  ChevronDown,
} from "lucide-react";
import { HOTEL_CONFIG, RoomTypeConfig, DEFAULT_ROOM_TYPES, validateIndianPhone, formatINR } from "@/config/hotel";
import { submitReservationAction } from "@/actions/reservations";
import { getRoomTypesAction, getRoomAvailabilityAction, RoomAvailabilityResult } from "@/actions/roomTypes";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
    guests?: number;
  };
}

// Client rate-limiting helper (max 5 requests per 10 minutes)
function isClientRateLimited(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = "hf_booking_attempts";
    const now = Date.now();
    const raw = sessionStorage.getItem(key);
    let attempts: number[] = raw ? JSON.parse(raw) : [];
    // Filter attempts in last 10 minutes
    attempts = attempts.filter((t) => now - t < 10 * 60 * 1000);
    if (attempts.length >= 5) return true;
    attempts.push(now);
    sessionStorage.setItem(key, JSON.stringify(attempts));
    return false;
  } catch {
    return false;
  }
}

export default function BookingModal({
  isOpen,
  onClose,
  initialData,
}: BookingModalProps) {
  const getFormattedDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
  };

  const todayStr = useMemo(() => getFormattedDate(0), []);

  // Form State
  const [checkIn, setCheckIn] = useState(initialData?.checkIn || getFormattedDate(1));
  const [checkOut, setCheckOut] = useState(initialData?.checkOut || getFormattedDate(3));
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>(DEFAULT_ROOM_TYPES);
  const [selectedCode, setSelectedCode] = useState<string>("deluxe-king");
  const [guests, setGuests] = useState(initialData?.guests || 2);
  const [roomsRequested, setRoomsRequested] = useState<number>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Live Inventory State
  const [availability, setAvailability] = useState<Record<string, RoomAvailabilityResult>>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Submission & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  // 1. Fetch live Room Types from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSuites() {
      const res = await getRoomTypesAction();
      if (isMounted && res.success && res.roomTypes.length > 0) {
        setRoomTypes(res.roomTypes);
        // Default to initial room or first room type
        if (initialData?.roomType) {
          const match = res.roomTypes.find(
            (rt) => rt.code === initialData.roomType || rt.name.toLowerCase() === initialData.roomType?.toLowerCase()
          );
          if (match) setSelectedCode(match.code);
        } else if (!res.roomTypes.some((rt) => rt.code === selectedCode)) {
          setSelectedCode(res.roomTypes[0].code);
        }
      }
    }
    loadSuites();
    return () => {
      isMounted = false;
    };
  }, [initialData]);

  // 2. Fetch Live Availability whenever checkIn or checkOut change
  const refreshAvailability = useCallback(async (inDate: string, outDate: string) => {
    if (!inDate || !outDate || outDate <= inDate) return;
    setIsLoadingAvailability(true);
    try {
      const res = await getRoomAvailabilityAction(inDate, outDate);
      if (res.success && res.availability) {
        const map: Record<string, RoomAvailabilityResult> = {};
        res.availability.forEach((item) => {
          map[item.code] = item;
        });
        setAvailability(map);
      }
    } finally {
      setIsLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshAvailability(checkIn, checkOut);
    }
  }, [isOpen, checkIn, checkOut, refreshAvailability]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setIsSubmitted(false);
      setErrorMessage(null);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Current selected room type
  const activeRoom = useMemo(() => {
    return roomTypes.find((r) => r.code === selectedCode) || roomTypes[0] || DEFAULT_ROOM_TYPES[0];
  }, [roomTypes, selectedCode]);

  // Current room's live availability
  const currentRoomAvail = availability[activeRoom.code];
  const roomsLeft = currentRoomAvail ? currentRoomAvail.rooms_left : activeRoom.totalRooms;
  const isCurrentRoomSoldOut = currentRoomAvail ? roomsLeft <= 0 : false;

  // Check if ALL rooms are sold out for these dates
  const isEntireHotelSoldOut = useMemo(() => {
    if (Object.keys(availability).length === 0) return false;
    return roomTypes.every((rt) => {
      const av = availability[rt.code];
      return av ? av.rooms_left <= 0 : false;
    });
  }, [availability, roomTypes]);

  // Max rooms guest can select (up to rooms_left, max 3)
  const maxRoomsAllowed = Math.min(Math.max(1, roomsLeft), HOTEL_CONFIG.maxRoomsPerBooking);

  // Ensure roomsRequested does not exceed maxRoomsAllowed
  useEffect(() => {
    if (roomsRequested > maxRoomsAllowed) {
      setRoomsRequested(maxRoomsAllowed);
    }
  }, [maxRoomsAllowed, roomsRequested]);

  // Clamp guests whenever activeRoom changes
  useEffect(() => {
    const maxCapacity = activeRoom.maxGuests * roomsRequested;
    if (guests > maxCapacity) {
      setGuests(maxCapacity);
    }
  }, [activeRoom, roomsRequested, guests]);

  // Stay nights calculation
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const timeDiff = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));
  const nights = isNaN(timeDiff) || timeDiff < 1 ? 1 : timeDiff;

  // Price calculations
  const pricePerNight = activeRoom.pricePerNight;
  const subtotal = pricePerNight * nights * roomsRequested;
  const gst = Math.round(subtotal * HOTEL_CONFIG.gstRate);
  const total = subtotal + gst;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Rate limit check
    if (isClientRateLimited()) {
      setErrorMessage("Too many submission attempts. Please wait a few moments before trying again.");
      return;
    }

    // Client validations
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters).");
      return;
    }
    if (name.trim().length > 100) {
      setErrorMessage("Full name must not exceed 100 characters.");
      return;
    }

    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.error || "Please enter a valid 10-digit Indian phone number.");
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address or leave it blank.");
      return;
    }

    if (!checkIn || !checkOut) {
      setErrorMessage("Please select check-in and check-out dates.");
      return;
    }

    if (checkIn < todayStr) {
      setErrorMessage("Check-in date cannot be in the past.");
      return;
    }

    if (checkOut <= checkIn) {
      setErrorMessage("Check-out date must be strictly after the check-in date.");
      return;
    }

    if (nights > HOTEL_CONFIG.maxStayNights) {
      setErrorMessage(`Maximum stay duration is ${HOTEL_CONFIG.maxStayNights} nights.`);
      return;
    }

    if (isCurrentRoomSoldOut) {
      setErrorMessage(`${activeRoom.name} is sold out for these dates. Please select an available suite.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitReservationAction({
        fullName: name.trim(),
        phone: phoneCheck.cleanPhone,
        email: email.trim() || undefined,
        checkIn,
        checkOut,
        roomTypeCode: activeRoom.code,
        guests,
        roomsRequested,
        specialRequest: specialRequests.trim() || undefined,
        honeypot: honeypot.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to confirm reservation request. Please try again.");
        setIsSubmitting(false);
        // Refresh availability in case inventory changed
        refreshAvailability(checkIn, checkOut);
        return;
      }

      // Success confirmed by Supabase!
      const finalRef = res.referenceCode || `FRM-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingRef(finalRef);
      setConfirmedTotal(res.estimatedTotal || total);
      setIsSubmitted(true);
      setIsSubmitting(false);

      // Concierge WhatsApp Trigger
      const message = `*Hotel Fremont - New Reservation Request*%0A%0A*Ref:* ${finalRef}%0A*Guest:* ${encodeURIComponent(
        name.trim()
      )}%0A*Phone:* +91 ${encodeURIComponent(phoneCheck.cleanPhone)}%0A*Suite:* ${encodeURIComponent(
        activeRoom.name
      )}%0A*Rooms:* ${roomsRequested}%0A*Check-In:* ${checkIn}%0A*Check-Out:* ${checkOut}%0A*Nights:* ${nights}%0A*Guests:* ${guests}%0A*Total (incl. 18% GST):* ₹${(
        res.estimatedTotal || total
      ).toLocaleString("en-IN")}`;
      const waUrl = `https://wa.me/${HOTEL_CONFIG.whatsappNumber}?text=${message}`;
      setTimeout(() => {
        window.open(waUrl, "_blank");
      }, 900);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to connect to reservation database. Please check your network.");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop with blur & dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0E0E10]/90 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-[#151518] border border-[#C9A96E]/30 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-6 sm:p-8 z-10 my-auto text-[#F7F3EC]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0E0E10] text-[#F7F3EC] hover:text-[#E02B1D] border border-white/10 transition-colors cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSubmitted ? (
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold mb-2">
                <Sparkles className="w-3 h-3 text-[#E02B1D]" />
                <span>HOTEL FREMONT DIRECT RESERVATIONS · 12 KEYS</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC] mb-2">
                Book Your Luxury Experience
              </h3>

              <p className="text-xs text-[#A8A59E] mb-5 font-light">
                Direct booking privileges: guaranteed lowest rates, airport drop, priority check-in, and instant WhatsApp concierge support.
              </p>

              {/* Entire Hotel Sold Out Warning Banner */}
              {isEntireHotelSoldOut && (
                <div className="mb-5 p-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>All 12 Suites Sold Out for Selected Dates</span>
                  </div>
                  <p className="text-[11px] text-red-200/90 leading-relaxed">
                    Hotel Fremont is fully booked for these dates. For cancellations or emergency VIP requests, please contact our Front Desk directly:
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <a
                      href={`tel:${HOTEL_CONFIG.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px]"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{HOTEL_CONFIG.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${HOTEL_CONFIG.whatsappNumber}?text=Enquiring%20about%20sold-out%20dates%20${checkIn}%20to%20${checkOut}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-mono text-[11px]"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp Duty Manager</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot spam field */}
                <div style={{ display: "none" }} aria-hidden="true">
                  <input
                    type="text"
                    name="b_hp_company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Check-In Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={checkIn}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCheckIn(val);
                        setErrorMessage(null);
                        // Auto-adjust checkout if it's on or before new checkin
                        if (checkOut <= val) {
                          const nextD = new Date(val);
                          nextD.setDate(nextD.getDate() + 1);
                          setCheckOut(nextD.toISOString().slice(0, 10));
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Check-Out Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={checkIn || todayStr}
                      value={checkOut}
                      onChange={(e) => {
                        setCheckOut(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Suite Selection & Availability Indicator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] font-semibold">
                      Select Suite Category *
                    </label>
                    {isLoadingAvailability && (
                      <span className="text-[10px] text-[#A8A59E] flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        <span>Checking availability...</span>
                      </span>
                    )}
                  </div>

                  <select
                    value={selectedCode}
                    onChange={(e) => {
                      setSelectedCode(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  >
                    {roomTypes.map((rt) => {
                      const av = availability[rt.code];
                      const left = av ? av.rooms_left : rt.totalRooms;
                      const isSoldOut = av ? left <= 0 : false;

                      return (
                        <option key={rt.code} value={rt.code} disabled={isSoldOut}>
                          {rt.name} — {formatINR(rt.pricePerNight)}/night
                          {isSoldOut ? " (Sold out for these dates)" : ` (${left} of ${rt.totalRooms} available)`}
                        </option>
                      );
                    })}
                  </select>

                  {/* Availability Badge */}
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <DoorClosed className="w-3.5 h-3.5 text-[#C9A96E]" />
                      {currentRoomAvail ? (
                        roomsLeft > 0 ? (
                          <span className={roomsLeft <= 2 ? "text-amber-400 font-medium" : "text-emerald-400 font-medium"}>
                            {roomsLeft} of {activeRoom.totalRooms} rooms available for your dates
                            {roomsLeft <= 2 && " · High demand"}
                          </span>
                        ) : (
                          <span className="text-[#E02B1D] font-bold">
                            Sold out for these dates
                          </span>
                        )
                      ) : (
                        <span className="text-[#A8A59E]">
                          {activeRoom.totalRooms} total rooms in this category
                        </span>
                      )}
                    </div>
                    <span className="text-[#A8A59E] text-[10px]">
                      Accommodates up to {activeRoom.maxGuests} guests/room
                    </span>
                  </div>
                </div>

                {/* Rooms Requested & Guests Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Number of Rooms *
                    </label>
                    <select
                      value={roomsRequested}
                      disabled={isCurrentRoomSoldOut}
                      onChange={(e) => setRoomsRequested(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none disabled:opacity-50"
                    >
                      {Array.from({ length: Math.max(1, maxRoomsAllowed) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "Room" : "Rooms"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Total Guests *
                    </label>
                    <select
                      value={guests}
                      disabled={isCurrentRoomSoldOut}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none disabled:opacity-50"
                    >
                      {Array.from(
                        { length: activeRoom.maxGuests * roomsRequested },
                        (_, i) => i + 1
                      ).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Guest" : "Guests"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Guest Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      maxLength={100}
                      placeholder="e.g. Aakash Sharma"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      10-Digit Mobile / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="tel"
                      autoComplete="tel"
                      required
                      maxLength={14}
                      placeholder="98727 68514"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Email Address (For Booking Voucher)
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    maxLength={100}
                    placeholder="guest@domain.com (optional)"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Special Inquiries & Airport Transfer Request
                  </label>
                  <input
                    type="text"
                    maxLength={500}
                    placeholder="e.g. Flight arrival time, high floor room, extra pillow"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                {/* Transparent Price Summary Box */}
                <div className="p-4 rounded-xl bg-[#0E0E10] border border-[#C9A96E]/20 text-xs space-y-1.5">
                  <div className="flex justify-between text-[#A8A59E]">
                    <span>
                      {activeRoom.name} &times; {nights} {nights > 1 ? "Nights" : "Night"}
                      {roomsRequested > 1 ? ` (${roomsRequested} Rooms)` : ""}
                    </span>
                    <span className="text-[#F7F3EC] font-mono">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#A8A59E]">
                    <span>Luxury GST ({HOTEL_CONFIG.gstPercentageLabel})</span>
                    <span className="text-[#F7F3EC] font-mono">{formatINR(gst)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#F7F3EC] pt-2 border-t border-white/10">
                    <span className="font-serif">Estimated Total</span>
                    <span className="font-serif text-[#E02B1D] font-mono text-base">
                      {formatINR(total)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isCurrentRoomSoldOut || isEntireHotelSoldOut}
                  className="w-full py-4 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-[0.22em] shadow-[0_4px_25px_rgba(224,43,29,0.5)] transition-all duration-300 btn-magnetic flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming with Inventory Engine...</span>
                    </>
                  ) : isCurrentRoomSoldOut ? (
                    <span>Suite Sold Out For Selected Dates</span>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Submit Reservation Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Confirmation Success Screen */
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#E02B1D]/20 border border-[#E02B1D] mx-auto flex items-center justify-center text-[#E02B1D]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#C9A96E] font-semibold">
                  RESERVATION REQUEST REGISTERED
                </span>
                <h4 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC] mt-1 font-mono">
                  {bookingRef}
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-[#0E0E10] border border-white/10 max-w-md mx-auto text-xs text-[#A8A59E] space-y-2 text-left">
                <div className="flex justify-between">
                  <span>Guest Name:</span>
                  <strong className="text-white">{name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Contact Mobile:</span>
                  <strong className="text-white">+91 {phone.replace(/\D/g, "").slice(-10)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Suite Category:</span>
                  <strong className="text-white">{activeRoom.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Rooms Requested:</span>
                  <strong className="text-white">{roomsRequested} {roomsRequested === 1 ? "Room" : "Rooms"}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Stay Duration:</span>
                  <strong className="text-white">
                    {checkIn} to {checkOut} ({nights} Nights)
                  </strong>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span>Estimated Total (incl. 18% GST):</span>
                  <strong className="text-[#E02B1D] text-sm font-mono">{formatINR(confirmedTotal || total)}</strong>
                </div>
              </div>

              <p className="text-xs text-[#A8A59E] max-w-sm mx-auto font-light leading-relaxed">
                Request received. Your reference is <strong className="text-white font-mono">{bookingRef}</strong>. We will confirm on WhatsApp shortly.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={`https://wa.me/${HOTEL_CONFIG.whatsappNumber}?text=Hi%20Concierge,%20regarding%20my%20reservation%20${bookingRef}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs uppercase tracking-wider font-bold shadow flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open WhatsApp Concierge</span>
                </a>

                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs uppercase tracking-wider text-white transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
