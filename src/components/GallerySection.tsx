"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import GalleryLightbox, { GalleryItem } from "./GalleryLightbox";

const categories = ["All", "Property", "Rooms", "Venues"];

export default function GallerySection() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const { slots } = useSiteSlots();

  const potentialItems: (GalleryItem & { active: boolean })[] = [
    {
      id: 1,
      title: "Hotel Fremont Facade",
      category: "Property",
      src: slots["exterior"]?.url || "/assets/hero/hero-lobby.webp",
      active: true,
      span: "col-span-1 sm:col-span-2",
    },
    {
      id: 2,
      title: "Super Deluxe Room",
      category: "Rooms",
      src: slots["super-deluxe"]?.url || "",
      active: !!(slots["super-deluxe"]?.url && slots["super-deluxe"]?.isActive !== false && slots["super-deluxe"]?.is_active !== false),
      span: "col-span-1",
    },
    {
      id: 3,
      title: "Premium Room",
      category: "Rooms",
      src: slots["premium"]?.url || "",
      active: !!(slots["premium"]?.url && slots["premium"]?.isActive !== false && slots["premium"]?.is_active !== false),
      span: "col-span-1",
    },
    {
      id: 4,
      title: "Cloud Six Banquet",
      category: "Venues",
      src: slots["cloud-six-banquet"]?.url || "",
      active: !!(slots["cloud-six-banquet"]?.url && slots["cloud-six-banquet"]?.isActive !== false && slots["cloud-six-banquet"]?.is_active !== false),
      span: "col-span-1 sm:col-span-2",
    },
  ];

  const galleryItems = potentialItems.filter((item) => item.active && item.src);

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
    <section id="gallery" className="relative py-24 lg:py-32 bg-[#EEE8DF] text-[#24272B] overflow-hidden scroll-mt-20 lg:scroll-mt-24">
      {/* Background radial accent tint */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#B69A68]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading & Category Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center space-x-2 text-[11px] font-sans tracking-[0.3em] text-[#742B40] uppercase font-bold mb-3">
              <span className="w-6 h-[2px] bg-[#742B40]" />
              <span>PROPERTY GALLERY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#24272B] leading-tight">
              A Glimpse of Hotel Fremont
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-sans uppercase tracking-widest font-semibold transition-all duration-300 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#742B40] text-white shadow-md"
                    : "bg-white text-[#64615D] hover:text-[#24272B] border border-[#E5DFD7] hover:border-[#B69A68]"
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
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-white border border-[#E5DFD7] hover:border-[#B69A68] cursor-pointer shadow-md hover:shadow-xl transition-all"
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
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F2] via-[#EEE8DF] to-[#E5DFD7] flex flex-col items-center justify-center p-4 text-center">
                    <div className="relative w-32 h-10 mb-2 opacity-85">
                      <Image
                        src="/assets/logo.png"
                        alt="Hotel Fremont"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#742B40] font-sans font-semibold">
                      {item.title}
                    </span>
                  </div>
                )}

                {/* Dark Vignette Overlay on Hover for crisp text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] font-sans tracking-[0.2em] text-[#DFC28A] uppercase font-semibold mb-1">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-serif font-bold text-white leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-1 text-[11px] text-[#DFC28A] mt-2 font-sans font-semibold">
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
