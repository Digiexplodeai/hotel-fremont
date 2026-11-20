"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Users, CheckCircle2, Phone, Sparkles } from "lucide-react";
import { siteConfig } from "@/data/content";
import { submitPublicEnquiryAction } from "@/actions/enquiries";
import { lockScroll, unlockScroll } from "@/lib/scroll";

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
    seating: "Main Dining Hall",
    specialRequest: "",
    botField: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      lockScroll();
      setIsSubmitted(false);
      setErrorMessage(null);
    } else {
      unlockScroll();
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlockScroll();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.botField) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitPublicEnquiryAction({
        type: "dining",
        name: formData.name,
        phone: formData.phone,
        dates: `${formData.date} at ${formData.time}`,
        guests: Number(formData.guests) || 2,
        details: {
          time: formData.time,
          seating: formData.seating,
          specialRequests: formData.specialRequest || "None",
        },
        notes: `Hotel Fremont Restaurant table enquiry for ${formData.guests} guests. Seating: ${formData.seating}`,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to submit enquiry. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
      setIsSubmitting(false);

      const message = `*Table Enquiry - Hotel Fremont Restaurant*%0A%0A*Name:* ${encodeURIComponent(
        formData.name
      )}%0A*Phone:* ${encodeURIComponent(formData.phone)}%0A*Date:* ${encodeURIComponent(
        formData.date
      )}%0A*Time:* ${encodeURIComponent(formData.time)}%0A*Party Size:* ${encodeURIComponent(
        formData.guests
      )} Guests%0A*Special Requests:* ${encodeURIComponent(
        formData.specialRequest || "None"
      )}`;

      const waUrl = `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${message}`;
      setTimeout(() => {
        window.open(waUrl, "_blank");
      }, 800);
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again or call our reception directly.");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0E0E10]/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#151518] border border-white/10 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-6 sm:p-8 z-10 my-auto text-[#F7F3EC]"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0E0E10] text-[#F7F3EC] hover:text-[#E02B1D] border border-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSubmitted ? (
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold mb-2">
                <Sparkles className="w-3 h-3 text-[#E02B1D]" />
                <span>HOTEL FREMONT RESTAURANT</span>
              </div>

              <h3 className="text-2xl font-serif font-bold text-[#F7F3EC] mb-2">
                Table Enquiry
              </h3>

              <p className="text-xs text-[#A8A59E] mb-6 font-light">
                Ground floor dining with 50 covers. Kitchen operational daily until 10:30 PM.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div style={{ display: "none" }}>
                  <input
                    type="text"
                    value={formData.botField}
                    onChange={(e) => setFormData({ ...formData, botField: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amanjot Kaur"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 79734 50281"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
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
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Preferred Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Party Size *
                  </label>
                  <select
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Special Requests (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Window table, birthday setup"
                    value={formData.specialRequest}
                    onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white text-xs font-sans uppercase tracking-[0.18em] font-semibold transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Submitting Enquiry...</span>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Send Table Enquiry</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-serif font-bold text-[#F7F3EC] mb-2">
                Enquiry Sent
              </h4>
              <p className="text-xs text-[#A8A59E] mb-6 leading-relaxed max-w-sm mx-auto">
                Thank you! Our restaurant desk will confirm your table shortly. We also opened WhatsApp to connect directly.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-sans uppercase tracking-wider text-white transition"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
