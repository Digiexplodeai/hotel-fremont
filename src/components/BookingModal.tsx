"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertCircle,
  Loader2,
  Phone,
  DoorClosed,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HOTEL_CONFIG, RoomTypeConfig, DEFAULT_ROOM_TYPES, validateIndianPhone, formatINR } from "@/config/hotel";
import { getRoomTypesAction, getRoomAvailabilityAction, RoomAvailabilityResult } from "@/actions/roomTypes";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { calculateServerBookingPrice } from "@/lib/payment-config";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
    guests?: number;
    mealPlan?: string;
  };
}

function isClientRateLimited(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = "hf_booking_attempts";
    const now = Date.now();
    const raw = sessionStorage.getItem(key);
    let attempts: number[] = raw ? JSON.parse(raw) : [];
    attempts = attempts.filter((t) => now - t < 10 * 60 * 1000);
    if (attempts.length >= 8) return true;
    attempts.push(now);
    sessionStorage.setItem(key, JSON.stringify(attempts));
    return false;
  } catch {
    return false;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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
  const [selectedCode, setSelectedCode] = useState<string>("deluxe-room");
  const [mealPlan, setMealPlan] = useState<"without_breakfast" | "with_breakfast">("without_breakfast");
  const [occupancy, setOccupancy] = useState<"double" | "single">("double");
  const [roomsRequested, setRoomsRequested] = useState<number>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  // Live Inventory State
  const [availability, setAvailability] = useState<Record<string, RoomAvailabilityResult>>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch live Room Types on mount / initialData change
  useEffect(() => {
    let isMounted = true;
    async function loadRooms() {
      const res = await getRoomTypesAction();
      if (isMounted && res.success && res.roomTypes.length > 0) {
        setRoomTypes(res.roomTypes);
        if (initialData?.roomType) {
          const match = res.roomTypes.find(
            (rt) =>
              rt.code === initialData.roomType ||
              rt.slug === initialData.roomType ||
              rt.name.toLowerCase() === initialData.roomType?.toLowerCase()
          );
          if (match) setSelectedCode(match.code);
        } else if (!res.roomTypes.some((rt) => rt.code === selectedCode)) {
          setSelectedCode(res.roomTypes[0].code);
        }
      }
    }
    loadRooms();
    return () => {
      isMounted = false;
    };
  }, [initialData]);

  // 2. Fetch Live Availability when checkIn or checkOut change
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
    } catch {
      // Fallback
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
      lockScroll();
      setErrorMessage(null);
    } else {
      unlockScroll();
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlockScroll();
    };
  }, [isOpen, onClose]);

  // Active Room Config
  const activeRoom = useMemo(() => {
    return roomTypes.find((r) => r.code === selectedCode) || roomTypes[0] || DEFAULT_ROOM_TYPES[0];
  }, [roomTypes, selectedCode]);

  // Nights calculation
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  // Live Inventory Metrics for active room
  const currentRoomAvail = availability[activeRoom.code];
  const roomsLeft = currentRoomAvail !== undefined ? currentRoomAvail.rooms_left : (activeRoom.roomsTotal || activeRoom.totalRooms || 1);
  const isCurrentRoomSoldOut = roomsLeft <= 0;
  const isEntireHotelSoldOut = Object.values(availability).length > 0 && Object.values(availability).every((a) => a.rooms_left <= 0);

  const categoryTotal = activeRoom.roomsTotal || activeRoom.totalRooms || 1;
  const maxRoomsAllowed = Math.min(roomsLeft > 0 ? roomsLeft : 1, categoryTotal);

  useEffect(() => {
    if (roomsRequested > maxRoomsAllowed && maxRoomsAllowed > 0) {
      setRoomsRequested(maxRoomsAllowed);
    }
  }, [roomsLeft, roomsRequested, maxRoomsAllowed]);

  // Pricing calculation
  const priceBreakdown = useMemo(() => {
    return calculateServerBookingPrice(
      activeRoom.code,
      checkIn,
      checkOut,
      roomsRequested,
      mealPlan,
      occupancy,
      roomTypes
    );
  }, [activeRoom.code, checkIn, checkOut, roomsRequested, mealPlan, occupancy, roomTypes]);

  const totalGuests = roomsRequested * (occupancy === "single" ? 1 : 2);

  // Submit Handler -> Razorpay standard checkout
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (honeypot) return;

    if (isClientRateLimited()) {
      setErrorMessage("Too many booking attempts. Please wait a few minutes or call reception directly.");
      return;
    }

    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.error || "Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address to receive your confirmation voucher.");
      return;
    }

    if (!agreedToPolicy) {
      setErrorMessage("Please accept the terms, conditions, and 24-hour cancellation policy to proceed.");
      return;
    }

    if (checkOut <= checkIn) {
      setErrorMessage("Check-out date must be after check-in date.");
      return;
    }

    if (nights > HOTEL_CONFIG.maxStayNights) {
      setErrorMessage(`Maximum stay duration is ${HOTEL_CONFIG.maxStayNights} nights.`);
      return;
    }

    if (isCurrentRoomSoldOut) {
      setErrorMessage(`${activeRoom.name} is sold out for these dates. Please choose another room category.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !(window as any).Razorpay) {
        setErrorMessage("Unable to load secure payment checkout. Please check your internet connection.");
        setIsSubmitting(false);
        return;
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name.trim(),
          phone: phoneCheck.cleanPhone,
          email: email.trim().toLowerCase(),
          roomCategory: activeRoom.code,
          checkIn,
          checkOut,
          roomsRequested,
          guests: totalGuests,
          mealPlan,
          occupancy,
          specialRequests: specialRequests.trim() || undefined,
          agreedToPolicy: true,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        setErrorMessage(orderData.error || "Failed to initiate payment. Please check availability and try again.");
        setIsSubmitting(false);
        refreshAvailability(checkIn, checkOut);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency || "INR",
        name: "Hotel Fremont",
        description: `${activeRoom.name} (${nights} Night${nights > 1 ? "s" : ""})`,
        image: "/icon.png",
        order_id: orderData.orderId,
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: phoneCheck.cleanPhone,
        },
        notes: {
          bookingRef: orderData.bookingRef,
          room: activeRoom.name,
          mealPlan,
          occupancy,
        },
        theme: {
          color: "#742B40",
          backdrop_color: "#F8F6F2",
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setErrorMessage("Payment was cancelled or interrupted. You can resume checkout anytime.");
          },
        },
        handler: async (response: any) => {
          try {
            setIsSubmitting(true);
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_ref: orderData.bookingRef,
                access_token: orderData.accessToken,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              window.location.href = `/booking-confirmation/${orderData.bookingRef}?t=${orderData.accessToken}`;
            } else {
              setErrorMessage(
                verifyData.error ||
                  "Payment received, but server verification took longer than usual. Please check your email for confirmation."
              );
              setIsSubmitting(false);
            }
          } catch {
            window.location.href = `/booking-confirmation/${orderData.bookingRef}?t=${orderData.accessToken}`;
          }
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", (failRes: any) => {
        setIsSubmitting(false);
        const reason =
          failRes.error?.description ||
          "Payment failed. Please choose another payment method or try again.";
        setErrorMessage(reason);
      });

      rzpInstance.open();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to initialize payment gateway. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-white border border-[#E5DFD7] rounded-2xl shadow-[0_25px_80px_rgba(36,39,43,0.2)] p-6 sm:p-8 z-10 my-auto text-[#24272B]"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#F8F6F2] text-[#24272B] hover:text-[#742B40] hover:bg-[#EEE8DF] border border-[#E5DFD7] transition-colors cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <div className="inline-flex items-center space-x-1.5 text-[10px] font-sans tracking-[0.25em] text-[#742B40] uppercase font-bold mb-2">
              <Sparkles className="w-3 h-3 text-[#742B40]" />
              <span>HOTEL FREMONT · AIRPORT ROAD, MOHALI</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#24272B] mb-2">
              Book Your Stay
            </h3>

            <p className="text-xs text-[#64615D] mb-5 font-normal">
              Direct booking with transparent rates, 24-hour reception assistance, and instant booking confirmation.
            </p>

            {isEntireHotelSoldOut && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-900">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>All Rooms Sold Out for Selected Dates</span>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Hotel Fremont is fully booked for these dates. For queries or future bookings, please contact our front desk:
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href={`tel:${HOTEL_CONFIG.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-mono text-[11px]"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{HOTEL_CONFIG.phone}</span>
                  </a>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                    Check-In Date * (1:00 PM)
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
                      if (checkOut <= val) {
                        const nextD = new Date(val);
                        nextD.setDate(nextD.getDate() + 1);
                        setCheckOut(nextD.toISOString().slice(0, 10));
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none [color-scheme:light]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                    Check-Out Date * (11:00 AM)
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
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none [color-scheme:light]"
                  />
                </div>
              </div>

              {/* Room Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] font-semibold">
                    Room Category *
                  </label>
                  {isLoadingAvailability && (
                    <span className="text-[10px] text-[#64615D] flex items-center gap-1">
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
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none cursor-pointer"
                >
                  {roomTypes.map((rt) => {
                    const av = availability[rt.code];
                    const left = av ? av.rooms_left : (rt.roomsTotal || rt.totalRooms || 1);
                    const isSoldOut = av ? left <= 0 : false;
                    const displayTotal = rt.roomsTotal || rt.totalRooms || 1;

                    return (
                      <option key={rt.code} value={rt.code} disabled={isSoldOut}>
                        {rt.name} — From {formatINR(rt.rateEpSingle || rt.pricePerNight)} + taxes
                        {isSoldOut ? " (Sold out)" : ` (${left} of ${displayTotal} available)`}
                      </option>
                    );
                  })}
                </select>

                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <DoorClosed className="w-3.5 h-3.5 text-[#742B40]" />
                    {currentRoomAvail ? (
                      roomsLeft > 0 ? (
                        <span className={roomsLeft <= 2 ? "text-amber-700 font-medium" : "text-emerald-700 font-medium"}>
                          {roomsLeft} of {categoryTotal} rooms available for selected dates
                        </span>
                      ) : (
                        <span className="text-[#742B40] font-bold">Sold out for these dates</span>
                      )
                    ) : (
                      <span className="text-[#64615D]">{categoryTotal} total rooms in this category</span>
                    )}
                  </div>
                  <span className="text-[#64615D] text-[10px]">
                    {activeRoom.sizeSqft ? `${activeRoom.sizeSqft} sq ft · ` : ""}Max 2 guests/room
                  </span>
                </div>
              </div>

              {/* Meal Plan & Occupancy Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                    Meal Plan *
                  </label>
                  <select
                    value={mealPlan}
                    onChange={(e) => setMealPlan(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none cursor-pointer"
                  >
                    <option value="without_breakfast">Without Breakfast (Room Only)</option>
                    <option value="with_breakfast">With Breakfast (Buffet Included)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                    Occupancy *
                  </label>
                  <select
                    value={occupancy}
                    onChange={(e) => setOccupancy(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none cursor-pointer"
                  >
                    <option value="double">Double Occupancy (2 Guests / room)</option>
                    <option value="single">Single Occupancy (1 Guest / room)</option>
                  </select>
                </div>
              </div>

              {/* Number of Rooms */}
              <div>
                <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                  Number of Rooms *
                </label>
                <select
                  value={roomsRequested}
                  disabled={isCurrentRoomSoldOut || maxRoomsAllowed <= 0}
                  onChange={(e) => setRoomsRequested(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none disabled:opacity-50 cursor-pointer"
                >
                  {maxRoomsAllowed > 0 ? (
                    Array.from({ length: maxRoomsAllowed }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Room" : "Rooms"} ({n * (occupancy === "single" ? 1 : 2)} Guests total)
                      </option>
                    ))
                  ) : (
                    <option value={1} disabled>
                      0 Rooms Available (Sold Out)
                    </option>
                  )}
                </select>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Gurpreet Singh"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                    10-Digit Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={14}
                    placeholder="79734 50281"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                  Email Address (For Instant Booking Voucher) *
                </label>
                <input
                  type="email"
                  required
                  maxLength={100}
                  placeholder="guest@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans uppercase tracking-wider text-[#64615D] mb-1 font-semibold">
                  Special Requests (Optional)
                </label>
                <input
                  type="text"
                  maxLength={300}
                  placeholder="e.g. Quiet room, approximate arrival time"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs text-[#24272B] focus:border-[#742B40] focus:outline-none"
                />
              </div>

              {/* Transparent Price Summary Box */}
              <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-xs space-y-2">
                <div className="flex justify-between text-[#64615D]">
                  <span>
                    {activeRoom.name} ({formatINR(priceBreakdown.ratePerNight)}/night) &times; {nights} {nights > 1 ? "Nights" : "Night"}
                    {roomsRequested > 1 ? ` &times; ${roomsRequested} Rooms` : ""}
                  </span>
                  <span className="text-[#24272B] font-mono font-semibold">{formatINR(priceBreakdown.baseAmount)}</span>
                </div>
                <div className="flex justify-between text-[#64615D]">
                  <span>
                    GST ({priceBreakdown.gstPercent}%)
                    <span className="text-[10px] text-[#64615D]/80 block">
                      {priceBreakdown.ratePerNight <= 7500 ? "5% GST (Tariff up to ₹7,500/night)" : "18% GST (Tariff above ₹7,500/night)"}
                    </span>
                  </span>
                  <span className="text-[#24272B] font-mono font-semibold">{formatINR(priceBreakdown.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#24272B] pt-2 border-t border-[#E5DFD7] items-baseline">
                  <div>
                    <span className="font-serif block">Total Payable Now</span>
                    <span className="text-[10px] text-emerald-700 font-sans font-normal">
                      100% Full Payment via Razorpay · No balance at hotel
                    </span>
                  </div>
                  <span className="font-serif text-[#742B40] font-mono text-base font-bold">
                    {formatINR(priceBreakdown.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Policy Agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-[#64615D] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToPolicy}
                    onChange={(e) => {
                      setAgreedToPolicy(e.target.checked);
                      setErrorMessage(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-[#E5DFD7] bg-[#F8F6F2] text-[#742B40] focus:ring-[#742B40] accent-[#742B40] shrink-0 cursor-pointer"
                  />
                  <span className="leading-snug">
                    I agree to the{" "}
                    <a href="/terms-and-conditions" target="_blank" className="text-[#742B40] font-semibold hover:underline">
                      Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a href="/cancellation-refund-policy" target="_blank" className="text-[#742B40] font-semibold hover:underline">
                      24-Hour Cancellation Policy
                    </a>
                    . (Full refund if cancelled 24+ hours before check-in; valid photo ID required at arrival).
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || isCurrentRoomSoldOut || isEntireHotelSoldOut}
                  className="w-full py-4 rounded-xl bg-[#742B40] hover:bg-[#5C2033] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-[0.16em] shadow-[0_4px_25px_rgba(116,43,64,0.35)] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Secure Payment Gateway...</span>
                    </>
                  ) : isCurrentRoomSoldOut ? (
                    <span>Room Sold Out For Selected Dates</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>Pay {formatINR(priceBreakdown.totalAmount)} & Confirm</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-[#64615D] pt-1">
                  Check-in: 1:00 PM · Check-out: 11:00 AM · 24-hour reception assistance
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
