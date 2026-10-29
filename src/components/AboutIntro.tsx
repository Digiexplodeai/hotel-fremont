"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Plane, CheckCircle2 } from "lucide-react";
import { siteConfig } from "@/data/content";

export default function AboutIntro() {
  const { about, stats } = siteConfig;

  return (
    <section id="about" className="relative py-20 lg:py-28 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#C9A96E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Split Layout: Story & Overlapping Imagery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Brand Story */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-6 space-y-5"
          >
            <div className="inline-flex items-center space-x-2 text-[10px] sm:text-[11px] font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-semibold">
              <span className="w-5 h-[1.5px] bg-[#E02B1D]" />
              <span>{about.eyebrow}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#F7F3EC] leading-[1.2]">
              {about.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#F7F3EC]/80 leading-relaxed font-light">
              {about.paragraph1}
            </p>

            <p className="text-xs sm:text-sm text-[#F7F3EC]/70 leading-relaxed font-light">
              {about.paragraph2}
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              {about.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#151518]/90 border border-white/5 hover:border-[#C9A96E]/30 transition-colors"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E02B1D] shrink-0" />
                    <h4 className="text-xs font-semibold text-[#F7F3EC] tracking-wider uppercase font-sans">
                      {feat.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#A8A59E] leading-normal font-light">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Imagery with fixed aspect ratios and safe overflow */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="lg:col-span-6 relative pt-4 pb-6"
          >
            <div className="relative w-full max-w-lg mx-auto">
              {/* Primary Image */}
              <div className="relative w-full aspect-[16/11] rounded-2xl overflow-hidden border border-[#C9A96E]/30 shadow-xl">
                <Image
                  src={about.imagePrimary}
                  alt="Hotel Fremont Courtyard and Architecture"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10]/70 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Overlapping Secondary Image */}
              <div className="absolute -bottom-5 -left-3 sm:-left-6 w-1/2 aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#151518] shadow-2xl z-10 hidden sm:block">
                <Image
                  src={about.imageSecondary}
                  alt="Hotel Fremont Luxury Interior Suite"
                  fill
                  sizes="(max-width: 1024px) 40vw, 25vw"
                  className="object-cover"
                />
              </div>

              {/* Floating Airport USP Badge */}
              <div className="absolute -top-3 -right-2 sm:-right-4 z-20 glass-panel rounded-xl p-3 sm:p-4 border border-[#C9A96E]/40 shadow-xl max-w-[190px]">
                <div className="flex items-center space-x-1.5 text-[#E02B1D] mb-0.5">
                  <Plane className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-sans font-bold tracking-widest uppercase">
                    Airport USP
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-serif font-bold text-[#F7F3EC]">
                  10 Mins
                </div>
                <div className="text-[10px] text-[#A8A59E] leading-tight">
                  Direct corridor to Chandigarh Airport (IXC)
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Animated Counters / Metrics Grid */}
        <div className="mt-16 pt-12 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-3xl sm:text-4xl font-serif font-bold text-[#F7F3EC] mb-1 flex items-center justify-center">
                  <span>{stat.value}</span>
                  <span className="text-[#E02B1D] ml-0.5">{stat.suffix}</span>
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] font-sans font-semibold text-[#C9A96E] mb-0.5">
                  {stat.label}
                </div>
                <div className="text-[11px] text-[#A8A59E] font-light">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
