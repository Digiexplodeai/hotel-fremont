"use client";

import { motion } from "framer-motion";
import {
  Wifi,
  Plane,
  UtensilsCrossed,
  Crown,
  Car,
  Clock,
  Dumbbell,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/data/content";

const iconMap: Record<string, React.ElementType> = {
  Wifi,
  Plane,
  UtensilsCrossed,
  Crown,
  Car,
  Clock,
  Dumbbell,
  ShieldCheck,
};

export default function AmenitiesSection() {
  const { amenities } = siteConfig;

  return (
    <section id="amenities" className="relative py-24 lg:py-32 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C9A96E]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-3"
          >
            <span className="w-5 h-[1.5px] bg-[#E02B1D]" />
            <span>UNMATCHED PRIVILEGES</span>
            <span className="w-5 h-[1.5px] bg-[#E02B1D]" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight mb-4"
          >
            Crafted for Comfort, Elevated by Design
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xs sm:text-sm text-[#A8A59E] font-light max-w-xl mx-auto"
          >
            Every modern amenity is thoughtfully curated to provide an effortless, whisper-quiet sanctuary for business visionaries and leisure travelers alike.
          </motion.p>
        </div>

        {/* 8-Icon Grid with Staggered Fade Up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {amenities.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Sparkles;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="group relative p-6 sm:p-7 rounded-2xl bg-[#151518]/90 border border-white/5 hover:border-[#C9A96E]/40 transition-all duration-300 hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              >
                {/* Subtle Hover Gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#C9A96E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  {/* Icon Box */}
                  <div className="w-12 h-12 rounded-xl bg-[#0E0E10] border border-[#C9A96E]/20 group-hover:border-[#E02B1D]/60 group-hover:bg-[#E02B1D]/10 flex items-center justify-center mb-5 transition-colors duration-300">
                    <IconComponent className="w-5 h-5 text-[#E02B1D] group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#F7F3EC] group-hover:text-[#C9A96E] transition-colors mb-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#A8A59E] leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom Red Line Accent */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center space-x-1 text-[10px] tracking-widest uppercase font-sans text-[#C9A96E]/70 group-hover:text-[#E02B1D] transition-colors">
                  <span>5-Star Standard</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
