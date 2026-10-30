"use client";

import { useState, useEffect } from "react";
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
  Mail,
  Plane,
} from "lucide-react";
import { siteConfig } from "@/data/content";

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

  const [checkIn, setCheckIn] = useState(
    initialData?.checkIn || getFormattedDate(1)
  );
  const [checkOut, setCheckOut] = useState(
    initialData?.checkOut || getFormattedDate(3)
  );
  const [roomType, setRoomType] = useState(
    initialData?.roomType || siteConfig.rooms[0].id
  );
  const [guests, setGuests] = useState(initialData?.guests || 2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  // Update if initialData changes
  useEffect(() => {
    if (initialData?.checkIn) setCheckIn(initialData.checkIn);
    if (initialData?.checkOut) setCheckOut(initialData.checkOut);
    if (initialData?.roomType) setRoomType(initialData.roomType);
    if (initialData?.guests) setGuests(initialData.guests);
  }, [initialData]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setIsSubmitted(false);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Selected room data
  const selectedRoom =
    siteConfig.rooms.find((r) => r.id === roomType || (r as any).slug === roomType) || siteConfig.rooms[0];

  // Calculate nights
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const timeDiff = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));
  const nights = isNaN(timeDiff) || timeDiff < 1 ? 1 : timeDiff;
  const roomPrice = selectedRoom.price;
  const subtotal = roomPrice * nights;
  const gstRate = 0.18; // 18% luxury GST in India
  const gst = Math.round(subtotal * gstRate);
  const total = subtotal + gst;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate unique confirmation reference
    const refCode = `HF-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRef(refCode);
    setIsSubmitted(true);

    /**
     * BACKEND HOOK:
     * When you are ready to connect a real backend/database or payment gateway,
     * simply replace or uncomment the fetch below:
     *
     * await fetch('/api/bookings', {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify({ refCode, name, phone, email, checkIn, checkOut, roomType, guests, total })
     * });
     */

    // Format WhatsApp confirmation text
    const message = `*Hotel Fremont - New Reservation Request*%0A%0A*Ref:* ${refCode}%0A*Guest:* ${encodeURIComponent(
      name
    )}%0A*Phone:* ${encodeURIComponent(phone)}%0A*Email:* ${encodeURIComponent(
      email || "N/A"
    )}%0A*Suite:* ${encodeURIComponent(
      selectedRoom.title
    )}%0A*Check-In:* ${checkIn}%0A*Check-Out:* ${checkOut}%0A*Nights:* ${nights}%0A*Guests:* ${guests}%0A*Total (incl. GST):* ₹${total.toLocaleString(
      "en-IN"
    )}%0A*Special Requests:* ${encodeURIComponent(
      specialRequests || "None"
    )}`;

    const waUrl = `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${message}`;
    setTimeout(() => {
      window.open(waUrl, "_blank");
    }, 900);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop with blur & light dismiss */}
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
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0E0E10] text-[#F7F3EC] hover:text-[#E02B1D] border border-white/10 transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSubmitted ? (
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold mb-2">
                <Sparkles className="w-3 h-3 text-[#E02B1D]" />
                <span>HOTEL FREMONT DIRECT RESERVATIONS</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC] mb-2">
                Book Your Luxury Experience
              </h3>

              <p className="text-xs text-[#A8A59E] mb-6 font-light">
                Direct booking privileges: complimentary airport drop, priority check-in, and 24-hour flexible cancellation.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dates & Suite Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Check-In Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={getFormattedDate(0)}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
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
                      min={checkIn || getFormattedDate(1)}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Select Suite *
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    >
                      {siteConfig.rooms.map((r) => (
                        <option key={r.id || (r as any).slug} value={r.id || (r as any).slug}>
                          {r.title} ({r.priceLabel}/night)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Guests *
                    </label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Guest" : "Guests"}
                        </option>
                      ))}
                    </select>
                    {selectedRoom && (selectedRoom as any).maxGuests && guests > (selectedRoom as any).maxGuests && (
                      <p className="text-[10px] text-[#C9A96E] mt-1">
                        {selectedRoom.title} accommodates up to {(selectedRoom as any).maxGuests} guests.
                      </p>
                    )}
                  </div>
                </div>

                {/* Guest Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Phone Number / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98727 68514"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                    placeholder="guest@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Special Inquiries & Airport Transfer Request
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flight IXC arrival time, high floor room, extra bed"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                {/* Transparent Price Summary Box */}
                <div className="p-4 rounded-xl bg-[#0E0E10] border border-[#C9A96E]/20 text-xs space-y-1.5">
                  <div className="flex justify-between text-[#A8A59E]">
                    <span>
                      {selectedRoom.title} &times; {nights} {nights > 1 ? "Nights" : "Night"}
                    </span>
                    <span className="text-[#F7F3EC]">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#A8A59E]">
                    <span>Taxes & Luxury GST (18%)</span>
                    <span className="text-[#F7F3EC]">₹{gst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#F7F3EC] pt-2 border-t border-white/10">
                    <span className="font-serif">Estimated Total</span>
                    <span className="font-serif text-[#E02B1D]">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white font-bold text-xs uppercase tracking-[0.22em] shadow-[0_4px_25px_rgba(224,43,29,0.5)] transition-all duration-300 btn-magnetic flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Submit Reservation Request</span>
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
                  CONFIRMATION PENDING WA APPROVAL
                </span>
                <h4 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC] mt-1">
                  Booking Request #{bookingRef}
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-[#0E0E10] border border-white/10 max-w-md mx-auto text-xs text-[#A8A59E] space-y-2 text-left">
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <strong className="text-white">{name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Selected Suite:</span>
                  <strong className="text-white">{selectedRoom.title}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Stay Duration:</span>
                  <strong className="text-white">
                    {checkIn} to {checkOut} ({nights} Nights)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Total:</span>
                  <strong className="text-[#E02B1D]">₹{total.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <p className="text-xs text-[#A8A59E] max-w-sm mx-auto font-light leading-relaxed">
                We have generated your booking voucher and forwarded your details directly to our reservation concierge via WhatsApp.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={`https://wa.me/${siteConfig.contact.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-[#25D366] text-white text-xs uppercase tracking-wider font-bold shadow flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open WhatsApp Chat</span>
                </a>

                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs uppercase tracking-wider text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
