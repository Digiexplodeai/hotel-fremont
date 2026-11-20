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
      className={`relative w-full ${aspectRatio} bg-gradient-to-br from-[#18181C] via-[#121215] to-[#0A0A0C] border border-white/5 flex flex-col items-center justify-center p-6 text-center overflow-hidden group select-none ${className}`}
    >
      {/* Subtle ambient lighting */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#C9A96E]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#E02B1D]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Center Icon & Badge */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-[#C9A96E]/30 flex items-center justify-center mb-3 shadow-inner">
          <Camera className="w-5 h-5 text-[#C9A96E]/80" />
        </div>

        {category && (
          <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#E02B1D] font-bold mb-1">
            {category}
          </span>
        )}

        {title && (
          <h4 className="text-base sm:text-lg font-serif font-semibold text-[#F7F3EC]/90 mb-1 max-w-xs">
            {title}
          </h4>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs text-[#A8A59E] font-sans">
          <Sparkles className="w-3 h-3 text-[#C9A96E]" />
          <span>Photo coming soon</span>
        </div>

        <span className="text-[10px] text-[#A8A59E]/60 font-sans tracking-wider uppercase mt-3">
          Hotel Fremont · Mohali
        </span>
      </div>
    </div>
  );
}
