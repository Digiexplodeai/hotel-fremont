"use client";

import { useState } from "react";
import {
  EnquiryRecord,
  EnquiryStatus,
  EnquiryType,
  updateEnquiryStatusAction,
} from "@/actions/enquiries";
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Filter,
  Search,
  User,
  ChevronRight,
  FileText,
} from "lucide-react";

interface EnquiriesManagerProps {
  initialEnquiries: EnquiryRecord[];
  isDatabase: boolean;
}

const typeConfig: Record<
  EnquiryType,
  { label: string; bg: string; text: string; border: string }
> = {
  rate_check: {
    label: "Rate Inquiry",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  book_now: {
    label: "Room Reservation",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  dining_aura: {
    label: "Aura Dining",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  event_banquet: {
    label: "Event & Banquet",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  contact: {
    label: "General Inquiry",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
  },
};

const statusConfig: Record<
  EnquiryStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  new: {
    label: "New Lead",
    bg: "bg-[#E02B1D]/15",
    text: "text-[#E02B1D]",
    border: "border-[#E02B1D]/30",
  },
  contacted: {
    label: "Contacted",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  converted: {
    label: "Converted",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
  },
};

export default function EnquiriesManager({
  initialEnquiries,
  isDatabase,
}: EnquiriesManagerProps) {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(initialEnquiries);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [noteEdit, setNoteEdit] = useState<string>("");

  // Metrics
  const total = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === "new").length;
  const contactedCount = enquiries.filter((e) => e.status === "contacted").length;
  const convertedCount = enquiries.filter((e) => e.status === "converted").length;

  // Filtered List
  const filtered = enquiries.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchPhone = item.phone.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail) return false;
    }
    return true;
  });

  const handleStatusChange = async (enquiryId: string, newStatus: EnquiryStatus) => {
    setIsUpdating(enquiryId);
    try {
      const res = await updateEnquiryStatusAction(enquiryId, newStatus);
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
        );
        if (selectedEnquiry?.id === enquiryId) {
          setSelectedEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedEnquiry) return;
    setIsUpdating(selectedEnquiry.id);
    try {
      const res = await updateEnquiryStatusAction(
        selectedEnquiry.id,
        selectedEnquiry.status,
        noteEdit
      );
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === selectedEnquiry.id ? { ...e, notes: noteEdit } : e))
        );
        setSelectedEnquiry((prev) => (prev ? { ...prev, notes: noteEdit } : null));
      }
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#151518] border border-white/10 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-[#A8A59E]">Total Leads</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{total}</span>
            <span className="text-[10px] text-[#A8A59E]">All-time</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-[#E02B1D]/25 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-[#E02B1D]">Action Required</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-[#E02B1D]">{newCount}</span>
            <span className="text-[10px] text-[#E02B1D]/80 animate-pulse font-mono">Uncontacted</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-amber-500/20 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-amber-400">In Discussion</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-400">{contactedCount}</span>
            <span className="text-[10px] text-amber-400/80 font-mono">Follow-up</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-emerald-400">Converted</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">{convertedCount}</span>
            <span className="text-[10px] text-emerald-400/80 font-mono">Booked</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#151518] border border-white/10 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A59E]" />
            <input
              type="text"
              placeholder="Search by guest name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
          >
            <option value="all">All Statuses ({total})</option>
            <option value="new">New Leads ({newCount})</option>
            <option value="contacted">Contacted ({contactedCount})</option>
            <option value="converted">Converted ({convertedCount})</option>
            <option value="closed">Closed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
          >
            <option value="all">All Channels</option>
            <option value="book_now">Room Booking</option>
            <option value="rate_check">Rate Check</option>
            <option value="dining_aura">Aura Dining</option>
            <option value="event_banquet">Event &amp; Banquet</option>
            <option value="contact">General Contact</option>
          </select>
        </div>

        <span className="text-xs text-[#A8A59E] font-mono shrink-0">
          Showing {filtered.length} of {total} leads
        </span>
      </div>

      {/* Leads Table & Details Drawer Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Column */}
        <div className={`${selectedEnquiry ? "lg:col-span-7" : "lg:col-span-12"} space-y-3`}>
          <div className="bg-[#151518] border border-white/10 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-[#A8A59E] font-mono border-b border-white/10 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Guest Contact</th>
                    <th className="py-3 px-4">Channel / Type</th>
                    <th className="py-3 px-4">Details / Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Connect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F7F3EC]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#A8A59E]">
                        No matching inquiries found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const tcfg = typeConfig[item.type] || typeConfig.contact;
                      const scfg = statusConfig[item.status] || statusConfig.new;
                      const isSelected = selectedEnquiry?.id === item.id;

                      // Build WhatsApp URL with context
                      const cleanPhone = item.phone.replace(/[^0-9]/g, "");
                      const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                      const waText = `Hello ${item.name}, thank you for reaching out to Hotel Fremont regarding your ${tcfg.label}. How may we assist you with your reservation?`;
                      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => {
                            setSelectedEnquiry(item);
                            setNoteEdit(item.notes || "");
                          }}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? "bg-[#C9A96E]/10 border-l-2 border-[#C9A96E]"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.status === "new" && (
                                <span className="w-2 h-2 rounded-full bg-[#E02B1D] animate-ping" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#A8A59E] font-mono mt-0.5">
                              {item.phone}
                            </div>
                            {item.email && (
                              <div className="text-[10px] text-[#A8A59E]/70 truncate max-w-[150px]">
                                {item.email}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${tcfg.bg} ${tcfg.text} ${tcfg.border}`}
                            >
                              {tcfg.label}
                            </span>
                            <div className="text-[10px] text-[#A8A59E] mt-1 font-mono">
                              {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {item.dates && (
                              <div className="text-white font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#C9A96E]" />
                                <span>{item.dates}</span>
                              </div>
                            )}
                            {item.guests && (
                              <div className="text-[11px] text-[#A8A59E] flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3 text-[#A8A59E]" />
                                <span>{item.guests} Guests</span>
                              </div>
                            )}
                            {item.details?.suite && (
                              <div className="text-[11px] text-[#C9A96E] truncate max-w-[160px]">
                                {item.details.suite}
                              </div>
                            )}
                            {item.details?.eventType && (
                              <div className="text-[11px] text-purple-300 truncate max-w-[160px]">
                                {item.details.eventType}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${scfg.bg} ${scfg.text} ${scfg.border}`}
                            >
                              {scfg.label}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1-Click WhatsApp */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Reply on WhatsApp"
                                className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition flex items-center gap-1 text-[11px]"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>

                              {/* 1-Click Call */}
                              <a
                                href={`tel:${item.phone}`}
                                title="Call Guest"
                                className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition flex items-center gap-1 text-[11px]"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lead Details Drawer Column */}
        {selectedEnquiry && (
          <div className="lg:col-span-5 bg-[#151518] border border-[#C9A96E]/30 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    typeConfig[selectedEnquiry.type]?.bg
                  } ${typeConfig[selectedEnquiry.type]?.text} ${
                    typeConfig[selectedEnquiry.type]?.border
                  }`}
                >
                  {typeConfig[selectedEnquiry.type]?.label}
                </span>
                <h3 className="text-lg font-serif font-bold text-white mt-1">
                  {selectedEnquiry.name}
                </h3>
                <p className="text-xs text-[#A8A59E] font-mono mt-0.5">
                  Received {new Date(selectedEnquiry.createdAt).toLocaleString("en-IN")}
                </p>
              </div>

              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-xs text-[#A8A59E] hover:text-white p-1 rounded-md bg-black/40"
              >
                Close
              </button>
            </div>

            {/* Direct Connect Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/${selectedEnquiry.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${selectedEnquiry.name}, thank you for inquiring about Hotel Fremont.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </a>

              <a
                href={`tel:${selectedEnquiry.phone}`}
                className="py-2.5 px-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-[#C9A96E]" />
                <span>Direct Call</span>
              </a>
            </div>

            {/* Guest Info Box */}
            <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A8A59E]">Phone Number:</span>
                <span className="font-mono text-white font-medium">{selectedEnquiry.phone}</span>
              </div>
              {selectedEnquiry.email && (
                <div className="flex items-center justify-between">
                  <span className="text-[#A8A59E]">Email:</span>
                  <span className="text-white font-medium">{selectedEnquiry.email}</span>
                </div>
              )}
              {selectedEnquiry.dates && (
                <div className="flex items-center justify-between">
                  <span className="text-[#A8A59E]">Requested Dates:</span>
                  <span className="text-[#C9A96E] font-medium">{selectedEnquiry.dates}</span>
                </div>
              )}
              {selectedEnquiry.guests && (
                <div className="flex items-center justify-between">
                  <span className="text-[#A8A59E]">Party Size:</span>
                  <span className="text-white font-medium">{selectedEnquiry.guests} Guests</span>
                </div>
              )}
            </div>

            {/* Specific Submission Details */}
            {selectedEnquiry.details && Object.keys(selectedEnquiry.details).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-[#A8A59E]">Form Submission Payload</span>
                <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs text-[#F7F3EC] space-y-1 font-mono">
                  {Object.entries(selectedEnquiry.details).map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between text-[11px]">
                      <span className="text-[#A8A59E] capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>
                      <span className="text-[#C9A96E] text-right font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Workflow Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-[#A8A59E]">Lead Status</span>
              <div className="grid grid-cols-2 gap-2">
                {(["new", "contacted", "converted", "closed"] as EnquiryStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedEnquiry.id, st)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedEnquiry.status === st
                        ? statusConfig[st].bg + " " + statusConfig[st].text + " " + statusConfig[st].border
                        : "bg-black/30 text-[#A8A59E] border-white/5 hover:border-white/20"
                    }`}
                  >
                    <span>{statusConfig[st].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[#A8A59E]">Front Desk Call Notes</span>
                <button
                  onClick={handleSaveNotes}
                  className="text-[11px] text-[#C9A96E] hover:underline font-semibold"
                >
                  Save Notes
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Log guest preferences, callback time, or reservation details..."
                value={noteEdit}
                onChange={(e) => setNoteEdit(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

