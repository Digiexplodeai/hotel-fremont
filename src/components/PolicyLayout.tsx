"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { IntroProvider } from "@/context/IntroContext";
import { Calendar, Shield, ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
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
      <div className="relative min-h-screen bg-[#F8F6F2] text-[#24272B] flex flex-col selection:bg-[#742B40] selection:text-white font-sans">
        {/* Navigation Bar */}
        <Navbar onOpenBooking={() => setIsBookingOpen(true)} />

        {/* Policy Header Banner - Soft Sand #EEE8DF */}
        <section className="relative pt-32 sm:pt-40 pb-12 sm:pb-16 bg-[#EEE8DF] border-b border-[#E5DFD7] overflow-hidden">
          {/* Subtle Ambient Accent Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#B69A68]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb & Back Link */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64615D] mb-6">
              <Link href="/" className="hover:text-[#742B40] transition-colors flex items-center gap-1.5 font-medium">
                <ArrowLeft className="w-3.5 h-3.5 text-[#742B40]" />
                <span>Home</span>
              </Link>
              <span>/</span>
              <span className="text-[#742B40] font-medium">Legal & Compliance</span>
              <span>/</span>
              <span className="text-[#24272B] font-semibold">{title}</span>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#742B40]/10 border border-[#742B40]/25 text-[11px] font-sans tracking-widest text-[#742B40] uppercase font-bold">
                <Shield className="w-3.5 h-3.5 text-[#742B40]" />
                <span>OFFICIAL HOTEL POLICY</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#24272B] tracking-tight leading-tight">
                {title}
              </h1>

              {subtitle && (
                <p className="text-sm sm:text-base text-[#64615D] font-normal max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}

              {/* Last Updated Pill */}
              <div className="flex items-center gap-2 pt-2 text-xs text-[#64615D] font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#742B40]" />
                <span>Last Updated: <strong className="text-[#24272B] font-semibold">{lastUpdated}</strong></span>
              </div>
            </div>

            {/* Quick Navigation Between Legal Pages */}
            <div className="mt-8 pt-6 border-t border-[#E5DFD7] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[#64615D] shrink-0 font-semibold mr-1">Policies:</span>
              {policyNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg border shrink-0 transition-all font-medium ${
                    title.toLowerCase().includes(item.label.toLowerCase().slice(0, 5))
                      ? "bg-[#742B40] border-[#742B40] text-white shadow-sm"
                      : "bg-white border-[#E5DFD7] text-[#64615D] hover:text-[#24272B] hover:border-[#B69A68]"
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
            <article className="prose max-w-none text-sm sm:text-base leading-relaxed text-[#24272B] space-y-8 prose-headings:text-[#24272B] prose-p:text-[#64615D] prose-strong:text-[#24272B] prose-li:text-[#64615D]">
              {children}
            </article>

            {/* Contact Support Assistance Card */}
            <div className="mt-16 pt-8 border-t border-[#E5DFD7]">
              <div className="bg-white border border-[#E5DFD7] rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-[#24272B]">
                      Questions Regarding Our Policies?
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64615D] mt-1 font-normal">
                      Our concierge and management team is available 24/7 to address any clarifications.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={siteConfig.phoneTel}
                      className="px-4 py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5C2033] text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Concierge</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E5DFD7] text-xs text-[#64615D]">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#742B40] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{siteConfig.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#742B40] shrink-0" />
                    <a href={siteConfig.phoneTel} className="hover:text-[#24272B] font-medium transition">
                      {siteConfig.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#742B40] shrink-0" />
                    <a href={`mailto:${siteConfig.email}`} className="hover:text-[#24272B] font-medium transition">
                      {siteConfig.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Global Grounded Dark Charcoal Footer */}
        <Footer />

        {/* Interactive Booking Modal */}
        <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      </div>
    </IntroProvider>
  );
}
