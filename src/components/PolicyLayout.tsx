"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { IntroProvider } from "@/context/IntroContext";
import { Calendar, Shield, ArrowLeft, ExternalLink, Phone, Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

interface PolicyLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function PolicyLayout({
  title,
  subtitle,
  lastUpdated = siteConfig.lastUpdated,
  children,
}: PolicyLayoutProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const policyNav = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "Cancellation & Refund", href: "/cancellation-refund-policy" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Contact Us", href: "/contact-us" },
  ];

  return (
    <IntroProvider skipIntro={true}>
      <div className="relative min-h-screen bg-[#0E0E10] text-[#F7F3EC] flex flex-col selection:bg-[#E02B1D] selection:text-white font-sans">
        {/* Navigation Bar */}
        <Navbar onOpenBooking={() => setIsBookingOpen(true)} />

        {/* Policy Header Banner */}
        <section className="relative pt-32 sm:pt-40 pb-12 sm:pb-16 bg-[#09090B] border-b border-white/10 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C9A96E]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb & Back Link */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8A59E] mb-6">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5 text-[#E02B1D]" />
                <span>Home</span>
              </Link>
              <span>/</span>
              <span className="text-[#C9A96E]">Legal & Compliance</span>
              <span>/</span>
              <span className="text-[#F7F3EC] font-medium">{title}</span>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E02B1D]/10 border border-[#E02B1D]/20 text-[11px] font-mono tracking-widest text-[#C9A96E] uppercase">
                <Shield className="w-3.5 h-3.5 text-[#E02B1D]" />
                <span>OFFICIAL HOTEL POLICY</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F7F3EC] tracking-tight leading-tight">
                {title}
              </h1>

              {subtitle && (
                <p className="text-sm sm:text-base text-[#A8A59E] font-light max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}

              {/* Last Updated Pill */}
              <div className="flex items-center gap-2 pt-2 text-xs text-[#A8A59E] font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span>Last Updated: <strong className="text-[#F7F3EC] font-normal">{lastUpdated}</strong></span>
              </div>
            </div>

            {/* Quick Navigation Between Legal Pages */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
              <span className="text-[#A8A59E] shrink-0 font-medium mr-1">Policies:</span>
              {policyNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg border shrink-0 transition-all ${
                    title.toLowerCase().includes(item.label.toLowerCase().slice(0, 5))
                      ? "bg-[#E02B1D]/15 border-[#E02B1D]/40 text-[#F7F3EC] font-semibold"
                      : "bg-[#151518] border-white/5 text-[#A8A59E] hover:text-white hover:border-white/20"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Policy Content Body */}
        <main className="flex-1 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <article className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-[#D4D2CD] space-y-8">
              {children}
            </article>

            {/* Contact Support Assistance Card */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-[#F7F3EC]">
                      Questions Regarding Our Policies?
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A8A59E] mt-1">
                      Our concierge and management team is available 24/7 to address any clarifications.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={siteConfig.phoneTel}
                      className="px-4 py-2.5 rounded-xl bg-[#E02B1D] hover:bg-[#c82215] text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shadow"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Concierge</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5 text-xs text-[#A8A59E]">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{siteConfig.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#C9A96E] shrink-0" />
                    <a href={siteConfig.phoneTel} className="hover:text-white transition">
                      {siteConfig.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#C9A96E] shrink-0" />
                    <a href={`mailto:${siteConfig.email}`} className="hover:text-white transition">
                      {siteConfig.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Global Footer */}
        <Footer />

        {/* Interactive Booking Modal */}
        <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      </div>
    </IntroProvider>
  );
}

