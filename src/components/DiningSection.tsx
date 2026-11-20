"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, Users, Calendar } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import DiningModal from "./DiningModal";
import PhotoComingSoon from "@/components/PhotoComingSoon";

export default function DiningSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { dining } = siteConfig;
  const { slots } = useSiteSlots();

  const bannerImage = slots["restaurant"]?.url || slots["dining.banner_primary"]?.url || "";

  return (
    <section id="dining" className="relative py-20 lg:py-28 bg-[#EEE8DF] text-[#24272B] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Background Lighting Accent */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#742B40]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#742B40] uppercase font-bold mb-3">
            <span className="w-6 h-[2px] bg-[#742B40]" />
            <span>{dining.eyebrow}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#24272B] leading-tight mb-4">
            {dining.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#64615D] font-normal leading-relaxed">
            {dining.description}
          </p>
        </div>

        {/* Featured Restaurant Banner Card */}
        <div className="relative rounded-3xl overflow-hidden border border-[#E5DFD7] shadow-xl mb-14 bg-white">
          <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] min-h-[380px] sm:min-h-[440px]">
            {bannerImage ? (
              <Image
                src={bannerImage}
                alt="Hotel Fremont Restaurant Ground Floor"
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
            ) : (
              <PhotoComingSoon
                title="Hotel Fremont Restaurant"
                category="In-House Dining · Ground Floor"
                aspectRatio="aspect-[21/9]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />
          </div>

          {/* Overlay Floating Card */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14 z-10">
            <div className="max-w-xl bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-[#E5DFD7] shadow-2xl">
              <span className="px-3 py-1 rounded-full bg-[#742B40] text-white text-[10px] font-sans font-bold tracking-widest uppercase mb-4 inline-block shadow">
                Ground Floor Restaurant
              </span>

              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#24272B] mb-3">
                {dining.tagline}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#64615D] mb-5 font-sans">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#742B40]" />
                  <span>{dining.timing}</span>
                </div>
                <span className="text-[#E5DFD7]">&bull;</span>
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-[#742B40]" />
                  <span>{dining.covers}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {dining.features.map((feat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-md bg-[#F8F6F2] border border-[#E5DFD7] text-[11px] text-[#24272B] font-medium"
                  >
                    {feat}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-7 py-3 rounded-full bg-[#742B40] hover:bg-[#5C2033] text-xs font-sans uppercase tracking-[0.2em] text-white font-semibold transition-all duration-300 shadow-[0_4px_20px_rgba(116,43,64,0.35)] flex items-center space-x-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Enquire For Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <DiningModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
