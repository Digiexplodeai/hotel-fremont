"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Crown, Users, Sparkles, CheckCircle2, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/data/content";
import { submitPublicEnquiryAction } from "@/actions/enquiries";
import { formatEnquiryDate, normalizeGuestRange } from "@/lib/enquiryFormat";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { validateContactPhone } from "@/config/hotel";

interface EventEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedVenue?: string;
}

export default function EventEnquiryModal({
  isOpen,
  onClose,
  preSelectedVenue = "Cloud 6 Banquet",
}: EventEnquiryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: "Celebration / Special Occasion",
    venue: preSelectedVenue,
    guests: "50–100 Guests",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    botField: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

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
      lockScroll();
      setIsSubmitted(false);
      setErrorMessage(null);
      setSubmittedRef(null);
      setWhatsappUrl(null);
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
    if (formData.botField) return; // Silent discard for bot spam
    if (isSubmitting) return;

    // 1. Client-side Phone validation (Indian & International with country code)
    const phoneCheck = validateContactPhone(formData.phone);
    if (!phoneCheck.isValid) {
      setErrorMessage(phoneCheck.error || "Please enter a valid 10-digit Indian mobile or international number with '+'.");
      return;
    }

    // 2. Client-side Date validation
    if (formData.date) {
      const nowIST = new Date(Date.now() + 5.5 * 3600 * 1000);
      const todayStr = nowIST.toISOString().slice(0, 10);
      if (formData.date < todayStr) {
        setErrorMessage("Preferred date cannot be in the past. Please select today or a future date.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const isConference =
        formData.venue.toLowerCase().includes("conference") ||
        formData.eventType.toLowerCase().includes("corporate") ||
        formData.eventType.toLowerCase().includes("meeting");

      // Parse estimated guests number (50, 100, 150)
      let parsedGuests = 50;
      if (formData.guests.includes("100–150") || formData.guests.includes("100-150")) {
        parsedGuests = 150;
      } else if (formData.guests.includes("50–100") || formData.guests.includes("50-100")) {
        parsedGuests = 100;
      } else {
        parsedGuests = 50;
      }

      const formattedDisplayDate = formatEnquiryDate(formData.date);
      const customNotes = formData.notes && formData.notes.trim() && formData.notes !== "None"
        ? ` · Notes: ${formData.notes.trim()}`
        : "";
      const cleanSummary = `${formData.eventType} · ${formData.guests} · ${formattedDisplayDate} · ${formData.venue}${customNotes}`;

      // Record event / conference enquiry to Supabase pipeline
      const res = await submitPublicEnquiryAction({
        type: isConference ? "conference" : "event_banquet",
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        dates: formData.date,
        guests: parsedGuests,
        details: {
          eventType: formData.eventType,
          venue: formData.venue,
          guestRange: formData.guests,
          notes: formData.notes || "None",
        },
        notes: cleanSummary,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Unable to submit your enquiry right now. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Build WhatsApp message for optional follow-up
      const message = `*Banquets & Event Enquiry - Hotel Fremont*%0A%0A*Reference:* ${encodeURIComponent(
        res.referenceCode || "N/A"
      )}%0A*Host Name:* ${encodeURIComponent(
        formData.name
      )}%0A*Phone:* ${encodeURIComponent(phoneCheck.formattedPhone)}%0A*Email:* ${encodeURIComponent(
        formData.email || "N/A"
      )}%0A*Event Occasion:* ${encodeURIComponent(
        formData.eventType
      )}%0A*Venue:* ${encodeURIComponent(
        formData.venue
      )}%0A*Guest Range:* ${encodeURIComponent(
        formData.guests
      )}%0A*Preferred Date:* ${encodeURIComponent(
        formattedDisplayDate
      )}%0A*Notes/Requirements:* ${encodeURIComponent(formData.notes || "None")}`;

      const waUrl = `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${message}`;

      setSubmittedRef(res.referenceCode || null);
      setWhatsappUrl(waUrl);
      setIsSubmitted(true);
      setIsSubmitting(false);
    } catch {
      setErrorMessage("Unable to submit your enquiry right now. Please try again.");
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
                Plan Your Event
              </h3>
              <p className="text-xs text-[#A8A59E] mb-6 font-light">
                Dedicated venues for private celebrations, corporate meetings, and social gatherings on Airport Road, Mohali.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field */}
                <input
                  type="text"
                  name="user_verification_notes"
                  value={formData.botField}
                  onChange={(e) => setFormData({ ...formData, botField: e.target.value })}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

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
                      placeholder="+91 79734 50281"
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
                      <option value="Celebration / Special Occasion">Celebration / Special Occasion</option>
                      <option value="Corporate Meeting / Seminar">Corporate Meeting / Seminar</option>
                      <option value="Birthday / Anniversary">Birthday / Anniversary</option>
                      <option value="Social Gathering / Dinner">Social Gathering / Dinner</option>
                      <option value="Other Event">Other Event</option>
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
                      <option value="Cloud 6 Banquet">Cloud 6 Banquet (Up to 150 guests)</option>
                      <option value="Conference Hall">Conference Hall (40 to 50 guests)</option>
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
                      <option value="Up to 50 Guests">Up to 50 Guests</option>
                      <option value="50–100 Guests">50–100 Guests</option>
                      <option value="100–150 Guests">100–150 Guests</option>
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
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs uppercase tracking-[0.2em] shadow-lg transition-all duration-300 btn-magnetic flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting to Banquet Desk...</span>
                    </>
                  ) : (
                    <span>Send Event Enquiry</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-2xl font-serif font-bold text-[#F7F3EC] mb-1">
                  Enquiry Submitted Successfully
                </h4>
                <p className="text-xs text-[#A8A59E] font-light">
                  Your event enquiry has been logged with Hotel Fremont reservation desk.
                </p>
              </div>

              {/* Reference Code Badge */}
              <div className="p-3 bg-[#0E0E10] border border-[#C9A96E]/30 rounded-xl max-w-xs mx-auto text-center shadow-inner">
                <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] block mb-1 font-mono font-medium">
                  Enquiry Reference Code
                </span>
                <span className="font-mono text-base font-bold text-[#F7F3EC] tracking-wider select-all">
                  {submittedRef || "FRM-ENQ-CONFIRMED"}
                </span>
              </div>

              <div className="bg-[#0E0E10]/60 border border-white/5 rounded-xl p-3 max-w-sm mx-auto text-xs text-[#A8A59E] text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Host Name:</span>
                  <span className="text-[#F7F3EC] font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Venue:</span>
                  <span className="text-[#F7F3EC] font-medium text-[#C9A96E]">{formData.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Occasion:</span>
                  <span className="text-[#F7F3EC]">{formData.eventType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Date &amp; Guests:</span>
                  <span className="text-[#F7F3EC] font-mono">{formatEnquiryDate(formData.date)} · {formData.guests}</span>
                </div>
              </div>

              <p className="text-xs text-[#A8A59E] max-w-sm mx-auto font-light leading-relaxed">
                Thank you! Your enquiry has been submitted successfully. Our team will contact you shortly with bespoke pricing and venue arrangements.
              </p>

              {/* Action Buttons: WhatsApp Optional Follow-up & Close */}
              <div className="space-y-2.5 pt-2 max-w-sm mx-auto">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans uppercase tracking-[0.14em] font-semibold transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Continue on WhatsApp (Optional)</span>
                  </a>
                )}
                <p className="text-[10px] text-[#A8A59E] leading-normal">
                  Connect directly with our banquet team on WhatsApp for instant assistance.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-sans uppercase tracking-wider text-white transition cursor-pointer"
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
