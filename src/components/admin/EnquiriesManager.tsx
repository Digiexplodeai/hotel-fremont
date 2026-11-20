"use client";

import React, { useState, useMemo } from "react";
import {
  EnquiryRecord,
  EnquiryStatus,
  EnquiryType,
  updateEnquiryStatusAction,
  addEnquiryNoteAction,
} from "@/actions/enquiries";
import {
  MessageSquare,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  User,
  Building,
  Utensils,
  Sparkles,
  BedDouble,
  ChevronDown,
  ChevronRight,
  Send,
  Plus,
  StickyNote,
  X,
} from "lucide-react";

interface EnquiriesManagerProps {
  initialEnquiries: EnquiryRecord[];
  isDatabase: boolean;
}

type TabType = "all" | "rooms" | "banquet" | "restaurant" | "conference";

const typeBadges: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  rate_check: {
    label: "Rate Inquiry",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: BedDouble,
  },
  book_now: {
    label: "Room Reservation",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: BedDouble,
  },
  dining_aura: {
    label: "Restaurant Dining",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Utensils,
  },
  dining: {
    label: "Restaurant Dining",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Utensils,
  },
  event_banquet: {
    label: "Cloud Six Banquet",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Building,
  },
  conference: {
    label: "Conference Hall",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: Building,
  },
  contact: {
    label: "General Inquiry",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: MessageSquare,
  },
};

