"use client";

import { Phone, MessageSquare, Calendar } from "lucide-react";
import { siteConfig } from "@/data/content";

interface FloatingMobileActionsProps {
  onOpenBooking: () => void;
}

export default function FloatingMobileActions({ onOpenBooking }: FloatingMobileActionsProps) {
  const { contact } = siteConfig;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-xl border-t border-[#E5DFD7] shadow-[0_-8px_30px_rgba(36,39,43,0.12)] lg:hidden text-[#24272B]">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        {/* Call Button */}
        <a
          href={contact.phoneTel}
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-[#24272B] hover:text-[#742B40] transition-colors"
          aria-label="Call Hotel Fremont"
        >
          <Phone className="w-4 h-4 text-[#742B40] mb-1" />
          <span className="text-[10px] uppercase font-sans tracking-wider font-semibold">
            Call
          </span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={contact.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] text-[#24272B] hover:text-[#25D366] transition-colors"
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
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-[#742B40] text-white shadow-[0_2px_12px_rgba(116,43,64,0.35)] font-semibold active:scale-95 transition-transform cursor-pointer"
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
