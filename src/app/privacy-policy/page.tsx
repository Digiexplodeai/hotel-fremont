import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { siteConfig } from "@/lib/site-config";
import Link from "next/link";
import { Shield, Lock, CreditCard, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Hotel Fremont",
  description:
    "Official Privacy Policy of Hotel Fremont, Mohali. Learn how we collect, protect, and process guest information, including secure Razorpay payment processing.",
  alternates: {
    canonical: `${siteConfig.siteUrl}/privacy-policy`,
  },
  openGraph: {
    title: "Privacy Policy | Hotel Fremont",
    description:
      "Official Privacy Policy of Hotel Fremont, Mohali. Details on data handling, Razorpay payments, and guest protections.",
    url: `${siteConfig.siteUrl}/privacy-policy`,
    siteName: siteConfig.siteName,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle="Your privacy is paramount. This policy outlines how Hotel Fremont collects, handles, and safeguards personal data."
    >
      {/* Introduction Overview Card */}
      <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#F7F3EC] m-0 border-none pb-0">
          Commitment to Guest Privacy
        </h2>
        <p className="text-[#A8A59E] leading-relaxed text-sm sm:text-base m-0">
          <strong>{siteConfig.siteName}</strong> (operated by Proprietor <strong>{siteConfig.proprietorName}</strong>, having its principal establishment at <em>{siteConfig.address}</em>) is dedicated to protecting the privacy, confidentiality, and security of our guests. This Privacy Policy outlines the categories of personal data we collect through our website (
          <Link href={siteConfig.siteUrl} className="text-[#C9A96E] underline hover:text-white">
            {siteConfig.siteUrl}
          </Link>
          ), communication channels, and physical establishment, how we utilize and protect this information, and your legal rights under applicable Indian privacy and data protection laws.
        </p>
      </div>

      {/* 1. Information We Collect */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#C9A96E]" />
          <span>1. Information We Collect</span>
        </h2>
        <p>
          To facilitate reservations and provide seamless hospitality, we collect information in the following circumstances:
        </p>
        <ul className="space-y-2 list-disc pl-6 text-[#A8A59E]">
          <li>
            <strong className="text-[#F7F3EC]">Personal Identification:</strong> Guest full name, contact telephone number, and email address provided during reservation requests or inquiries.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Reservation Details:</strong> Check-in and check-out dates, room or suite category selected, number of adult and child guests, flight/arrival details, and any dietary or accessibility preferences requested.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Statutory Government Identification (At Check-in):</strong> As strictly mandated by local municipal bylaws and Indian law (Foreigners Regional Registration Office / local police administration), every staying guest must present a valid, government-issued photo identity proof (such as Aadhaar Card, Passport, Driving License, or Voter ID) along with physical signatures on our Guest Registration Card upon arrival.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Technical & Analytics Information:</strong> IP address, device type, browser specification, operating system, and anonymous usage patterns collected via standard web server logs and cookies to improve website performance.
          </li>
        </ul>
      </section>

      {/* 2. Purpose of Collection */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#C9A96E]" />
          <span>2. Purpose of Data Collection</span>
        </h2>
        <p>We process your personal information strictly for legitimate commercial and legal purposes:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#151518]/70 border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-serif font-bold text-[#C9A96E] mb-1">Reservation & Service Delivery</h3>
            <p className="text-xs text-[#A8A59E] leading-relaxed">
              Confirming accommodation, allocating inventory across our 12 luxury keys, preparing arrival amenities, and fulfilling bespoke concierge requests.
            </p>
          </div>
          <div className="bg-[#151518]/70 border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-serif font-bold text-[#C9A96E] mb-1">Guest Communication</h3>
            <p className="text-xs text-[#A8A59E] leading-relaxed">
              Transmitting digital booking vouchers, airport transit coordination, payment receipts, and responding to direct inquiries via email, phone, or WhatsApp.
            </p>
          </div>
          <div className="bg-[#151518]/70 border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-serif font-bold text-[#C9A96E] mb-1">Legal & Regulatory Compliance</h3>
            <p className="text-xs text-[#A8A59E] leading-relaxed">
              Fulfilling statutory hotel guest registers (Form C for foreign nationals), GST invoicing obligations, and regulatory requirements under Indian law.
            </p>
          </div>
          <div className="bg-[#151518]/70 border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-serif font-bold text-[#C9A96E] mb-1">Safety & Security</h3>
            <p className="text-xs text-[#A8A59E] leading-relaxed">
              Ensuring the physical safety of guests, staff, and premises, preventing fraudulent reservations, and resolving operational disputes.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Payment Processing via Razorpay */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <CreditCard className="w-5 h-5 text-[#C9A96E]" />
          <span>3. Online Payments & Razorpay Security</span>
        </h2>
        <div className="bg-[#151518] border border-[#C9A96E]/20 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-serif font-semibold text-[#F7F3EC]">
            <Lock className="w-4 h-4 text-[#E02B1D]" />
            <span>Zero Storage of Sensitive Card or Banking Credentials</span>
          </div>
          <p className="text-xs sm:text-sm text-[#A8A59E] leading-relaxed">
            All electronic payments, advance deposits, and online transactions on our website are processed through our authorized payment aggregator, <strong>Razorpay Software Private Limited</strong>.
          </p>
          <ul className="space-y-1.5 list-disc pl-6 text-xs sm:text-sm text-[#A8A59E]">
            <li>
              <strong>Hotel Fremont NEVER collects, views, or stores</strong> complete credit/debit card numbers, CVV security codes, net banking passwords, or UPI personal identification numbers (PINs).
            </li>
            <li>
              Payment data is encrypted using end-to-end Transport Layer Security (TLS 1.2/1.3) and transmitted directly to Razorpay, which maintains complete compliance with the <strong>Payment Card Industry Data Security Standard (PCI-DSS Level 1)</strong>.
            </li>
            <li>
              We receive solely a unique transaction authorization token, status confirmation, and reference ID to substantiate your booking.
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Cookies & Web Analytics */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-[#C9A96E]" />
          <span>4. Cookies & Tracking Technologies</span>
        </h2>
        <p>
          Our website utilizes essential session cookies and performance telemetry. Essential cookies are required to preserve your booking session, selected dates, and guest selections as you navigate between pages. We do not use third-party tracking cookies for targeted behavioural advertising. You may disable cookies in your web browser preferences, though doing so may impede certain interactive booking functionalities.
        </p>
      </section>

      {/* 5. Sharing & Disclosure of Information */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-[#C9A96E]" />
          <span>5. Information Sharing & Third Parties</span>
        </h2>
        <p>
          <strong>Hotel Fremont does not sell, rent, lease, or trade guest personal information</strong> to third-party marketing companies under any circumstances. Personal information is disclosed solely under the following conditions:
        </p>
        <ul className="space-y-2 list-disc pl-6 text-[#A8A59E]">
          <li>
            <strong className="text-[#F7F3EC]">Authorized Service Providers:</strong> Trusted technical partners who assist in operating our website, infrastructure hosting, SMS/WhatsApp notification delivery, and payment settlement (including Razorpay), bound by non-disclosure and strict security standards.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Legal & Law Enforcement Obligations:</strong> Competent judicial, police, intelligence, tax, or administrative authorities when compulsory under the Code of Criminal Procedure, Indian Penal Code, Foreigners Act, or valid court orders.
          </li>
          <li>
            <strong className="text-[#F7F3EC]">Emergency Situations:</strong> Medical personnel or emergency responders to protect the vital life and safety interests of a guest or individual during medical emergencies.
          </li>
        </ul>
      </section>

      {/* 6. Data Retention & Storage */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#C9A96E]" />
          <span>6. Data Retention & Safeguards</span>
        </h2>
        <p>
          Guest records and reservation histories are retained only for as long as necessary to fulfill the purposes for which they were collected, comply with Indian tax, GST, and corporate audit requirements (typically 7–8 years for financial ledgers), and satisfy local police registration mandates. We employ physical access restrictions, encrypted digital databases, and administrative controls to prevent unauthorized access or disclosure.
        </p>
      </section>

      {/* 7. Guest Rights & Redressal */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#C9A96E]" />
          <span>7. Your Rights</span>
        </h2>
        <p>
          Under applicable Indian data protection principles, guests have the right to request access to personal information held in our booking records, request rectification of inaccurate data, or request deletion of discretionary marketing data by writing to our designated contact email:
        </p>
        <div className="p-4 bg-[#151518] border border-white/10 rounded-xl flex items-center justify-between text-xs sm:text-sm">
          <span>Grievance & Privacy Requests:</span>
          <a href={`mailto:${siteConfig.email}`} className="text-[#C9A96E] font-medium hover:underline">
            {siteConfig.email}
          </a>
        </div>
      </section>

      {/* 8. Contact & Grievance Officer */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#F7F3EC] pb-2 border-b border-white/10 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-[#C9A96E]" />
          <span>8. Grievance Redressal Officer</span>
        </h2>
        <p>
          For any questions, concerns, or grievances concerning this Privacy Policy or our data management practices, please contact our designated grievance authority:
        </p>
        <div className="bg-[#151518] border border-white/10 rounded-xl p-5 text-xs sm:text-sm space-y-1.5 text-[#A8A59E]">
          <p className="text-[#F7F3EC] font-semibold">{siteConfig.proprietorName} (Proprietor)</p>
          <p>{siteConfig.tradeName}</p>
          <p>{siteConfig.address}</p>
          <p>
            Telephone: <a href={siteConfig.phoneTel} className="text-[#C9A96E] hover:underline">{siteConfig.phone}</a>
          </p>
          <p>
            Email: <a href={`mailto:${siteConfig.email}`} className="text-[#C9A96E] hover:underline">{siteConfig.email}</a>
          </p>
        </div>
      </section>
    </PolicyLayout>
  );
}
