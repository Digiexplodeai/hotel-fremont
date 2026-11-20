"use client";

import { useState, useEffect } from "react";
import Preloader from "@/components/Preloader";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutIntro from "@/components/AboutIntro";
import RoomsSection from "@/components/RoomsSection";
import AmenitiesSection from "@/components/AmenitiesSection";
import DiningSection from "@/components/DiningSection";
import EventsSection from "@/components/EventsSection";
import GallerySection from "@/components/GallerySection";
import LocationSection from "@/components/LocationSection";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import FloatingMobileActions from "@/components/FloatingMobileActions";
import BookingModal from "@/components/BookingModal";

import { IntroProvider, useIntro } from "@/context/IntroContext";
import { scrollToSection } from "@/lib/scroll";

/**
 * Handles automatic scrolling to section hashes (e.g. /#rooms, /#dining)
 * once the intro sequence is complete or on direct navigation.
 */
function HashScrollHandler() {
  const { isIntroDone } = useIntro();

  useEffect(() => {
    if (!isIntroDone || typeof window === "undefined") return;

    if (window.location.hash) {
      const hash = window.location.hash;
      // Slight delay for Lenis, layout calculations and font settling
      const timer = setTimeout(() => {
        scrollToSection(hash);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isIntroDone]);

  return null;
}

export default function HomeClient() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState<{
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
    guests?: number;
  }>({});

  const handleOpenBooking = (data?: {
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
    guests?: number;
  }) => {
    if (data) {
      setBookingInitialData(data);
    }
    setIsBookingOpen(true);
  };

  const handleBookRoom = (roomId: string) => {
    setBookingInitialData((prev) => ({
      ...prev,
      roomType: roomId,
    }));
    setIsBookingOpen(true);
  };

  return (
    <IntroProvider>
      <SmoothScroll>
        <Preloader />
        <CustomCursor />
        <HashScrollHandler />

        {/* Main Page Layout - Warm Ivory Light Theme */}
        <div className="relative min-h-screen bg-[#F8F6F2] text-[#24272B] flex flex-col selection:bg-[#742B40] selection:text-white">
          {/* Elegant Navigation */}
          <Navbar onOpenBooking={() => handleOpenBooking()} />

          {/* Hero Section with Exterior Building Photo & Booking Bar */}
          <main className="flex-1">
            <Hero
              onCheckAvailability={(data) => handleOpenBooking(data)}
              onExploreSuites={() => {
                scrollToSection("rooms");
              }}
            />

            {/* About / Heritage Story — Warm Ivory #F8F6F2 */}
            <AboutIntro />

            {/* Rooms & Suites Showcase — Soft Sand #EEE8DF */}
            <RoomsSection onBookRoom={handleBookRoom} />

            {/* Hotel Facilities — Warm Ivory #F8F6F2 */}
            <AmenitiesSection />

            {/* In-House Restaurant & Dining — Soft Sand #EEE8DF */}
            <DiningSection />

            {/* Banquets & Events — Warm Ivory #F8F6F2 */}
            <EventsSection />

            {/* Property Gallery — Soft Sand #EEE8DF */}
            <GallerySection />

            {/* Location & Directions — Soft Sand #EEE8DF */}
            <LocationSection />

            {/* Final Call to Action — Warm Ivory #F8F6F2 */}
            <FinalCta onOpenBooking={() => handleOpenBooking()} />
          </main>

          {/* Grounded Charcoal Luxury Footer #24272B */}
          <Footer />

          {/* Persistent Floating Bottom Bar for Mobile Only */}
          <FloatingMobileActions onOpenBooking={() => handleOpenBooking()} />

          {/* Seamless Real-time Booking Modal */}
          <BookingModal
            isOpen={isBookingOpen}
            onClose={() => setIsBookingOpen(false)}
            initialData={bookingInitialData}
          />
        </div>
      </SmoothScroll>
    </IntroProvider>
  );
}
