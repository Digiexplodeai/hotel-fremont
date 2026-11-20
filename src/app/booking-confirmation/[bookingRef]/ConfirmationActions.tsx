"use client";

import { Printer, Share2, Check } from "lucide-react";
import { useState } from "react";
import { formatINR } from "@/config/hotel";

interface ConfirmationActionsProps {
  bookingRef: string;
  guestName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
}

export default function ConfirmationActions({
  bookingRef,
  guestName,
  roomName,
  checkIn,
  checkOut,
  totalAmount,
}: ConfirmationActionsProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window === "undefined") return;

    const message = encodeURIComponent(
      `*Hotel Fremont Reservation Confirmation*\n\n` +
      `*Booking Ref:* ${bookingRef}\n` +
      `*Guest:* ${guestName}\n` +
      `*Room:* ${roomName}\n` +
      `*Stay:* ${checkIn} to ${checkOut}\n` +
      `*Amount Paid:* ${formatINR(totalAmount)} (Full Online Payment)\n\n` +
      `*Pass:* ${window.location.href}\n\n` +
      `Hotel Fremont, Airport Road, Sector 80, Mohali\n` +
      `Contact: +91 79734 50281`
    );

    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="pt-4 border-t border-[#E5DFD7] flex flex-col sm:flex-row gap-3 print:hidden">
      <button
        onClick={handlePrint}
        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F8F6F2] hover:bg-[#EEE8DF] text-[#24272B] border border-[#E5DFD7] text-sm font-semibold transition cursor-pointer shadow-sm"
      >
        <Printer className="w-4 h-4 text-[#64615D]" />
        <span>Print / Save PDF</span>
      </button>

      <button
        onClick={handleShareWhatsApp}
        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition cursor-pointer shadow-sm"
      >
        <Share2 className="w-4 h-4" />
        <span>Share on WhatsApp</span>
      </button>

      <button
        onClick={handleCopyLink}
        className="sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F8F6F2] hover:bg-[#EEE8DF] text-[#24272B] border border-[#E5DFD7] text-sm font-semibold transition cursor-pointer shadow-sm"
        title="Copy pass link"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-xs font-semibold">Copied</span>
          </>
        ) : (
          <span className="text-xs">Copy Link</span>
        )}
      </button>
    </div>
  );
}
