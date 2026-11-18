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
      `Contact: +91 98727 68514`
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
    <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 print:hidden">
      <button
        onClick={handlePrint}
        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition cursor-pointer"
      >
        <Printer className="w-4 h-4 text-white/70" />
        Print / Save PDF
      </button>

      <button
        onClick={handleShareWhatsApp}
        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition cursor-pointer"
      >
        <Share2 className="w-4 h-4" />
        Share on WhatsApp
      </button>

      <button
        onClick={handleCopyLink}
        className="sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium transition cursor-pointer"
        title="Copy pass link"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-xs">Copied</span>
          </>
        ) : (
          <span className="text-xs">Copy Link</span>
        )}
      </button>
    </div>
  );
}
