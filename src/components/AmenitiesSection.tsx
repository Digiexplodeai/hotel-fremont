"use client";

import { motion } from "framer-motion";
import {
  Wifi,
  Car,
  Clock,
  Wind,
  Tv,
  Coffee,
  Flame,
  Sparkles,
  BedDouble,
  ShieldCheck,
} from "lucide-react";
import { siteConfig } from "@/data/content";

const iconMap: Record<string, React.ElementType> = {
  Wifi,
  Car,
  Clock,
  Wind,
  Tv,
  Coffee,
  Flame,
  Sparkles,
  BedDouble,
  ShieldCheck,
};

export default function AmenitiesSection() {
  const { amenities } = siteConfig;

  return (
    <section id="amenities" className="relative py-20 lg:py-28 bg-[#F8F6F2] text-[#24272B] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Background subtle radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#B69A68]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#742B40] uppercase font-bold mb-3"
          >
            <span className="w-5 h-[2px] bg-[#742B40]" />
            <span>HOTEL FACILITIES</span>
            <span className="w-5 h-[2px] bg-[#742B40]" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#24272B] leading-tight mb-4"
          >
            Essential Comforts &amp; Modern Conveniences
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xs sm:text-sm text-[#64615D] font-normal max-w-xl mx-auto leading-relaxed"
          >
            Thoughtfully provided amenities to ensure a comfortable, practical stay on Airport Road, Mohali for business travelers, event guests, and families.
          </motion.p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {amenities.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Sparkles;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="group relative p-6 rounded-2xl bg-white border border-[#E5DFD7] hover:border-[#B69A68] transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Icon Box */}
                  <div className="w-12 h-12 rounded-xl bg-[#F8F6F2] border border-[#E5DFD7] group-hover:border-[#742B40]/40 group-hover:bg-[#742B40]/10 flex items-center justify-center mb-4 transition-colors duration-300">
                    <IconComponent className="w-5 h-5 text-[#742B40] group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-serif font-bold text-[#24272B] group-hover:text-[#742B40] transition-colors mb-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#64615D] font-normal leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
