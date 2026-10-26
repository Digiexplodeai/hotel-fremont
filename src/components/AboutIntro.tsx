"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Plane, Crown, Sparkles, CheckCircle2 } from "lucide-react";
import { siteConfig } from "@/data/content";

export default function AboutIntro() {
  const { about, stats } = siteConfig;

  return (
    <section id="about" className="relative py-24 lg:py-32 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Decorative Background Lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#C9A96E]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E02B1D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Split Layout: Story & Overlapping Parallax Imagery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Brand Story */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold">
              <span className="w-6 h-[1.5px] bg-[#E02B1D]" />
              <span>{about.eyebrow}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-[1.18]">
              {about.title}
            </h2>

            <p className="text-sm sm:text-base text-[#F7F3EC]/80 leading-relaxed font-light">
              {about.paragraph1}
            </p>

            <p className="text-sm sm:text-base text-[#F7F3EC]/70 leading-relaxed font-light">
              {about.paragraph2}
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {about.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#16161A]/80 border border-white/5 hover:border-[#C9A96E]/30 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#E02B1D] shrink-0 group-hover:scale-110 transition-transform" />
                    <h4 className="text-xs font-semibold text-[#F7F3EC] tracking-wider uppercase font-sans">
                      {feat.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#A8A59E] leading-normal font-light">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Overlapping Luxury Images with Floating Airport Badge */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            <div className="relative w-full aspect-[4/5] sm:aspect-[4/4.5] max-w-lg mx-auto">
              {/* Primary Background Frame */}
              <div className="absolute inset-4 sm:inset-6 rounded-2xl overflow-hidden border border-[#C9A96E]/30 shadow-2xl">
                <Image
                  src={about.imagePrimary}
                  alt="Hotel Fremont Courtyard and Architecture"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10]/80 via-transparent to-transparent" />
              </div>

              {/* Overlapping Secondary Image */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute -bottom-6 -left-2 sm:-left-6 w-3/5 aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#16161A] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10"
              >
                <Image
                  src={about.imageSecondary}
                  alt="Hotel Fremont Luxury Interior Suite"
                  fill
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  className="object-cover"
                />
              </motion.div>

              {/* Floating Proximity USP Badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -top-3 -right-2 sm:-right-4 z-20 glass-panel rounded-2xl p-4 sm:p-5 border border-[#C9A96E]/40 shadow-2xl max-w-[200px]"
              >
                <div className="flex items-center space-x-2 text-[#E02B1D] mb-1">
                  <Plane className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] font-sans font-bold tracking-widest uppercase">
                    Airport USP
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-[#F7F3EC]">
                  10 Mins
                </div>
                <div className="text-[11px] text-[#A8A59E] leading-tight">
                  Direct corridor to Chandigarh Airport (IXC)
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Animated Counters / Metrics Grid */}
        <div className="mt-20 pt-16 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative p-4 rounded-xl hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] mb-2 flex items-center justify-center">
                  <span>{stat.value}</span>
                  <span className="text-[#E02B1D] ml-0.5">{stat.suffix}</span>
                </div>
                <div className="text-xs uppercase tracking-[0.2em] font-sans font-semibold text-[#C9A96E] mb-1">
                  {stat.label}
                </div>
                <div className="text-[11px] text-[#A8A59E] font-light">
                  {stat.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
