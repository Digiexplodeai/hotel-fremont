"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Calendar, ArrowRight, MapPin, X } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useIntro } from "@/context/IntroContext";
import { useSiteSlots } from "@/context/SiteSlotsContext";
import { extractTargetId, navigateToSection, lockScroll, unlockScroll } from "@/lib/scroll";

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const { isIntroDone } = useIntro();
  const { slots } = useSiteSlots();
  const logoUrl = slots["branding.logo"]?.url || "/assets/logo.png";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("rooms");
  const lastScrollY = useRef(0);

  // Scroll listener for header shrink (40px) and hide/reveal (translateY)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 40px threshold for frosted glass & shrink
      if (currentScrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Hide on scroll down past 200px, show on scroll up
      if (mobileMenuOpen) {
        setIsVisible(true);
        return;
      }

      const diff = currentScrollY - lastScrollY.current;
      if (diff > 8 && currentScrollY > 200) {
        // Scrolling down past 200px -> slide up out of view
        setIsVisible(false);
      } else if (diff < -5 || currentScrollY <= 200) {
        // Scrolling up or near page top -> slide back into view
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  // Scroll-spy with IntersectionObserver for active section link
  useEffect(() => {
    const sectionIds = ["rooms", "dining", "amenities", "events", "gallery", "location", "contact"];
    const observers: IntersectionObserver[] = [];

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -55% 0px",
      threshold: 0,
    };

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const obs = new IntersectionObserver(observerCallback, observerOptions);
        obs.observe(el);
        observers.push(obs);
      }
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  // Body scroll lock while mobile menu is open & close on Escape key
  useEffect(() => {
    if (mobileMenuOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Smooth scroll using centralized navigateToSection
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    navigateToSection(href, () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    });
  };

  const navLinks = siteConfig.navLinks;

  return (
    <>
      {/* Permanent subtle top gradient behind the header for contrast on bright photos when at top */}
      <div
        className={`fixed inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none z-40 transition-opacity duration-300 ${
          isScrolled ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Main Fixed Header with Hide/Reveal & Fade/Slide Entry */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-out ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl border-b border-[#E5DFD7] shadow-[0_4px_25px_rgba(36,39,43,0.06)]"
            : "bg-transparent border-b border-transparent"
        }`}
        style={{
          transform: isVisible ? "translateY(0%)" : "translateY(-100%)",
          opacity: isIntroDone ? 1 : 0,
          transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1), opacity 800ms ease, background-color 300ms ease, height 300ms ease",
        }}
      >
        <div
          className={`max-w-[1440px] mx-auto px-6 lg:px-10 grid grid-cols-[auto_1fr_auto] items-center transition-all duration-300 ease-out ${
            isScrolled ? "h-16" : "h-20"
          }`}
        >
          {/* Column 1: Left Logo Wrapper */}
          <div className="w-[170px] lg:w-[190px] xl:w-[200px] 2xl:w-[220px] shrink-0 flex items-center justify-start">
            <Link
              href="/"
              className="relative flex items-center p-1.5 focus:outline-none w-full"
              aria-label="Hotel Fremont Home"
            >
              <Image
                src={logoUrl}
                alt="Hotel Fremont"
                width={360}
                height={32}
                priority
                style={{ width: "auto" }}
                className={`transition-all duration-300 object-contain object-left block max-w-full ${
                  isScrolled ? "h-7 sm:h-8 md:h-9" : "h-8 sm:h-9 md:h-11"
                }`}
              />
            </Link>
          </div>

          {/* Column 2: Centre Nav Links */}
          <nav className="hidden lg:flex items-center justify-center gap-4 xl:gap-5.5 2xl:gap-8 whitespace-nowrap text-[11px] xl:text-[12px] tracking-[0.16em] xl:tracking-[0.18em] uppercase font-medium px-2">
            {navLinks.map((item) => {
              const targetId = extractTargetId(item.href);
              const isActive = activeSection === targetId;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`relative py-1.5 transition-colors duration-200 group ${
                    isScrolled
                      ? isActive
                        ? "text-[#742B40] font-semibold"
                        : "text-[#24272B] hover:text-[#742B40]"
                      : isActive
                      ? "text-[#DFC28A] font-semibold [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)]"
                      : "text-white/95 hover:text-white [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)]"
                  }`}
                >
                  <span>{item.label}</span>

                  {/* Underline on hover or active */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[2px] origin-left transition-transform duration-300 ease-out pointer-events-none ${
                      isScrolled ? "bg-[#742B40]" : "bg-[#DFC28A]"
                    } ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Column 3: Right Action Area (Phone + Book Now + Mobile Hamburger) */}
          <div className="shrink-0 flex items-center justify-end space-x-5">
            {/* Phone Number */}
            <a
              href={siteConfig.contact.phoneTel}
              className={`hidden min-[1360px]:flex items-center space-x-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                isScrolled
                  ? "text-[#742B40] hover:text-[#24272B]"
                  : "text-[#DFC28A] hover:text-white [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)]"
              }`}
              title="Call Hotel Fremont Reception"
            >
              <Phone className="w-3.5 h-3.5 text-[#742B40]" />
              <span className="font-semibold">{siteConfig.contact.phoneDisplay}</span>
            </a>

            {/* Desktop Book Now Button */}
            <button
              onClick={onOpenBooking}
              className="hidden sm:flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#742B40] hover:bg-[#5C2033] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-[0_4px_15px_rgba(116,43,64,0.3)] hover:shadow-[0_4px_22px_rgba(116,43,64,0.5)] btn-magnetic cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Now</span>
            </button>

            {/* Mobile / Tablet Quick Book + Hamburger */}
            <div className="flex lg:hidden items-center space-x-3">
              <button
                onClick={onOpenBooking}
                className="sm:hidden px-3.5 py-1.5 rounded-full bg-[#742B40] hover:bg-[#5C2033] text-white text-[11px] uppercase tracking-[0.16em] font-semibold shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Calendar className="w-3 h-3" />
                <span>Book</span>
              </button>

              {/* Hamburger Icon */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`w-11 h-11 flex flex-col items-center justify-center space-y-1.5 focus:outline-none cursor-pointer ${
                  isScrolled ? "text-[#24272B]" : "text-white"
                }`}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                <span
                  className={`w-6 h-[2px] bg-current transform transition-all duration-300 ${
                    mobileMenuOpen ? "rotate-45 translate-y-2 bg-[#742B40]" : ""
                  }`}
                />
                <span
                  className={`w-6 h-[2px] bg-current transition-all duration-300 ${
                    mobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`w-6 h-[2px] bg-current transform transition-all duration-300 ${
                    mobileMenuOpen ? "-rotate-45 -translate-y-2 bg-[#742B40]" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Navigation Overlay (Warm Ivory Light Theme) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-nav-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[70] bg-[#F8F6F2]/98 backdrop-blur-2xl flex flex-col justify-between pt-6 pb-8 px-6 lg:hidden overflow-y-auto text-[#24272B]"
          >
            {/* Top Bar with Logo & Close (X) Button */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD7] shrink-0">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center p-1 focus:outline-none"
                aria-label="Hotel Fremont Home"
              >
                <Image
                  src={logoUrl}
                  alt="Hotel Fremont"
                  width={280}
                  height={28}
                  style={{ width: "auto" }}
                  className="h-8 sm:h-9 object-contain object-left block"
                />
              </Link>

              {/* Tap Target Close Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-[#742B40] text-[#24272B] hover:text-white border border-[#E5DFD7] hover:border-[#742B40] transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#742B40]"
                aria-label="Close navigation menu"
                title="Close navigation menu"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col space-y-3 my-auto py-6">
              <span className="text-[11px] font-sans tracking-[0.3em] text-[#742B40] uppercase font-bold">
                Hotel Fremont Navigation
              </span>

              {navLinks.map((item, index) => {
                const targetId = extractTargetId(item.href);
                const isActive = activeSection === targetId;

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.04, duration: 0.3 }}
                  >
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={`flex items-center justify-between text-2xl sm:text-3xl font-serif tracking-wider py-3 border-b border-[#E5DFD7] transition-colors cursor-pointer ${
                        isActive ? "text-[#742B40] font-semibold" : "text-[#24272B] hover:text-[#742B40]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowRight className={`w-5 h-5 transition-transform ${isActive ? "text-[#742B40] translate-x-1" : "text-[#B69A68] opacity-70"}`} />
                    </a>
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile Footer CTAs */}
            <div className="pt-4 border-t border-[#E5DFD7] space-y-4 shrink-0">
              <div className="flex items-center space-x-2 text-xs text-[#64615D]">
                <MapPin className="w-3.5 h-3.5 text-[#742B40] shrink-0" />
                <span className="truncate">{siteConfig.contact.address}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={siteConfig.contact.phoneTel}
                  className="text-xs uppercase tracking-widest text-[#24272B] flex items-center space-x-1.5 font-semibold"
                >
                  <Phone className="w-3.5 h-3.5 text-[#742B40]" />
                  <span>{siteConfig.contact.phoneDisplay}</span>
                </a>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                  className="px-6 py-3 rounded-full bg-[#742B40] hover:bg-[#5C2033] text-white text-xs uppercase tracking-[0.2em] font-semibold shadow-md cursor-pointer"
                >
                  Book Your Stay
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