const statusBadges: Record<
  EnquiryStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  new: {
    label: "New Lead",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  contacted: {
    label: "Contacted",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  in_discussion: {
    label: "In Discussion",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  converted: {
    label: "Converted",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  closed: {
    label: "Closed / Lost",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

export default function EnquiriesManager({
  initialEnquiries,
  isDatabase,
}: EnquiriesManagerProps) {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(initialEnquiries);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("Front Desk");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter logic
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      // 1. Tab category filter
      if (activeTab === "rooms") {
        if (e.type !== "book_now" && e.type !== "rate_check") return false;
      } else if (activeTab === "banquet") {
        if (e.type !== "event_banquet") return false;
      } else if (activeTab === "restaurant") {
        if (e.type !== "dining" && e.type !== "dining_aura") return false;
      } else if (activeTab === "conference") {
        const desc = (e.notes || "" + (e.roomType || "")).toLowerCase();
        if (!desc.includes("conference") && e.type !== "event_banquet") return false;
      }

      // 2. Status filter
      if (statusFilter !== "all" && e.status !== statusFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = e.name.toLowerCase().includes(q);
        const matchPhone = e.phone.includes(q);
        const matchNotes = (e.notes || "").toLowerCase().includes(q);
        const matchRoom = (e.roomType || "").toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNotes && !matchRoom) return false;
      }

      return true;
    });
  }, [enquiries, activeTab, statusFilter, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: enquiries.length,
      rooms: enquiries.filter((e) => e.type === "book_now" || e.type === "rate_check").length,
      banquet: enquiries.filter((e) => e.type === "event_banquet").length,
      restaurant: enquiries.filter((e) => e.type === "dining" || e.type === "dining_aura").length,
      conference: enquiries.filter((e) => (e.notes || "" + (e.roomType || "")).toLowerCase().includes("conference")).length,
    };
  }, [enquiries]);

  // Handle status update
  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    setUpdatingId(id);
    try {
      const res = await updateEnquiryStatusAction(id, newStatus);
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
        );
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
        }
      } else {
        alert(res.error || "Failed to update status");
      }
    } catch {
      alert("Error updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle add note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTargetId || !noteContent.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await addEnquiryNoteAction(noteTargetId, noteContent.trim(), noteAuthor);
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((item) => {
            if (item.id === noteTargetId) {
              const updatedNotes = item.notes
                ? `${item.notes}\n[${new Date().toLocaleDateString()}] ${noteAuthor}: ${noteContent}`
                : `[${new Date().toLocaleDateString()}] ${noteAuthor}: ${noteContent}`;
              return { ...item, notes: updatedNotes };
            }
            return item;
          })
        );
        setNoteModalOpen(false);
        setNoteContent("");
      } else {
        alert(res.error || "Failed to add note");
      }
    } catch {
      alert("Error adding note");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Helper: WhatsApp URL
  const getWhatsAppLink = (enquiry: EnquiryRecord) => {
    let phoneDigits = enquiry.phone.replace(/\D/g, "");
    if (!phoneDigits.startsWith("91") && phoneDigits.length === 10) {
      phoneDigits = "91" + phoneDigits;
    }
    const message = encodeURIComponent(
      `Hello ${enquiry.name}, thank you for reaching out to Hotel Fremont (Sector 80, Airport Road, Mohali). We are following up on your ${
        typeBadges[enquiry.type]?.label || "inquiry"
      }. How may we assist you today?`
    );
    return `https://wa.me/${phoneDigits}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-[#742B40] text-white shadow-sm"
                : "text-[#6B7280] hover:text-[#24272B] hover:bg-[#F8F7F4]"
            }`}
          >
            <span>All Leads</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "all" ? "bg-white/20 text-white" : "bg-[#F8F7F4] text-[#6B7280]"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "rooms"
                ? "bg-[#742B40] text-white shadow-sm"
                : "text-[#6B7280] hover:text-[#24272B] hover:bg-[#F8F7F4]"
            }`}
          >
            <span>Room Stays</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "rooms" ? "bg-white/20 text-white" : "bg-[#F8F7F4] text-[#6B7280]"
              }`}
            >
              {counts.rooms}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("banquet")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "banquet"
                ? "bg-[#742B40] text-white shadow-sm"
                : "text-[#6B7280] hover:text-[#24272B] hover:bg-[#F8F7F4]"
            }`}
          >
            <span>Cloud Six Banquet</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "banquet" ? "bg-white/20 text-white" : "bg-[#F8F7F4] text-[#6B7280]"
              }`}
            >
              {counts.banquet}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("restaurant")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "restaurant"
                ? "bg-[#742B40] text-white shadow-sm"
                : "text-[#6B7280] hover:text-[#24272B] hover:bg-[#F8F7F4]"
            }`}
          >
            <span>Restaurant Dining</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "restaurant" ? "bg-white/20 text-white" : "bg-[#F8F7F4] text-[#6B7280]"
              }`}
            >
              {counts.restaurant}
            </span>
          </button>
        </div>

        {/* Right Search & Status Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guest name, phone, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-xs text-[#24272B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#742B40] transition"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-xs text-[#24272B] focus:outline-none focus:border-[#742B40]"
            >
              <option value="all">All Statuses</option>
              <option value="new">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="in_discussion">In Discussion</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed / Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enquiries CRM Table / List */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl shadow-sm overflow-hidden">
        {filteredEnquiries.length > 0 ? (
          <div className="divide-y divide-[#EAE8E3]">
            {filteredEnquiries.map((enquiry) => {
              const badge = typeBadges[enquiry.type] || typeBadges.contact;
              const status = statusBadges[enquiry.status] || statusBadges.new;
              const Icon = badge.icon;
              const isUpdating = updatingId === enquiry.id;

              return (
                <div
                  key={enquiry.id}
                  className="p-4 sm:p-5 hover:bg-[#FAF9F7] transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Guest Info & Type */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badge.bg} ${badge.text}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-[#24272B]">
                          {enquiry.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                        {enquiry.referenceCode && (
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F8F7F4] text-[#6B7280] rounded border border-[#EAE8E3]">
                            {enquiry.referenceCode}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#B69A68]" />
                          <span>{enquiry.phone}</span>
                        </span>
                        {enquiry.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#B69A68]" />
                            <span>{enquiry.email}</span>
                          </span>
                        )}
                        {enquiry.dates && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-[#B69A68]" />
                            <span>{enquiry.dates}</span>
                          </span>
                        )}
                        {enquiry.guests && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[#B69A68]" />
                            <span>{enquiry.guests} Guests</span>
                          </span>
                        )}
                      </div>

                      {enquiry.notes && (
                        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2 bg-[#F8F7F4] p-2 rounded-lg border border-[#EAE8E3]">
                          {enquiry.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status & Follow-up Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#EAE8E3]">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <select
                        disabled={isUpdating}
                        value={enquiry.status}
                        onChange={(e) =>
                          handleStatusChange(enquiry.id, e.target.value as EnquiryStatus)
                        }
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none transition ${status.bg} ${status.text} ${status.border}`}
                      >
                        <option value="new">New Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="in_discussion">In Discussion</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed / Lost</option>
                      </select>
                    </div>

                    {/* WhatsApp Follow-up Link */}
                    <a
                      href={getWhatsAppLink(enquiry)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm shadow-emerald-950/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Internal Note Button */}
                    <button
                      onClick={() => {
                        setNoteTargetId(enquiry.id);
                        setNoteModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#F8F7F4] hover:bg-[#EAE8E3] text-[#24272B] text-xs font-medium border border-[#EAE8E3] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <StickyNote className="w-3.5 h-3.5 text-[#B69A68]" />
                      <span>Add Note</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <h4 className="text-sm font-semibold text-[#24272B]">No enquiries found</h4>
            <p className="text-xs text-[#6B7280]">
              {searchQuery
                ? "No guest leads match your current search criteria."
                : "All guest enquiries have been attended to."}
            </p>
          </div>
        )}
      </div>

      {/* Modal: Add Internal Note */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE8E3] rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-3">
              <h3 className="text-base font-serif font-bold text-[#24272B]">
                Add Internal Follow-up Note
              </h3>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#24272B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6B7280] mb-1 font-medium">Assigned Staff / Author</label>
                <input
                  type="text"
                  value={noteAuthor}
                  onChange={(e) => setNoteAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-[#24272B] focus:outline-none focus:border-[#742B40]"
                />
              </div>

              <div>
                <label className="block text-[#6B7280] mb-1 font-medium">Note Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Spoke to guest regarding corporate group stay. Sent quotation for 5 Super Deluxe rooms."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3] text-[#24272B] focus:outline-none focus:border-[#742B40]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F8F7F4] text-[#6B7280] hover:text-[#24272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingNote}
                  className="px-4 py-2 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white font-semibold"
                >
                  {isAddingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
