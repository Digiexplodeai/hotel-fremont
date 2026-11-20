"use client";

import React from "react";
import { Camera, Sparkles } from "lucide-react";

interface PhotoComingSoonProps {
  title?: string;
  category?: string;
  className?: string;
  aspectRatio?: string;
}

export default function PhotoComingSoon({
  title,
  category,
  className = "",
  aspectRatio = "aspect-[16/10]",
}: PhotoComingSoonProps) {
  return (
    <div
      className={`relative w-full ${aspectRatio} bg-gradient-to-br from-[#F8F6F2] via-[#EEE8DF] to-[#E5DFD7] border border-[#E5DFD7] flex flex-col items-center justify-center p-6 text-center overflow-hidden group select-none ${className}`}
    >
      {/* Subtle ambient lighting */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#B69A68]/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#742B40]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Center Icon & Badge */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-white border border-[#B69A68]/40 flex items-center justify-center mb-3 shadow-sm">
          <Camera className="w-5 h-5 text-[#742B40]" />
        </div>

        {category && (
          <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#742B40] font-bold mb-1">
            {category}
          </span>
        )}

        {title && (
          <h4 className="text-base sm:text-lg font-serif font-bold text-[#24272B] mb-1 max-w-xs">
            {title}
          </h4>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#E5DFD7] text-xs text-[#64615D] font-sans font-medium shadow-sm">
          <Sparkles className="w-3 h-3 text-[#B69A68]" />
          <span>Photo coming soon</span>
        </div>

        <span className="text-[10px] text-[#64615D]/80 font-sans tracking-wider uppercase mt-3">
          Hotel Fremont · Mohali
        </span>
      </div>
    </div>
  );
}
