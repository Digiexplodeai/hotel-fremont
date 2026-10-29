"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, ArrowUp } from "lucide-react";
import { siteConfig } from "@/data/content";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function LinkedinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect width="4" height="12" x="2" y="9"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
    </svg>
  );
}

const socialIcons: Record<string, React.ElementType> = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  Linkedin: LinkedinIcon,
  Youtube: YoutubeIcon,
};

export default function Footer() {
  const { footer, contact } = siteConfig;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="contact" className="relative bg-[#09090B] text-[#F7F3EC] border-t border-white/10 pt-20 pb-28 sm:pb-16 overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C9A96E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-white/10">
          {/* Brand Info & Logo Column */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="inline-block" aria-label="Hotel Fremont">
              <Image
                src="/assets/logo.png"
                alt="HOTEL FREMONT"
                width={360}
                height={32}
                style={{ width: "auto" }}
                className="h-10 sm:h-12 object-contain object-left block"
              />
            </Link>

            <p className="text-xs sm:text-sm text-[#A8A59E] font-light leading-relaxed max-w-sm">
              {footer.about}
            </p>

            {/* Social Icons */}
            <div className="flex items-center space-x-3 pt-2">
              {footer.socials.map((social) => {
                const IconComp = socialIcons[social.name] || InstagramIcon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-[#151518] hover:bg-[#E02B1D] text-[#A8A59E] hover:text-white border border-white/10 flex items-center justify-center transition-all duration-300"
                    aria-label={social.name}
                  >
                    <IconComp className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-3 space-y-4">
            <span className="text-xs font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-bold block">
              Quick Navigation
            </span>
            <ul className="space-y-2.5">
              {footer.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-[#A8A59E] hover:text-[#E02B1D] transition-colors link-underline inline-block font-sans"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-sans tracking-[0.25em] text-[#C9A96E] uppercase font-bold block">
              Hotel Fremont & Concierge
            </span>

            <div className="space-y-3.5 text-xs text-[#A8A59E] font-light">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-[#E02B1D] shrink-0 mt-0.5" />
                <span>{contact.address}</span>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[#E02B1D] shrink-0" />
                <a href={contact.phoneTel} className="hover:text-white transition-colors">
                  {contact.phone}
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#E02B1D] shrink-0" />
                <a href={`mailto:${contact.bookingEmail}`} className="hover:text-white transition-colors">
                  {contact.bookingEmail}
                </a>
              </div>

              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-md bg-[#E02B1D]/10 border border-[#E02B1D]/20 text-[11px] text-[#C9A96E]">
                  {contact.airportDistance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Legal & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A8A59E]/70 space-y-4 sm:space-y-0">
          <div>{footer.copyright}</div>

          <div className="flex items-center space-x-6">
            {footer.legalLinks.map((item) => (
              <a key={item.label} href={item.href} className="hover:text-white transition-colors">
                {item.label}
              </a>
            ))}

            <button
              onClick={scrollToTop}
              className="p-2 rounded-full bg-[#151518] hover:bg-[#E02B1D] text-white border border-white/10 transition-colors ml-2"
              aria-label="Scroll to top"
              title="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
