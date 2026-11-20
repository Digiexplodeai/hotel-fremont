"use client";

import { Phone, MessageSquare, Calendar } from "lucide-react";
import { siteConfig } from "@/data/content";

interface FloatingMobileActionsProps {
  onOpenBooking: () => void;
}

export default function FloatingMobileActions({ onOpenBooking }: FloatingMobileActionsProps) {
  const { contact } = siteConfig;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#0E0E10]/95 backdrop-blur-xl border-t border-[#C9A96E]/20 shadow-[0_-10px_30px_rgba(0,0,0,0.7)] lg:hidden">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        {/* Call Button */}
        <a
          href={contact.phoneTel}
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-[#151518] border border-white/10 text-white hover:text-[#C9A96E] transition-colors"
          aria-label="Call Hotel Fremont"
        >
          <Phone className="w-4 h-4 text-[#E02B1D] mb-1" />
          <span className="text-[10px] uppercase font-sans tracking-wider font-semibold">
            Call
          </span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={contact.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-[#151518] border border-white/10 text-white hover:text-[#25D366] transition-colors"
          aria-label="WhatsApp Hotel Fremont"
        >
          <MessageSquare className="w-4 h-4 text-[#25D366] mb-1" />
          <span className="text-[10px] uppercase font-sans tracking-wider font-semibold">
            WhatsApp
          </span>
        </a>

        {/* Book Now Button */}
        <button
          onClick={onOpenBooking}
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-[#E02B1D] text-white shadow-[0_2px_12px_rgba(224,43,29,0.5)] font-semibold active:scale-95 transition-transform"
          aria-label="Open booking form"
        >
          <Calendar className="w-4 h-4 mb-1" />
          <span className="text-[10px] uppercase font-sans tracking-wider font-bold">
            Book Stay
          </span>
        </button>
      </div>
    </div>
  );
}
