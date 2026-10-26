"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Calendar, Menu, X, ArrowRight, MapPin } from "lucide-react";
import { siteConfig } from "@/data/content";

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const navLinks = siteConfig.navLinks;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? "py-3 bg-[#0E0E10]/85 backdrop-blur-md border-b border-[#C9A96E]/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            : "py-6 bg-gradient-to-b from-[#0E0E10]/80 via-[#0E0E10]/40 to-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="relative flex items-center group focus:outline-none"
              aria-label="Hotel Fremont Home"
            >
              <div className="relative h-11 w-48 sm:h-12 sm:w-56 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/assets/logo.png"
                  alt="Hotel Fremont"
                  fill
                  priority
                  className="object-contain object-left"
                />
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-7">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-xs uppercase tracking-[0.22em] text-[#F7F3EC]/85 hover:text-[#C9A96E] transition-colors duration-200 link-underline font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center space-x-5">
              <a
                href={siteConfig.contact.phoneTel}
                className="flex items-center space-x-2 text-xs uppercase tracking-[0.18em] text-[#C9A96E] hover:text-[#F7F3EC] transition-colors"
                title="Call Hotel Fremont Reception"
              >
                <Phone className="w-3.5 h-3.5 text-[#E02B1D]" />
                <span className="font-semibold">{siteConfig.contact.phoneDisplay}</span>
              </a>

              <button
                onClick={onOpenBooking}
                className="relative group overflow-hidden px-6 py-2.5 rounded-full bg-[#E02B1D] text-white text-xs uppercase tracking-[0.22em] font-semibold transition-all duration-300 shadow-[0_4px_20px_rgba(224,43,29,0.35)] hover:shadow-[0_4px_25px_rgba(224,43,29,0.6)] hover:bg-[#c82215] btn-magnetic flex items-center space-x-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Now</span>
              </button>
            </div>

            {/* Mobile Actions: Call + Hamburger */}
            <div className="flex lg:hidden items-center space-x-3">
              <button
                onClick={onOpenBooking}
                className="px-3.5 py-1.5 rounded-full bg-[#E02B1D] text-white text-[11px] uppercase tracking-[0.16em] font-semibold shadow-md flex items-center space-x-1.5"
              >
                <Calendar className="w-3 h-3" />
                <span>Book</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#F7F3EC] hover:text-[#C9A96E] transition-colors focus:outline-none"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-[#E02B1D]" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-30 bg-[#0E0E10]/98 backdrop-blur-xl flex flex-col justify-between pt-24 pb-8 px-6 lg:hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-[#E02B1D]/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col space-y-5 my-auto">
              <span className="text-[11px] font-sans tracking-[0.3em] text-[#C9A96E] uppercase">
                Explore The Hotel
              </span>

              {navLinks.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-2xl font-serif tracking-wider text-[#F7F3EC] hover:text-[#E02B1D] py-2 border-b border-white/5 transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-[#C9A96E]" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mobile Drawer Bottom Info */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-start space-x-2 text-xs text-[#A8A59E]">
                <MapPin className="w-4 h-4 text-[#E02B1D] shrink-0 mt-0.5" />
                <span>{siteConfig.contact.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={siteConfig.contact.phoneTel}
                  className="flex items-center justify-center space-x-2 py-3 rounded-lg border border-[#C9A96E]/40 text-xs uppercase tracking-widest text-[#C9A96E] hover:bg-[#C9A96E]/10 font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Hotel</span>
                </a>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                  className="flex items-center justify-center space-x-2 py-3 rounded-lg bg-[#E02B1D] text-xs uppercase tracking-widest text-white font-semibold shadow-lg hover:bg-[#c82215]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Stay</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
