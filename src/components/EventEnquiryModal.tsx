"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Crown, Users, Sparkles, CheckCircle2, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/data/content";
import { submitPublicEnquiryAction } from "@/actions/enquiries";

interface EventEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedVenue?: string;
}

export default function EventEnquiryModal({
  isOpen,
  onClose,
  preSelectedVenue = "The Grand Fremont Ballroom",
}: EventEnquiryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: "Royal Wedding & Reception",
    venue: preSelectedVenue,
    guests: "200-350 Guests",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (preSelectedVenue) {
      setFormData((prev) => ({ ...prev, venue: preSelectedVenue }));
    }
  }, [preSelectedVenue]);

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

    // Record event inquiry to admin pipeline
    submitPublicEnquiryAction({
      type: "event_banquet",
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      dates: formData.date,
      guests: Number(formData.guests) || 50,
      details: {
        eventType: formData.eventType,
        venue: formData.venue,
        notes: formData.notes || "None",
      },
      notes: `${formData.eventType} in ${formData.venue} for ~${formData.guests} guests on ${formData.date}`,
    }).catch(console.warn);

    const message = `*Banquets & Event Enquiry - Hotel Fremont*%0A%0A*Host Name:* ${encodeURIComponent(
      formData.name
    )}%0A*Phone:* ${encodeURIComponent(formData.phone)}%0A*Email:* ${encodeURIComponent(
      formData.email || "N/A"
    )}%0A*Event Type:* ${encodeURIComponent(
      formData.eventType
    )}%0A*Venue:* ${encodeURIComponent(
      formData.venue
    )}%0A*Estimated Guests:* ${encodeURIComponent(
      formData.guests
    )}%0A*Preferred Date:* ${encodeURIComponent(
      formData.date
    )}%0A*Notes/Requirements:* ${encodeURIComponent(formData.notes || "None")}`;

    const waUrl = `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${message}`;
    setTimeout(() => {
      window.open(waUrl, "_blank");
    }, 800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-lg bg-[#151518] border border-[#C9A96E]/30 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-6 sm:p-8 z-10 my-auto text-[#F7F3EC]"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0E0E10] text-[#F7F3EC] hover:text-[#E02B1D] border border-white/10 transition-colors"
            aria-label="Close event enquiry modal"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSubmitted ? (
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold mb-2">
                <Crown className="w-3 h-3 text-[#E02B1D]" />
                <span>HOTEL FREMONT BANQUETS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#F7F3EC] mb-2">
                Plan Your Celebration
              </h3>
              <p className="text-xs text-[#A8A59E] mb-6 font-light">
                From fairy-tale weddings to corporate conclaves, our banqueting team creates unforgettable occasions on Airport Road, Mohali.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Host / Organizer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jasleen Kaur / Sandhu Logistics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-sm text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Phone / WhatsApp *
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

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="host@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0E0E10] border border-white/10 text-sm text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Event Occasion
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    >
                      <option value="Royal Wedding & Reception">Wedding & Reception</option>
                      <option value="Sangeet & Cocktail Evening">Sangeet & Cocktail</option>
                      <option value="Corporate Summit / Conference">Corporate Summit</option>
                      <option value="Product Launch / Exhibition">Product Launch</option>
                      <option value="Social Gala / Anniversary">Social Gala / Anniversary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Venue Selection
                    </label>
                    <select
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    >
                      <option value="The Grand Fremont Ballroom">The Grand Ballroom (600 pax)</option>
                      <option value="The Fremont Terrace Lawn">Terrace Lawn (350 pax)</option>
                      <option value="The Executive Boardroom">Executive Boardroom (35 pax)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Estimated Guests
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                    >
                      <option value="30-75 Guests">30 - 75 Guests</option>
                      <option value="75-150 Guests">75 - 150 Guests</option>
                      <option value="150-300 Guests">150 - 300 Guests</option>
                      <option value="300-600 Guests">300 - 600 Guests</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                      Target Date *
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
                </div>

                <div>
                  <label className="block text-[11px] font-sans uppercase tracking-wider text-[#C9A96E] mb-1 font-semibold">
                    Custom Requests & Setup Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Stage setup, multi-cuisine catering, audio-visual requirements"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-[#0E0E10] border border-white/10 text-xs text-[#F7F3EC] focus:border-[#E02B1D] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white font-semibold text-xs uppercase tracking-[0.2em] shadow-lg transition-all duration-300 btn-magnetic"
                >
                  Send Event Enquiry
                </button>
              </form>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E02B1D]/20 border border-[#E02B1D] mx-auto flex items-center justify-center text-[#E02B1D]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h4 className="text-2xl font-serif font-bold text-[#F7F3EC]">
                Enquiry Sent to Banquet Desk!
              </h4>

              <p className="text-xs text-[#A8A59E] max-w-sm mx-auto font-light leading-relaxed">
                Thank you, <strong className="text-white">{formData.name}</strong>. Our senior event curator has received your details for {formData.eventType} on {formData.date} and will contact you directly with bespoke pricing and floor plans.
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
