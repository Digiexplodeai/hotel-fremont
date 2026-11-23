"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Users,
  MessageSquare,
  BedDouble,
  Tag,
  Receipt,
  ImageIcon,
  Globe,
  Settings,
  History,
  Activity,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Building2,
  X,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";

interface AdminSidebarProps {
  userEmail?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AdminSidebar({
  userEmail = "admin@hotelfremont.com",
  isMobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation: NavSection[] = [
    {
      title: "PRIMARY",
      items: [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Reservations", href: "/admin/reservations", icon: CalendarCheck },
        { label: "Room Calendar", href: "/admin/calendar", icon: Calendar },
        { label: "Guests", href: "/admin/guests", icon: Users },
        { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { label: "Room Management", href: "/admin/rooms", icon: BedDouble },
        { label: "Rates & Plans", href: "/admin/rates", icon: Tag },
        { label: "Payments", href: "/admin/payments", icon: Receipt },
        { label: "Media Library", href: "/admin/images", icon: ImageIcon },
        { label: "Website Content", href: "/admin/content", icon: Globe },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { label: "Settings", href: "/admin/settings", icon: Settings },
        { label: "Activity Logs", href: "/admin/logs", icon: History },
        { label: "System Health", href: "/admin/health", icon: Activity },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#141316] border-r border-[#373138] flex flex-col justify-between transition-all duration-300 shadow-[2px_0_16px_rgba(0,0,0,0.5)] ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="h-16 border-b border-[#373138] px-4 flex items-center justify-between">
            {!isCollapsed ? (
              <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
                <Image
                  src="/assets/logo.png"
                  alt="Hotel Fremont"
                  width={130}
                  height={26}
                  className="h-6 w-auto object-contain brightness-110"
                  priority
                />
              </Link>
            ) : (
              <Link href="/admin" className="mx-auto" title="Hotel Fremont">
                <div className="w-9 h-9 rounded-xl bg-[#742B40] border border-[#C6A16A]/30 text-[#F5F2EF] flex items-center justify-center font-serif font-bold text-base shadow-sm">
                  F
                </div>
              </Link>
            )}

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex w-7 h-7 rounded-lg text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] items-center justify-center transition cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onMobileClose}
              className="lg:hidden w-8 h-8 rounded-lg text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Property Badge */}
          {!isCollapsed && (
            <div className="mx-4 my-3 px-3 py-2 rounded-xl bg-[#1A191D] border border-[#373138] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C6A16A]" />
                <div>
                  <span className="font-semibold text-[#F5F2EF] block">Sector 80, Mohali</span>
                  <span className="text-[10px] text-[#B7A9A7]">21 Keys · 3-Star Hotel</span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-950/60" title="System Operational" />
            </div>
          )}

          {/* Nav List */}
          <nav className="px-3 py-2 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-thin">
            {navigation.map((section) => (
              <div key={section.title} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-sans tracking-[0.18em] font-bold text-[#8E8A85] uppercase">
                    {section.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onMobileClose}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                          active
                            ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm shadow-[#742B40]/40 font-semibold"
                            : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#1A191D]"
                        } ${isCollapsed ? "justify-center px-2" : ""}`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active
                              ? "text-[#C6A16A]"
                              : "text-[#8E8A85] group-hover:text-[#F5F2EF]"
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-[#742B40]/30 text-[#F5F2EF] border border-[#742B40]/40"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-3 border-t border-[#373138] bg-[#141316]">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-2 py-1">
                <div className="truncate">
                  <span className="text-xs font-semibold text-[#F5F2EF] block truncate">
                    Front Desk &amp; Admin
                  </span>
                  <span className="text-[11px] text-[#B7A9A7] block truncate">
                    {userEmail}
                  </span>
                </div>
                <Link
                  href="/"
                  target="_blank"
                  className="p-1.5 rounded-lg text-[#B7A9A7] hover:text-[#C6A16A] hover:bg-[#232126] transition"
                  title="View Public Site"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 hover:border-rose-700/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          ) : (
            <form action={signOutAction} className="flex justify-center">
              <button
                type="submit"
                className="w-9 h-9 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 flex items-center justify-center transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
