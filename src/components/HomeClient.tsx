"use client";

import { useState } from "react";
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
import TestimonialsSection from "@/components/TestimonialsSection";
import LocationSection from "@/components/LocationSection";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import FloatingMobileActions from "@/components/FloatingMobileActions";
import BookingModal from "@/components/BookingModal";

import { IntroProvider } from "@/context/IntroContext";

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

        {/* Main Page Layout */}
        <div className="relative min-h-screen bg-[#0E0E10] text-[#F7F3EC] flex flex-col selection:bg-[#E02B1D] selection:text-white">
          {/* Transparent & Frosted Glass Navigation */}
          <Navbar onOpenBooking={() => handleOpenBooking()} />

          {/* Hero Section with Cinematic Background & Floating Booking Bar */}
          <main className="flex-1">
            <Hero
              onCheckAvailability={(data) => handleOpenBooking(data)}
              onExploreSuites={() => {
                const roomsEl = document.getElementById("rooms");
                roomsEl?.scrollIntoView({ behavior: "smooth" });
              }}
            />

            {/* About / Heritage Story & Overlapping Parallax Visuals */}
            <AboutIntro />

            {/* Rooms & Suites Showcase with Modal Gallery */}
            <RoomsSection onBookRoom={handleBookRoom} />

            {/* 8-Icon Luxury Amenities Grid */}
            <AmenitiesSection />

            {/* Aura Fine Dining & Lounge with Table Reservation Modal */}
            <DiningSection />

            {/* Grand Banquets & Corporate Event Venues */}
            <EventsSection />

            {/* Visual Gallery Masonry Grid & Fullscreen Lightbox */}
            <GallerySection />

            {/* Verified Google 4.9 Star Guest Testimonials Carousel */}
            <TestimonialsSection />

            {/* Interactive Google Map & Airport Proximity Card */}
            <LocationSection />

            {/* Grand Final CTA Band */}
            <FinalCta onOpenBooking={() => handleOpenBooking()} />
          </main>

          {/* Luxury Brand Footer & Direct Contacts */}
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
