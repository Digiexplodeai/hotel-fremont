"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Sparkles } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import GalleryLightbox, { GalleryItem } from "./GalleryLightbox";

const categories = ["All", "Architecture", "Suites", "Dining", "Events"];

export default function GallerySection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const { slots } = useSiteSlots();

  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      title: "Hotel Fremont Facade at Dusk",
      category: "Architecture",
      src: slots["hero.slide_3"]?.url || "/assets/hero/hero-lobby.webp",
      span: "col-span-2 row-span-2",
    },
    {
      id: 2,
      title: "The Royal Fremont Suite",
      category: "Suites",
      src: slots["rooms.royal-fremont.main"]?.url || "/assets/placeholder.svg",
      span: "col-span-1 row-span-1",
    },
    {
      id: 3,
      title: "Aura Fine Dining & Cocktail Bar",
      category: "Dining",
      src: slots["dining.banner_primary"]?.url || "/assets/placeholder.svg",
      span: "col-span-1 row-span-1",
    },
    {
      id: 4,
      title: "Grand Fremont Ballroom",
      category: "Events",
      src: slots["events.venue_1"]?.url || "/assets/placeholder.svg",
      span: "col-span-1 row-span-2",
    },
    {
      id: 5,
      title: "Presidential Penthouse",
      category: "Suites",
      src: slots["rooms.presidential-penthouse.main"]?.url || "/assets/placeholder.svg",
      span: "col-span-1 row-span-1",
    },
    {
      id: 6,
      title: "Premier Executive Suite",
      category: "Suites",
      src: slots["rooms.premier-executive.main"]?.url || "/assets/placeholder.svg",
      span: "col-span-1 row-span-1",
    },
    {
      id: 7,
      title: "The Fremont Terrace Lawn",
      category: "Events",
      src: slots["events.venue_2"]?.url || "/assets/placeholder.svg",
      span: "col-span-1 row-span-1",
    },
    {
      id: 8,
      title: "Deluxe King Room Sanctuary",
      category: "Suites",
      src: slots["rooms.deluxe-king.main"]?.url || "/assets/placeholder.svg",
      span: "col-span-1 row-span-1",
    },
  ];

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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setLightboxIndex(index)}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#151518] border border-white/10 hover:border-[#C9A96E]/50 cursor-pointer shadow-lg"
              >
                {!failedImages[item.id] ? (
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C22] via-[#0E0E10] to-[#141417] flex flex-col items-center justify-center p-4 text-center">
                    <div className="relative w-32 h-10 mb-2 opacity-85">
                      <Image
                        src="/assets/logo.png"
                        alt="Hotel Fremont"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#C9A96E] font-sans">
                      {item.title}
                    </span>
                  </div>
                )}

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
