"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, BedDouble, Utensils, Users, Building2 } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import PhotoComingSoon from "@/components/PhotoComingSoon";

export default function AboutIntro() {
  const { about } = siteConfig;
  const { slots } = useSiteSlots();

  const exteriorImage = slots["exterior"]?.url || slots["about.image_primary"]?.url || "";

  // Property at a glance derived from real client data
  const propertyHighlights = [
    { value: "21", label: "Guest Rooms", sub: "Deluxe, Super Deluxe & Premium", icon: BedDouble },
    { value: "3", label: "Room Categories", sub: "King Beds · Air-Conditioned", icon: Building2 },
    { value: "50", label: "Restaurant Covers", sub: "Ground Floor · Breakfast Buffet", icon: Utensils },
    { value: "150", label: "Cloud Six Banquet", sub: "Celebrations & Special Events", icon: Users },
  ];

  return (
    <section id="about" className="relative py-20 lg:py-28 bg-[#F8F6F2] text-[#24272B] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Subtle Background Lighting Accent */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#B69A68]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Story */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-6 space-y-5"
          >
            <div className="inline-flex items-center space-x-2 text-[10px] sm:text-[11px] font-sans tracking-[0.25em] text-[#742B40] uppercase font-bold">
              <span className="w-5 h-[2px] bg-[#742B40]" />
              <span>{about.eyebrow}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#24272B] leading-[1.2]">
              {about.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#64615D] leading-relaxed font-normal">
              {about.paragraph1}
            </p>

            <p className="text-xs sm:text-sm text-[#64615D] leading-relaxed font-normal">
              {about.paragraph2}
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              {about.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white border border-[#E5DFD7] hover:border-[#B69A68] transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#742B40] shrink-0" />
                    <h4 className="text-xs font-semibold text-[#24272B] tracking-wider uppercase font-sans">
                      {feat.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#64615D] leading-normal font-normal">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Exterior Photo */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="lg:col-span-6 relative pt-4 pb-6"
          >
            <div className="relative w-full max-w-lg mx-auto">
              <div className="relative w-full aspect-[16/11] rounded-2xl overflow-hidden border border-[#E5DFD7] shadow-xl bg-white">
                {exteriorImage ? (
                  <Image
                    src={exteriorImage}
                    alt="Hotel Fremont Exterior on Airport Road, Mohali"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <PhotoComingSoon
                    title="Hotel Fremont Exterior"
                    category="Property"
                    aspectRatio="aspect-[16/11]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Property Badge */}
              <div className="absolute -bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-[#E5DFD7] shadow-xl max-w-[220px]">
                <span className="text-[10px] font-sans font-bold tracking-widest text-[#742B40] uppercase block mb-0.5">
                  Convenient Address
                </span>
                <span className="text-xs font-serif font-bold text-[#24272B] block">
                  Sector 80, Airport Road
                </span>
                <span className="text-[10px] text-[#64615D] leading-tight block">
                  Mohali (SAS Nagar), Punjab
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Property At A Glance Grid */}
        <div className="mt-16 pt-12 border-t border-[#E5DFD7]">
          <div className="text-center mb-8">
            <span className="text-[11px] font-sans tracking-[0.25em] text-[#742B40] uppercase font-bold">
              Property at a Glance
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {propertyHighlights.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white border border-[#E5DFD7] hover:border-[#B69A68] transition-all shadow-sm hover:shadow-md"
                >
                  <Icon className="w-5 h-5 mx-auto mb-2 text-[#742B40]" />
                  <div className="text-2xl sm:text-3xl font-serif font-bold text-[#24272B] mb-1">
                    {stat.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.18em] font-sans font-bold text-[#742B40] mb-0.5">
                    {stat.label}
                  </div>
                  <div className="text-[11px] text-[#64615D] font-normal">
                    {stat.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
