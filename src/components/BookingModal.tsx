"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  BedDouble,
  Users,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Phone,
  DoorClosed,
  Coffee,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Utensils,
  CreditCard,
  Maximize2,
} from "lucide-react";
import { HOTEL_CONFIG, RoomTypeConfig, DEFAULT_ROOM_TYPES, validateIndianPhone, formatINR } from "@/config/hotel";
import { getRoomTypesAction, getRoomAvailabilityAction, RoomAvailabilityResult } from "@/actions/roomTypes";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { calculateServerBookingPrice, PAYMENT_CONFIG, MealPlan, Occupancy } from "@/lib/payment-config";

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

  // 3-Step Wizard Navigation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // STEP 1 State: Dates & Room Category
  const [checkIn, setCheckIn] = useState(initialData?.checkIn || getFormattedDate(1));
  const [checkOut, setCheckOut] = useState(initialData?.checkOut || getFormattedDate(3));
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>(DEFAULT_ROOM_TYPES);
  const [selectedCode, setSelectedCode] = useState<string>("deluxe-room");

  // STEP 2 State: Guests, Rooms & Breakfast
  const [roomsRequested, setRoomsRequested] = useState<number>(1);
  const [mealPlan, setMealPlan] = useState<"without_breakfast" | "with_breakfast">("without_breakfast");
  const [occupancy, setOccupancy] = useState<"double" | "single">("double");
  const [isPerRoomConfig, setIsPerRoomConfig] = useState(false);
  const [perRoomOccupancies, setPerRoomOccupancies] = useState<("single" | "double")[]>(["double"]);

  // STEP 3 State: Guest Details & Policies
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

  // Handle Initial Data overrides
  useEffect(() => {
    if (initialData?.checkIn) setCheckIn(initialData.checkIn);
    if (initialData?.checkOut) setCheckOut(initialData.checkOut);
    if (initialData?.mealPlan) {
      if (initialData.mealPlan === "with_breakfast" || initialData.mealPlan === "cp") {
        setMealPlan("with_breakfast");
      } else {
        setMealPlan("without_breakfast");
      }
    }
    if (initialData?.guests) {
      setOccupancy(initialData.guests === 1 ? "single" : "double");
    }
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
    } finally {
      setIsLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshAvailability(checkIn, checkOut);
    }
  }, [isOpen, checkIn, checkOut, refreshAvailability]);

  // Handle ESC key and scroll locking
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

  // Active Room Configuration
  const activeRoom = useMemo(() => {
    return roomTypes.find((r) => r.code === selectedCode) || roomTypes[0] || DEFAULT_ROOM_TYPES[0];
  }, [roomTypes, selectedCode]);

  // Inventory limits for active room
  const currentRoomAvail = availability[activeRoom.code];
  const categoryTotal = activeRoom.roomsTotal || activeRoom.totalRooms || 21;
  const roomsLeft = currentRoomAvail !== undefined ? currentRoomAvail.rooms_left : categoryTotal;
  const isCurrentRoomSoldOut = currentRoomAvail ? roomsLeft <= 0 : false;

  const isEntireHotelSoldOut = useMemo(() => {
    if (Object.keys(availability).length === 0) return false;
    return roomTypes.every((rt) => {
      const av = availability[rt.code];
      return av ? av.rooms_left <= 0 : false;
    });
  }, [availability, roomTypes]);

  const maxRoomsAllowed = Math.max(1, roomsLeft > 0 ? roomsLeft : 1);

  // Sync roomsRequested and perRoomOccupancies when roomsLeft or roomsRequested changes
  useEffect(() => {
    if (roomsLeft > 0 && roomsRequested > roomsLeft) {
      setRoomsRequested(roomsLeft);
    }
  }, [roomsLeft, roomsRequested]);

  useEffect(() => {
    setPerRoomOccupancies((prev) => {
      const updated: ("single" | "double")[] = [];
      for (let i = 0; i < roomsRequested; i++) {
        updated.push(prev[i] || occupancy);
      }
      return updated;
    });
  }, [roomsRequested, occupancy]);

  // Stay calculation
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const timeDiff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return isNaN(timeDiff) || timeDiff < 1 ? 1 : timeDiff;
  }, [checkIn, checkOut]);

  // Effective Occupancies list
  const activeOccupanciesList = useMemo(() => {
    if (!isPerRoomConfig || roomsRequested === 1) {
      return Array(roomsRequested).fill(occupancy);
    }
    return perRoomOccupancies.slice(0, roomsRequested);
  }, [isPerRoomConfig, roomsRequested, occupancy, perRoomOccupancies]);

  // Server-side authoritative price calculation
  const priceBreakdown = useMemo(() => {
    return calculateServerBookingPrice(
      activeRoom.code,
      checkIn,
      checkOut,
      roomsRequested,
      mealPlan,
      occupancy,
      roomTypes,
      activeOccupanciesList
    );
  }, [activeRoom.code, checkIn, checkOut, roomsRequested, mealPlan, occupancy, roomTypes, activeOccupanciesList]);

  // Total Guests Count
  const totalGuests = useMemo(() => {
    return activeOccupanciesList.reduce((acc, occ) => acc + (occ === "single" ? 1 : 2), 0);
  }, [activeOccupanciesList]);

  // Formatted date string for summary
  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr + "T00:00:00");
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dStr;
    }
  };

  // Step 1 Validation & Next Handler
  const handleProceedToStep2 = () => {
    setErrorMessage(null);
    if (!checkIn || !checkOut) {
      setErrorMessage("Please select valid check-in and check-out dates.");
      return;
    }
    if (checkIn < todayStr) {
      setErrorMessage("Check-in date cannot be in the past.");
      return;
    }
    if (checkOut <= checkIn) {
      setErrorMessage("Check-out date must be at least 1 day after check-in.");
      return;
    }
    if (nights > HOTEL_CONFIG.maxStayNights) {
      setErrorMessage(`Maximum stay duration is ${HOTEL_CONFIG.maxStayNights} nights.`);
      return;
    }
    if (isCurrentRoomSoldOut) {
      setErrorMessage(`${activeRoom.name} is fully booked for selected dates. Please choose another category.`);
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation & Next Handler
  const handleProceedToStep3 = () => {
    setErrorMessage(null);
    if (roomsRequested > (roomsLeft > 0 ? roomsLeft : categoryTotal)) {
      setErrorMessage(`Only ${roomsLeft} ${activeRoom.name}(s) available for your dates.`);
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 Razorpay Payment Submission Handler
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (honeypot) return;

    if (isClientRateLimited()) {
      setErrorMessage("Too many submission attempts. Please wait a moment before trying again.");
      return;
    }

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
      setErrorMessage(phoneCheck.error || "Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address for your booking confirmation voucher.");
      return;
    }

    if (!agreedToPolicy) {
      setErrorMessage("Please accept the Terms & Conditions and 24-Hour Cancellation Policy to proceed.");
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
          roomOccupancies: isPerRoomConfig ? activeOccupanciesList : undefined,
          specialRequests: specialRequests.trim() || undefined,
          agreedToPolicy: true,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        setErrorMessage(orderData.error || "Failed to initialize booking payment. Please review dates and try again.");
        setIsSubmitting(false);
        refreshAvailability(checkIn, checkOut);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency || "INR",
        name: "Hotel Fremont",
        description: `${activeRoom.name} · ${nights} Night${nights > 1 ? "s" : ""} · ${roomsRequested} Room${roomsRequested > 1 ? "s" : ""}`,
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
          color: "#E02B1D",
          backdrop_color: "#0E0E10",
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setErrorMessage("Payment was interrupted. You can resume checkout anytime.");
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
                  "Payment received, but confirmation sync took longer than usual. Please check your email inbox."
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
          "Payment was declined or failed. Please try another card, UPI, or net banking.";
        setErrorMessage(reason);
      });

      rzpInstance.open();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to initialize payment gateway. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0E0E10]/90 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-[#151518] border border-white/10 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-5 sm:p-8 z-10 my-auto text-[#F7F3EC] max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0E0E10] text-[#F7F3EC] hover:text-[#E02B1D] border border-white/10 transition-colors cursor-pointer z-20"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="shrink-0 mb-4 pr-10">
            <div className="inline-flex items-center space-x-1.5 text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold mb-1">
              <Sparkles className="w-3 h-3 text-[#E02B1D]" />
              <span>HOTEL FREMONT · AIRPORT ROAD, MOHALI</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC]">
              Book Your Stay
            </h3>
            <p className="text-xs text-[#A8A59E] font-light mt-0.5">
              Official rates · Instant Razorpay confirmation · 24-hr front desk support
            </p>
          </div>

          {/* 3-Step Progress Indicator */}
          <div className="shrink-0 mb-5 pb-4 border-b border-white/10">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`flex items-center gap-2 p-2 rounded-xl transition text-left cursor-pointer ${
                  currentStep === 1
                    ? "bg-[#E02B1D]/15 border border-[#E02B1D] text-white"
                    : currentStep > 1
                    ? "bg-white/5 border border-white/10 text-emerald-400 hover:bg-white/10"
                    : "bg-white/[0.02] border border-white/5 text-[#A8A59E]"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    currentStep === 1
                      ? "bg-[#E02B1D] text-white"
                      : currentStep > 1
                      ? "bg-emerald-500 text-black"
                      : "bg-white/10 text-[#A8A59E]"
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "1"}
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-[10px] uppercase tracking-wider block opacity-70">Step 1</span>
                  <span className="font-semibold text-xs truncate block">Dates &amp; Room</span>
                </div>
              </button>

              {/* Step 2 Pill */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 2 || (checkIn && checkOut && checkOut > checkIn && !isCurrentRoomSoldOut)) {
                    setCurrentStep(2);
                  }
                }}
                className={`flex items-center gap-2 p-2 rounded-xl transition text-left ${
                  currentStep === 2
                    ? "bg-[#E02B1D]/15 border border-[#E02B1D] text-white"
                    : currentStep > 2
                    ? "bg-white/5 border border-white/10 text-emerald-400 hover:bg-white/10 cursor-pointer"
                    : "bg-white/[0.02] border border-white/5 text-[#A8A59E] opacity-60 cursor-default"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    currentStep === 2
                      ? "bg-[#E02B1D] text-white"
                      : currentStep > 2
                      ? "bg-emerald-500 text-black"
                      : "bg-white/10 text-[#A8A59E]"
                  }`}
                >
                  {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-[10px] uppercase tracking-wider block opacity-70">Step 2</span>
                  <span className="font-semibold text-xs truncate block">Guests &amp; Meals</span>
                </div>
              </button>

              {/* Step 3 Pill */}
              <div
                className={`flex items-center gap-2 p-2 rounded-xl text-left ${
                  currentStep === 3
                    ? "bg-[#E02B1D]/15 border border-[#E02B1D] text-white"
                    : "bg-white/[0.02] border border-white/5 text-[#A8A59E] opacity-60"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    currentStep === 3
                      ? "bg-[#E02B1D] text-white"
                      : "bg-white/10 text-[#A8A59E]"
                  }`}
                >
                  3
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-[10px] uppercase tracking-wider block opacity-70">Step 3</span>
                  <span className="font-semibold text-xs truncate block">Details &amp; Pay</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback & Error Toast */}
          {errorMessage && (
            <div className="shrink-0 mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-300 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Entire Hotel Sold Out Warning */}
          {isEntireHotelSoldOut && (
            <div className="shrink-0 mb-4 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>All 21 Rooms Sold Out for Selected Dates</span>
              </div>
              <p className="text-[11px] text-red-200/90 leading-relaxed">
                Hotel Fremont is fully booked for these dates. For offline bookings or upcoming queries, call reception:
              </p>
              <a
                href={`tel:${HOTEL_CONFIG.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px]"
              >
                <Phone className="w-3 h-3" />
                <span>{HOTEL_CONFIG.phone}</span>
              </a>
            </div>
          )}

          {/* Scrollable Step Content Body */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {/* ================= STEP 1: SELECT YOUR STAY ================= */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Stay Dates Card */}
                <div className="p-4 rounded-xl bg-[#0E0E10]/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#E02B1D]" />
                      <span>Select Stay Dates</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E02B1D]/20 text-[#E02B1D] border border-[#E02B1D]/30 text-[11px] font-bold font-mono">
                      {nights} Night{nights > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Check-In */}
                    <div>
                      <label className="block text-[10px] text-[#A8A59E] uppercase tracking-wider mb-1">
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
                        className="w-full px-3 py-2.5 rounded-xl bg-[#151518] border border-white/10 text-xs font-medium text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none [color-scheme:dark] cursor-pointer"
                      />
                    </div>

                    {/* Check-Out */}
                    <div>
                      <label className="block text-[10px] text-[#A8A59E] uppercase tracking-wider mb-1">
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
                        className="w-full px-3 py-2.5 rounded-xl bg-[#151518] border border-white/10 text-xs font-medium text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none [color-scheme:dark] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-[#A8A59E] flex items-center justify-between pt-1">
                    <span>Check-in: 1:00 PM onwards</span>
                    <span>Check-out: 11:00 AM</span>
                  </div>
                </div>

                {/* Room Category Selection Cards */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] font-semibold">
                      Select Room Category *
                    </label>
                    {isLoadingAvailability && (
                      <span className="text-[10px] text-[#A8A59E] flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-[#C9A96E]" />
                        <span>Verifying live inventory...</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {roomTypes.map((rt) => {
                      const av = availability[rt.code];
                      const totalKeys = rt.roomsTotal || rt.totalRooms || (rt.code === "deluxe-room" ? 9 : rt.code === "super-deluxe-room" ? 10 : 2);
                      const left = av ? av.rooms_left : totalKeys;
                      const isSoldOut = av ? left <= 0 : false;
                      const isSelected = selectedCode === rt.code;
                      const startingRate = rt.rateEpSingle || rt.pricePerNight || (rt.code === "deluxe-room" ? 2299 : rt.code === "super-deluxe-room" ? 3299 : 4299);

                      return (
                        <div
                          key={rt.code}
                          onClick={() => {
                            if (!isSoldOut) {
                              setSelectedCode(rt.code);
                              setErrorMessage(null);
                            }
                          }}
                          className={`relative p-3.5 rounded-xl border transition text-left flex flex-col justify-between ${
                            isSelected
                              ? "bg-[#E02B1D]/10 border-[#E02B1D] shadow-[0_0_20px_rgba(224,43,29,0.25)]"
                              : isSoldOut
                              ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                              : "bg-[#0E0E10] border-white/10 hover:border-[#C9A96E]/50 cursor-pointer"
                          }`}
                        >
                          <div>
                            {/* Selected Badge */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-serif font-bold text-sm text-[#F7F3EC]">
                                {rt.name}
                              </span>
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                  isSelected
                                    ? "bg-[#E02B1D] border-[#E02B1D] text-white"
                                    : "border-white/20"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>

                            {/* Size & Bed Spec */}
                            <div className="text-[11px] text-[#A8A59E] flex items-center gap-2 mb-2 font-light">
                              <span className="flex items-center gap-1">
                                <Maximize2 className="w-3 h-3 text-[#C9A96E]" />
                                {rt.sizeSqft || (rt.code === "deluxe-room" ? 160 : rt.code === "super-deluxe-room" ? 250 : 365)} sq. ft.
                              </span>
                              <span>·</span>
                              <span>Max 2 Guests</span>
                            </div>

                            {/* Tag / Badge */}
                            {rt.badge && (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[#C9A96E]/15 text-[#C9A96E] text-[9px] font-semibold mb-2">
                                {rt.badge}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 border-t border-white/5 mt-2">
                            {/* Price */}
                            <div className="text-xs">
                              <span className="text-[10px] text-[#A8A59E] block">From</span>
                              <span className="font-serif font-bold text-[#E02B1D] text-sm">
                                {formatINR(startingRate)}
                              </span>
                              <span className="text-[10px] text-[#A8A59E]"> / night + taxes</span>
                            </div>

                            {/* Live Availability */}
                            <div className="mt-1.5 text-[10px] font-medium">
                              {isSoldOut ? (
                                <span className="text-red-400 font-bold flex items-center gap-1">
                                  <DoorClosed className="w-3 h-3" />
                                  Sold Out for Dates
                                </span>
                              ) : (
                                <span className={left <= 2 ? "text-amber-400 flex items-center gap-1" : "text-emerald-400 flex items-center gap-1"}>
                                  <DoorClosed className="w-3 h-3" />
                                  {left} of {totalKeys} Rooms Available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 1 Proceed Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    disabled={isCurrentRoomSoldOut || isEntireHotelSoldOut}
                    className="w-full py-3.5 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-[0.16em] shadow-[0_4px_25px_rgba(224,43,29,0.45)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Continue to Guests &amp; Meal Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 2: GUESTS, ROOMS & BREAKFAST ================= */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Active Category Header Pill */}
                <div className="p-3.5 rounded-xl bg-[#0E0E10] border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-[#C9A96E]" />
                    <span className="font-serif font-bold text-[#F7F3EC]">{activeRoom.name}</span>
                    <span className="text-[#A8A59E]">· {nights} Night{nights > 1 ? "s" : ""}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] text-[#C9A96E] hover:underline cursor-pointer"
                  >
                    Change Room / Dates
                  </button>
                </div>

                {/* Number of Rooms Stepper */}
                <div className="p-4 rounded-xl bg-[#0E0E10]/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] font-semibold">
                        Number of Rooms *
                      </label>
                      <span className="text-[11px] text-[#A8A59E]">
                        Available for your dates: <strong className="text-emerald-400">{roomsLeft} of {categoryTotal} Keys</strong>
                      </span>
                    </div>

                    {/* Stepper Buttons */}
                    <div className="flex items-center gap-2 bg-[#151518] border border-white/10 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (roomsRequested > 1) {
                            setRoomsRequested((prev) => prev - 1);
                            setErrorMessage(null);
                          }
                        }}
                        disabled={roomsRequested <= 1}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition cursor-pointer"
                        title="Decrease Rooms"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-16 text-center font-mono font-bold text-sm text-[#F7F3EC]">
                        {roomsRequested} {roomsRequested === 1 ? "Room" : "Rooms"}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (roomsRequested < roomsLeft) {
                            setRoomsRequested((prev) => prev + 1);
                            setErrorMessage(null);
                          }
                        }}
                        disabled={roomsRequested >= roomsLeft}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition cursor-pointer"
                        title="Increase Rooms"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Meal Plan Selection */}
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-2 font-semibold flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[#E02B1D]" />
                    <span>Select Meal Plan *</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Without Breakfast (EP) */}
                    <div
                      onClick={() => setMealPlan("without_breakfast")}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        mealPlan === "without_breakfast"
                          ? "bg-[#E02B1D]/10 border-[#E02B1D] shadow-[0_0_15px_rgba(224,43,29,0.2)]"
                          : "bg-[#0E0E10] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-serif font-bold text-sm text-[#F7F3EC]">
                          Without Breakfast (Room Only)
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            mealPlan === "without_breakfast"
                              ? "bg-[#E02B1D] border-[#E02B1D] text-white"
                              : "border-white/20"
                          }`}
                        >
                          {mealPlan === "without_breakfast" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#A8A59E] mb-2 font-light">
                        Standard European Plan (EP). Room tariff only.
                      </p>
                      <div className="pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-[#A8A59E]">Official Rate: </span>
                        <span className="font-mono font-bold text-[#F7F3EC]">
                          {formatINR(occupancy === "single" ? (activeRoom.rateEpSingle || activeRoom.pricePerNight) : (activeRoom.rateEpDouble || activeRoom.pricePerNight + 200))}
                        </span>
                        <span className="text-[10px] text-[#A8A59E]"> / room / night</span>
                      </div>
                    </div>

                    {/* With Breakfast (CP) */}
                    <div
                      onClick={() => setMealPlan("with_breakfast")}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        mealPlan === "with_breakfast"
                          ? "bg-[#E02B1D]/10 border-[#E02B1D] shadow-[0_0_15px_rgba(224,43,29,0.2)]"
                          : "bg-[#0E0E10] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-[#C9A96E]" />
                          <span className="font-serif font-bold text-sm text-[#F7F3EC]">
                            With Morning Breakfast
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            mealPlan === "with_breakfast"
                              ? "bg-[#E02B1D] border-[#E02B1D] text-white"
                              : "border-white/20"
                          }`}
                        >
                          {mealPlan === "with_breakfast" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#A8A59E] mb-2 font-light">
                        Continental Plan (CP). Includes fresh morning buffet for all staying guests.
                      </p>
                      <div className="pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-[#A8A59E]">Official Rate: </span>
                        <span className="font-mono font-bold text-[#F7F3EC]">
                          {formatINR(occupancy === "single" ? (activeRoom.rateCpSingle || activeRoom.pricePerNight + 200) : (activeRoom.rateCpDouble || activeRoom.pricePerNight + 500))}
                        </span>
                        <span className="text-[10px] text-[#A8A59E]"> / room / night</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Occupancy Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#E02B1D]" />
                      <span>Occupancy per Room *</span>
                    </label>

                    {roomsRequested > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsPerRoomConfig((prev) => !prev)}
                        className="text-[10px] text-[#C9A96E] hover:underline cursor-pointer"
                      >
                        {isPerRoomConfig ? "Apply same occupancy to all rooms" : "Configure rooms individually"}
                      </button>
                    )}
                  </div>

                  {/* Single Room or Uniform Occupancy Selector */}
                  {!isPerRoomConfig || roomsRequested === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Double Occupancy */}
                      <div
                        onClick={() => setOccupancy("double")}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          occupancy === "double"
                            ? "bg-[#E02B1D]/10 border-[#E02B1D] shadow-[0_0_15px_rgba(224,43,29,0.2)]"
                            : "bg-[#0E0E10] border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif font-bold text-sm text-[#F7F3EC]">
                              Double Occupancy
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#C9A96E]/20 text-[#C9A96E] text-[9px] font-semibold">
                              2 Guests
                            </span>
                          </div>
                          <p className="text-[10px] text-[#A8A59E] mt-0.5">
                            {mealPlan === "with_breakfast" ? "Rate: " + formatINR(activeRoom.rateCpDouble || 2799) : "Rate: " + formatINR(activeRoom.rateEpDouble || 2499)} / night
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            occupancy === "double"
                              ? "bg-[#E02B1D] border-[#E02B1D] text-white"
                              : "border-white/20"
                          }`}
                        >
                          {occupancy === "double" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Single Occupancy */}
                      <div
                        onClick={() => setOccupancy("single")}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          occupancy === "single"
                            ? "bg-[#E02B1D]/10 border-[#E02B1D] shadow-[0_0_15px_rgba(224,43,29,0.2)]"
                            : "bg-[#0E0E10] border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif font-bold text-sm text-[#F7F3EC]">
                              Single Occupancy
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-white/10 text-white/80 text-[9px] font-semibold">
                              1 Guest
                            </span>
                          </div>
                          <p className="text-[10px] text-[#A8A59E] mt-0.5">
                            {mealPlan === "with_breakfast" ? "Rate: " + formatINR(activeRoom.rateCpSingle || 2499) : "Rate: " + formatINR(activeRoom.rateEpSingle || 2299)} / night
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            occupancy === "single"
                              ? "bg-[#E02B1D] border-[#E02B1D] text-white"
                              : "border-white/20"
                          }`}
                        >
                          {occupancy === "single" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Multi-Room Individual Occupancy List */
                    <div className="space-y-2 p-3 rounded-xl bg-[#0E0E10] border border-white/10">
                      <span className="text-[10px] text-[#A8A59E] block mb-1">
                        Select occupancy for each of your {roomsRequested} rooms:
                      </span>
                      {Array.from({ length: roomsRequested }).map((_, idx) => {
                        const curOcc = perRoomOccupancies[idx] || "double";
                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-[#151518] border border-white/5 flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-[#F7F3EC]">
                              Room #{idx + 1} ({activeRoom.name})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...perRoomOccupancies];
                                  updated[idx] = "double";
                                  setPerRoomOccupancies(updated);
                                }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                                  curOcc === "double"
                                    ? "bg-[#E02B1D] text-white"
                                    : "bg-white/5 text-[#A8A59E] hover:bg-white/10"
                                }`}
                              >
                                Double (2 Guests)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...perRoomOccupancies];
                                  updated[idx] = "single";
                                  setPerRoomOccupancies(updated);
                                }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                                  curOcc === "single"
                                    ? "bg-[#E02B1D] text-white"
                                    : "bg-white/5 text-[#A8A59E] hover:bg-white/10"
                                }`}
                              >
                                Single (1 Guest)
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Live Selected Rate & Subtotal Preview Bar */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0E0E10] to-[#151518] border border-white/15 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#C9A96E] font-semibold block">
                        Selected Plan Rate
                      </span>
                      <span className="font-serif font-bold text-base text-[#F7F3EC]">
                        {formatINR(priceBreakdown.ratePerNight)}
                      </span>
                      <span className="text-[11px] text-[#A8A59E]"> / room / night (+ taxes)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-[#A8A59E] block">
                        Estimated Subtotal ({nights}N × {roomsRequested}R)
                      </span>
                      <span className="font-mono font-bold text-sm text-[#F7F3EC]">
                        {formatINR(priceBreakdown.subtotal)}
                      </span>
                      <span className="text-[10px] text-[#C9A96E] block font-mono">
                        + {formatINR(priceBreakdown.gstAmount)} (5% GST)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-3.5 rounded-xl bg-[#0E0E10] hover:bg-white/5 border border-white/10 text-white font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToStep3}
                    className="flex-1 py-3.5 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white font-bold text-xs uppercase tracking-[0.16em] shadow-[0_4px_25px_rgba(224,43,29,0.45)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Continue to Guest Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 3: GUEST DETAILS & CONFIRMATION ================= */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  {/* Honeypot */}
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

                  {/* Guest Contact Details */}
                  <div className="p-4 rounded-xl bg-[#0E0E10]/80 border border-white/10 space-y-3">
                    <span className="text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] font-semibold block">
                      Primary Guest Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#A8A59E] uppercase tracking-wider mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Gurpreet Singh"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setErrorMessage(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[#151518] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none placeholder:text-[#A8A59E]/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#A8A59E] uppercase tracking-wider mb-1">
                          10-Digit Mobile / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="79734 50281"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setErrorMessage(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[#151518] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none placeholder:text-[#A8A59E]/40 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#A8A59E] uppercase tracking-wider mb-1">
                        Email Address (For Instant Booking Voucher) *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="guest@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage(null);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#151518] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none placeholder:text-[#A8A59E]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#A8A59E] uppercase tracking-wider mb-1">
                        Special Requests (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Quiet room, late arrival, ground floor"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#151518] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none placeholder:text-[#A8A59E]/40"
                      />
                    </div>
                  </div>

                  {/* Comprehensive Authoritative Price Breakdown */}
                  <div className="p-4 rounded-xl bg-[#0E0E10] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <span className="font-serif font-bold text-sm text-[#F7F3EC] block">
                          {activeRoom.name}
                        </span>
                        <span className="text-[10px] text-[#A8A59E]">
                          {formatDisplayDate(checkIn)} → {formatDisplayDate(checkOut)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-semibold text-[#F7F3EC]">
                          {nights} Night{nights > 1 ? "s" : ""} · {roomsRequested} Room{roomsRequested > 1 ? "s" : ""}
                        </span>
                        <span className="text-[10px] text-[#C9A96E] block">
                          {totalGuests} Guest{totalGuests > 1 ? "s" : ""} Total
                        </span>
                      </div>
                    </div>

                    {/* Plan & Occupancy Tags */}
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/90">
                        {mealPlan === "with_breakfast" ? "With Breakfast (CP)" : "Without Breakfast (EP)"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/90">
                        {isPerRoomConfig && roomsRequested > 1
                          ? `Mixed Occupancy (${activeOccupanciesList.filter(o => o === "double").length}D, ${activeOccupanciesList.filter(o => o === "single").length}S)`
                          : occupancy === "single"
                          ? "Single Occupancy (1 Guest / Room)"
                          : "Double Occupancy (2 Guests / Room)"}
                      </span>
                    </div>

                    {/* Numerical Rate Line Items */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs font-sans">
                      {/* Room Subtotal */}
                      <div className="flex justify-between text-[#A8A59E]">
                        <span>
                          Room Subtotal
                          <span className="text-[10px] text-[#A8A59E]/70 block font-light">
                            {formatINR(priceBreakdown.ratePerNight)}/night × {roomsRequested} room{roomsRequested > 1 ? "s" : ""} × {nights} night{nights > 1 ? "s" : ""}
                          </span>
                        </span>
                        <span className="text-[#F7F3EC] font-mono font-semibold">
                          {formatINR(priceBreakdown.subtotal)}
                        </span>
                      </div>

                      {/* GST Calculation */}
                      <div className="flex justify-between text-[#A8A59E] pt-1">
                        <span>
                          Applicable GST ({priceBreakdown.gstPercent}%)
                          <span className="text-[10px] text-[#A8A59E]/70 block font-light">
                            {priceBreakdown.ratePerNight <= 7500
                              ? "5% GST statutory rate (Base tariff up to ₹7,500/night)"
                              : "18% GST statutory rate (Base tariff above ₹7,500/night)"}
                          </span>
                        </span>
                        <span className="text-[#F7F3EC] font-mono font-semibold">
                          {formatINR(priceBreakdown.gstAmount)}
                        </span>
                      </div>

                      {/* Total Amount Due */}
                      <div className="flex justify-between text-sm font-bold text-[#F7F3EC] pt-3 border-t border-white/10 items-baseline">
                        <div>
                          <span className="font-serif block text-base">Total Payable Now</span>
                          <span className="text-[10px] text-emerald-400 font-sans font-normal">
                            100% Full Payment via Razorpay · No balance at hotel
                          </span>
                        </div>
                        <span className="font-serif text-[#E02B1D] font-mono text-xl">
                          {formatINR(priceBreakdown.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation & Terms Policy Agreement */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 text-xs text-[#A8A59E] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        required
                        checked={agreedToPolicy}
                        onChange={(e) => {
                          setAgreedToPolicy(e.target.checked);
                          setErrorMessage(null);
                        }}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#0E0E10] text-[#E02B1D] focus:ring-[#E02B1D] accent-[#E02B1D] shrink-0 cursor-pointer"
                      />
                      <span className="leading-snug">
                        I agree to the{" "}
                        <a href="/terms-and-conditions" target="_blank" className="text-[#C9A96E] hover:underline">
                          Terms &amp; Conditions
                        </a>{" "}
                        and{" "}
                        <a href="/cancellation-refund-policy" target="_blank" className="text-[#C9A96E] hover:underline">
                          24-Hour Cancellation Policy
                        </a>
                        . (Full refund if cancelled 24+ hours before check-in; valid government photo ID required at arrival).
                      </span>
                    </label>
                  </div>

                  {/* Submission & Action Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-4 rounded-xl bg-[#0E0E10] hover:bg-white/5 border border-white/10 text-white font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !agreedToPolicy || isCurrentRoomSoldOut || isEntireHotelSoldOut}
                      className="flex-1 py-4 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-[0.16em] shadow-[0_4px_25px_rgba(224,43,29,0.5)] transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting Secure Gateway...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pay &amp; Confirm Booking ({formatINR(priceBreakdown.totalAmount)})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-[#A8A59E] pt-1">
                    Check-in: 1:00 PM · Check-out: 11:00 AM · 24-hour reception: +91 79734 50281
                  </p>
                </form>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
