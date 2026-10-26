"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Sparkles } from "lucide-react";
import { siteConfig } from "@/data/content";
import GalleryLightbox, { GalleryItem } from "./GalleryLightbox";

const categories = ["All", "Architecture", "Suites", "Dining", "Events"];

export default function GallerySection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryItems = siteConfig.gallery as GalleryItem[];

  const filteredItems =
    activeCategory === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  const handleNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
  };

  return (
    <section id="gallery" className="relative py-24 lg:py-32 bg-[#0E0E10] text-[#F7F3EC] overflow-hidden">
      {/* Background radial tint */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#C9A96E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading & Category Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold mb-3">
              <span className="w-6 h-[1.5px] bg-[#E02B1D]" />
              <span>VISUAL JOURNAL</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] leading-tight">
              Moments of Splendour
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-sans uppercase tracking-widest font-semibold transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-[#E02B1D] text-white shadow-[0_2px_15px_rgba(224,43,29,0.4)]"
                    : "bg-[#151518] text-[#A8A59E] hover:text-[#F7F3EC] border border-white/5 hover:border-[#C9A96E]/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Masonry-Styled Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                onClick={() => setLightboxIndex(index)}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#151518] border border-white/10 hover:border-[#C9A96E]/50 cursor-pointer shadow-lg"
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Dark Vignette Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10]/90 via-[#0E0E10]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <span className="text-[10px] font-sans tracking-[0.2em] text-[#C9A96E] uppercase font-semibold mb-1">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-serif font-bold text-[#F7F3EC] leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-1 text-[11px] text-[#E02B1D] mt-2 font-sans font-semibold">
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox Component */}
      <GalleryLightbox
        items={filteredItems}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </section>
  );
}
