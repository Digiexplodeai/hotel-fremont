"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Calendar, ArrowRight, MapPin } from "lucide-react";
import { siteConfig } from "@/data/content";
import { useIntro } from "@/context/IntroContext";
import { useSiteSlots } from "@/context/SiteSlotsContext";

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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Smooth scroll using Lenis or native fallback
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const headerHeight = isScrolled ? 64 : 80;
    const lenis = (typeof window !== "undefined" ? (window as any).__lenis : null);

    if (lenis) {
      lenis.scrollTo(targetEl, { offset: -headerHeight, duration: 1.2 });
    } else {
      const top = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }

    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const navLinks = siteConfig.navLinks;

  return (
    <>
      {/* Permanent subtle top gradient behind the header for contrast on bright photos */}
      <div className="fixed inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none z-40" />

      {/* Main Fixed Header with Hide/Reveal & Fade/Slide Entry */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-400 ease-out ${
          isScrolled
            ? "bg-[#0E0E10]/75 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            : "bg-transparent border-b border-transparent"
        }`}
        style={{
          transform: isVisible ? "translateY(0%)" : "translateY(-100%)",
          opacity: isIntroDone ? 1 : 0,
          transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1), opacity 800ms ease, background-color 400ms ease, height 400ms ease",
        }}
      >
        <div
          className={`max-w-[1440px] mx-auto px-6 lg:px-10 grid grid-cols-[auto_1fr_auto] items-center transition-all duration-400 ease-out ${
            isScrolled ? "h-16" : "h-20"
          }`}
        >
          {/* Column 1: Left Logo Wrapper with reserved width (w-[170px] lg:w-[190px] xl:w-[200px] 2xl:w-[220px]) */}
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
                className={`transition-all duration-400 object-contain object-left block max-w-full ${
                  isScrolled ? "h-7 sm:h-8 md:h-9" : "h-8 sm:h-9 md:h-11"
                }`}
              />
            </Link>
          </div>

          {/* Column 2: Centre Nav Links - Always centered with generous breathing room */}
          <nav className="hidden lg:flex items-center justify-center gap-4 xl:gap-5.5 2xl:gap-8 whitespace-nowrap text-[11px] xl:text-[12px] tracking-[0.16em] xl:tracking-[0.18em] uppercase font-medium px-2">
            {navLinks.map((item) => {
              const targetId = item.href.replace("#", "");
              const isActive = activeSection === targetId;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`relative py-1.5 transition-colors duration-200 group [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)] ${
                    isActive ? "text-[#E02B1D]" : "text-[#F7F3EC] hover:text-[#E02B1D]"
                  }`}
                >
                  <span>{item.label}</span>

                  {/* Underline on hover (draws left to right) */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#E02B1D] origin-left transition-transform duration-300 ease-out pointer-events-none ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Column 3: Right Action Area (Phone + Book Now + Mobile Hamburger) */}
          <div className="shrink-0 flex items-center justify-end space-x-5">
            {/* Phone Number - Visible only from 1360px+ to ensure center nav never cramps */}
            <a
              href={siteConfig.contact.phoneTel}
              className="hidden min-[1360px]:flex items-center space-x-2 text-xs uppercase tracking-[0.18em] text-[#C9A96E] hover:text-[#F7F3EC] transition-colors [text-shadow:_0_1px_8px_rgba(0,0,0,0.85)]"
              title="Call Hotel Fremont Reception"
            >
              <Phone className="w-3.5 h-3.5 text-[#E02B1D]" />
              <span className="font-semibold">{siteConfig.contact.phoneDisplay}</span>
            </a>

            {/* Desktop Book Now Button */}
            <button
              onClick={onOpenBooking}
              className="hidden sm:flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#E02B1D] text-white text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-[0_4px_20px_rgba(224,43,29,0.35)] hover:shadow-[0_4px_25px_rgba(224,43,29,0.6)] hover:bg-[#c82215] btn-magnetic cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Now</span>
            </button>

            {/* Mobile / Tablet Quick Book + Animated Hamburger (Visible below 1024px) */}
            <div className="flex lg:hidden items-center space-x-3">
              <button
                onClick={onOpenBooking}
                className="sm:hidden px-3.5 py-1.5 rounded-full bg-[#E02B1D] text-white text-[11px] uppercase tracking-[0.16em] font-semibold shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Calendar className="w-3 h-3" />
                <span>Book</span>
              </button>

              {/* Animated Hamburger Icon */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 flex flex-col items-center justify-center space-y-1.5 text-[#F7F3EC] focus:outline-none cursor-pointer"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <span
                  className={`w-6 h-[2px] bg-current transform transition-all duration-300 ${
                    mobileMenuOpen ? "rotate-45 translate-y-2 bg-[#E02B1D]" : ""
                  }`}
                />
                <span
                  className={`w-6 h-[2px] bg-current transition-all duration-300 ${
                    mobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`w-6 h-[2px] bg-current transform transition-all duration-300 ${
                    mobileMenuOpen ? "-rotate-45 -translate-y-2 bg-[#E02B1D]" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Navigation Overlay (z-[60]) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-nav-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] bg-[#0E0E10]/98 backdrop-blur-2xl flex flex-col justify-between pt-24 pb-8 px-6 lg:hidden"
          >
            <div className="flex flex-col space-y-4 my-auto">
              <span className="text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase font-semibold">
                Hotel Fremont Navigation
              </span>

              {navLinks.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.05, duration: 0.35 }}
                >
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="flex items-center justify-between text-2xl font-serif tracking-wider text-[#F7F3EC] hover:text-[#E02B1D] py-2.5 border-b border-white/5 transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-[#C9A96E] opacity-60" />
                  </a>
                </motion.div>
              ))}
            </div>

            {/* Mobile Footer CTAs */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center space-x-2 text-xs text-[#C9A96E]">
                <MapPin className="w-3.5 h-3.5 text-[#E02B1D] shrink-0" />
                <span>{siteConfig.contact.address}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={siteConfig.contact.phoneTel}
                  className="text-xs uppercase tracking-widest text-[#F7F3EC] flex items-center space-x-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[#E02B1D]" />
                  <span>{siteConfig.contact.phoneDisplay}</span>
                </a>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                  className="px-6 py-3 rounded-full bg-[#E02B1D] text-white text-xs uppercase tracking-[0.2em] font-semibold shadow-lg cursor-pointer"
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
