"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Users, Utensils, CheckCircle2, Phone, Sparkles } from "lucide-react";
import { siteConfig } from "@/data/content";
import { submitPublicEnquiryAction } from "@/actions/enquiries";

interface DiningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiningModal({ isOpen, onClose }: DiningModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: new Date().toISOString().split("T")[0],
    time: "19:30",
    guests: "2",
    seating: "Indoor Fine Dining",
    specialRequest: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Record dining inquiry to admin pipeline
    submitPublicEnquiryAction({
      type: "dining_aura",
      name: formData.name,
      phone: formData.phone,
      dates: `${formData.date} at ${formData.time}`,
      guests: Number(formData.guests) || 2,
      details: {
        time: formData.time,
        seating: formData.seating,
        specialRequests: formData.specialRequest || "None",
      },
      notes: `Aura dining reservation for ${formData.guests} guests. Seating: ${formData.seating}`,
    }).catch(console.warn);

    // Format WhatsApp message
    const message = `*Table Reservation Request - Hotel Fremont (Aura)*%0A%0A*Name:* ${encodeURIComponent(
      formData.name
    )}%0A*Phone:* ${encodeURIComponent(formData.phone)}%0A*Date:* ${encodeURIComponent(
      formData.date
    )}%0A*Time:* ${encodeURIComponent(formData.time)}%0A*Party Size:* ${encodeURIComponent(
      formData.guests
    )} Guests%0A*Seating Preference:* ${encodeURIComponent(
      formData.seating
    )}%0A*Special Requests:* ${encodeURIComponent(
      formData.specialRequest || "None"
    )}`;

    // Open WhatsApp in new tab
    const waUrl = `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${message}`;
    setTimeout(() => {
      window.open(waUrl, "_blank");
    }, 800);
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

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-lg bg-[#151518] border border-[#C9A96E]/30 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-6 sm:p-8 z-10 my-auto text-[#F7F3EC]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0E0E10] text-[#F7F3EC] hover:text-[#E02B1D] border border-white/10 transition-colors"
            aria-label="Close reservation modal"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSubmitted ? (
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold mb-2">
                <Utensils className="w-3 h-3 text-[#E02B1D]" />
                <span>AURA RESTAURANT & LOUNGE</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC] mb-2">
                Reserve Your Table
              </h3>
              <p className="text-xs text-[#A8A59E] mb-6 font-light">
                Secure your dining experience at Hotel Fremont. Our sommelier and culinary hosts look forward to greeting you.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-sm text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Contact Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98727 68514"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-sm text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Time Slot *
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    >
                      <option value="12:30">12:30 PM (Lunch)</option>
                      <option value="13:30">01:30 PM (Lunch)</option>
                      <option value="19:00">07:00 PM (Dinner)</option>
                      <option value="19:30">07:30 PM (Dinner)</option>
                      <option value="20:15">08:15 PM (Dinner)</option>
                      <option value="21:00">09:00 PM (Dinner)</option>
                      <option value="21:45">09:45 PM (Late Evening)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Party Size
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    >
                      <option value="1">1 Person</option>
                      <option value="2">2 Persons</option>
                      <option value="3">3 Persons</option>
                      <option value="4">4 Persons</option>
                      <option value="6">6 Persons</option>
                      <option value="8+">8+ Large Gathering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Ambience
                    </label>
                    <select
                      value={formData.seating}
                      onChange={(e) => setFormData({ ...formData, seating: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    >
                      <option value="Indoor Fine Dining">Indoor Intimate</option>
                      <option value="Outdoor Terrace">Terrace Starlit</option>
                      <option value="Private Dining Room (PDR)">Private Dining Room</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Occasion / Dietary Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Birthday, Anniversary, Jain Food, Window Seat"
                    value={formData.specialRequest}
                    onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white font-semibold text-xs uppercase tracking-[0.2em] shadow-lg transition-all duration-300 mt-2 btn-magnetic"
                >
                  Confirm Table Request
                </button>
              </form>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E02B1D]/20 border border-[#E02B1D] mx-auto flex items-center justify-center text-[#E02B1D]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h4 className="text-2xl font-serif font-bold text-[#F7F3EC]">
                Reservation Request Received!
              </h4>

              <p className="text-xs text-[#A8A59E] max-w-sm mx-auto font-light leading-relaxed">
                Thank you, <strong className="text-white">{formData.name}</strong>. We have forwarded your reservation for {formData.guests} guests on {formData.date} at {formData.time} to our hospitality team on WhatsApp.
              </p>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs uppercase tracking-widest text-[#F7F3EC] transition-colors"
              >
                Close Window
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
