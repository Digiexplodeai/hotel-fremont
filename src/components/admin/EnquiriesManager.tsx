"use client";

import { useState, useEffect } from "react";
import {
  EnquiryRecord,
  EnquiryStatus,
  EnquiryType,
  getEnquiriesAction,
  updateEnquiryStatusAction,
  deleteEnquiryAction,
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
  RefreshCw,
  Trash2,
  AlertCircle,
  Loader2,
  X,
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
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  in_discussion: {
    label: "In Discussion",
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
    label: "Closed / Cancelled",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
  },
};

// Helper: Clean phone number to digits with 91 country code
function getCleanPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "919872768514";
  if (digits.startsWith("91") && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [noteEdit, setNoteEdit] = useState<string>("");
  const [overbookingModal, setOverbookingModal] = useState<{
    enquiryId: string;
    newStatus: EnquiryStatus;
    message: string;
  } | null>(null);

  // Top Statistics (Calculated strictly from real Supabase rows)
  const total = enquiries.length;
  const actionRequired = enquiries.filter((e) => e.status === "new").length;
  const inDiscussion = enquiries.filter((e) => e.status === "in_discussion" || e.status === "contacted").length;
  const converted = enquiries.filter((e) => e.status === "converted").length;

  // Refresh data from Supabase
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorBanner(null);
    try {
      const res = await getEnquiriesAction();
      if (res.success) {
        setEnquiries(res.enquiries);
        if (selectedEnquiry) {
          const updated = res.enquiries.find((e) => e.id === selectedEnquiry.id);
          if (updated) setSelectedEnquiry(updated);
        }
      } else {
        setErrorBanner(res.error || "Failed to fetch enquiries from Supabase.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorBanner(error.message || "Network error while refreshing enquiries.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh when tab regains focus or visibility
  useEffect(() => {
    const onFocus = () => {
      handleRefresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleRefresh();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

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

  // Handle status update
  const handleStatusChange = async (enquiryId: string, newStatus: EnquiryStatus, override: boolean = false) => {
    setIsUpdating(enquiryId);
    setErrorBanner(null);
    try {
      const res = await updateEnquiryStatusAction(enquiryId, newStatus, undefined, override);
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
        );
        if (selectedEnquiry?.id === enquiryId) {
          setSelectedEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        setSuccessBanner(`Lead marked as ${statusConfig[newStatus]?.label || newStatus}`);
        setOverbookingModal(null);
        setTimeout(() => setSuccessBanner(null), 3000);
      } else if (res.requiresOverride) {
        setOverbookingModal({
          enquiryId,
          newStatus,
          message: res.error || "Inventory limit reached. Management override required to confirm.",
        });
      } else {
        setErrorBanner(res.error || "Failed to update lead status in Supabase.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorBanner(error.message || "Failed to update status.");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle delete
  const handleDelete = async (enquiryId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the inquiry from "${name}"?`)) {
      return;
    }

    setIsDeleting(enquiryId);
    setErrorBanner(null);
    try {
      const res = await deleteEnquiryAction(enquiryId);
      if (res.success) {
        setEnquiries((prev) => prev.filter((e) => e.id !== enquiryId));
        if (selectedEnquiry?.id === enquiryId) {
          setSelectedEnquiry(null);
        }
        setSuccessBanner(`Inquiry from "${name}" deleted.`);
        setTimeout(() => setSuccessBanner(null), 3000);
      } else {
        setErrorBanner(res.error || "Failed to delete lead from Supabase.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorBanner(error.message || "Failed to delete lead.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle saving staff notes
  const handleSaveNotes = async () => {
    if (!selectedEnquiry) return;
    setIsUpdating(selectedEnquiry.id);
    setErrorBanner(null);
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
        setSuccessBanner("Notes saved to Supabase.");
        setTimeout(() => setSuccessBanner(null), 3000);
      } else {
        setErrorBanner(res.error || "Failed to save notes.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorBanner(error.message || "Failed to save notes.");
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
            <span className="text-2xl font-mono font-bold text-[#E02B1D]">{actionRequired}</span>
            <span className="text-[10px] text-[#E02B1D]/80 animate-pulse font-mono">Uncontacted</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-amber-500/20 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-amber-400">In Discussion</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-400">{inDiscussion}</span>
            <span className="text-[10px] text-amber-400/80 font-mono">Follow-up</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#151518] border border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-emerald-400">Converted</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-emerald-400">{converted}</span>
            <span className="text-[10px] text-emerald-400/80 font-mono">Confirmed</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-red-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

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
            className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E] cursor-pointer"
          >
            <option value="all">All Statuses ({total})</option>
            <option value="new">New Leads ({actionRequired})</option>
            <option value="contacted">Contacted</option>
            <option value="in_discussion">In Discussion</option>
            <option value="converted">Converted ({converted})</option>
            <option value="closed">Closed / Cancelled</option>
          </select>

          {/* Channel Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#C9A96E] cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="book_now">Room Reservation</option>
            <option value="rate_check">Rate Check</option>
            <option value="dining_aura">Aura Dining</option>
            <option value="event_banquet">Event &amp; Banquet</option>
            <option value="contact">General Contact</option>
          </select>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <span className="text-xs text-[#A8A59E] font-mono shrink-0">
            Showing {filtered.length} of {total} leads
          </span>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/5 border border-white/10 hover:border-white/20 text-xs text-[#F7F3EC] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Reload from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A96E] ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Leads Table & Details Drawer Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Column */}
        <div className={`${selectedEnquiry ? "lg:col-span-7" : "lg:col-span-12"} space-y-3`}>
          <div className="bg-[#151518] border border-white/10 rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/50 text-[#A8A59E] font-mono border-b border-white/10 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Guest Contact</th>
                    <th className="py-3 px-4">Channel / Type</th>
                    <th className="py-3 px-4">Details / Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F7F3EC]">
                  {isRefreshing && enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#A8A59E]">
                        <Loader2 className="w-6 h-6 text-[#E02B1D] animate-spin mx-auto mb-2" />
                        <span>Fetching real leads from Supabase...</span>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#A8A59E]">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-[#A8A59E] mb-2">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="font-serif font-bold block text-sm text-white mb-1">
                          No leads yet
                        </span>
                        <span className="text-xs text-[#A8A59E] max-w-sm block mx-auto">
                          New guest submissions from the public website will appear here in real-time.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
                      const tcfg = typeConfig[item.type] || typeConfig.contact;
                      const scfg = statusConfig[item.status] || statusConfig.new;
                      const isSelected = selectedEnquiry?.id === item.id;

                      const waPhone = getCleanPhone(item.phone);
                      const waText = `Hello ${item.name}, thank you for reaching out to Hotel Fremont regarding your ${tcfg.label}. How may we assist you with your booking?`;
                      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;
                      const telUrl = `tel:+${waPhone}`;

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
                                <span
                                  className="w-2 h-2 rounded-full bg-[#E02B1D] animate-pulse"
                                  title="New Lead (Action Required)"
                                />
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
                            {item.referenceCode && (
                              <div className="text-[10px] text-[#C9A96E] mt-1 font-mono font-bold tracking-wider">
                                {item.referenceCode}
                              </div>
                            )}
                            <div className="text-[10px] text-[#A8A59E] mt-0.5 font-mono">
                              {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {(item.roomType || item.details?.suite) && (
                              <div className="text-[#C9A96E] font-medium text-xs truncate max-w-[170px]">
                                {item.roomType || item.details?.suite}
                              </div>
                            )}
                            {item.dates && (
                              <div className="text-white font-medium flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-[#C9A96E]" />
                                <span>{item.dates}</span>
                                {item.nights && item.nights > 0 && (
                                  <span className="text-[10px] text-[#A8A59E] font-mono">({item.nights}n)</span>
                                )}
                              </div>
                            )}
                            <div className="text-[11px] text-[#A8A59E] flex items-center gap-2 mt-0.5">
                              {item.roomsRequested && item.roomsRequested > 0 && (
                                <span className="font-mono text-white/90">
                                  {item.roomsRequested} {item.roomsRequested === 1 ? "Room" : "Rooms"}
                                </span>
                              )}
                              {item.guests && (
                                <span className="flex items-center gap-0.5">
                                  <Users className="w-3 h-3 text-[#A8A59E]" />
                                  <span>{item.guests}</span>
                                </span>
                              )}
                            </div>
                            {item.details?.eventType && (
                              <div className="text-[11px] text-purple-300 truncate max-w-[160px]">
                                {item.details.eventType}
                              </div>
                            )}
                            {item.details?.totalAmount ? (
                              <div className="text-[10px] text-emerald-400 font-mono font-semibold mt-0.5">
                                ₹{Number(item.details.totalAmount).toLocaleString("en-IN")}
                              </div>
                            ) : null}
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
                                href={telUrl}
                                title="Call Guest"
                                className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition flex items-center gap-1 text-[11px]"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>

                              {/* Delete Lead Button */}
                              <button
                                onClick={() => handleDelete(item.id, item.name)}
                                disabled={isDeleting === item.id}
                                title="Delete Lead"
                                className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-950/30 transition flex items-center gap-1 text-[11px] cursor-pointer disabled:opacity-50"
                              >
                                {isDeleting === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedEnquiry.id, selectedEnquiry.name)}
                  disabled={isDeleting === selectedEnquiry.id}
                  className="text-xs text-red-400 hover:text-red-300 p-1.5 rounded-md bg-red-950/40 border border-red-500/20 transition cursor-pointer"
                  title="Delete Lead"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="text-xs text-[#A8A59E] hover:text-white p-1 rounded-md bg-black/40 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Direct Connect Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/${getCleanPhone(selectedEnquiry.phone)}?text=${encodeURIComponent(
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
                href={`tel:+${getCleanPhone(selectedEnquiry.phone)}`}
                className="py-2.5 px-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-[#C9A96E]" />
                <span>Direct Call</span>
              </a>
            </div>

            {/* Guest & Reservation Info Box */}
            <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs">
              {selectedEnquiry.referenceCode && (
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <span className="text-[#A8A59E]">Booking Reference:</span>
                  <span className="font-mono text-[#C9A96E] font-bold text-sm tracking-wider">
                    {selectedEnquiry.referenceCode}
                  </span>
                </div>
              )}
              {(selectedEnquiry.roomType || selectedEnquiry.details?.suite) && (
                <div className="flex items-center justify-between">
                  <span className="text-[#A8A59E]">Suite Category:</span>
                  <span className="text-white font-medium">
                    {selectedEnquiry.roomType || selectedEnquiry.details?.suite}
                  </span>
                </div>
              )}
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
                  <span className="text-[#A8A59E]">Stay Dates:</span>
                  <span className="text-[#C9A96E] font-medium">
                    {selectedEnquiry.dates}
                    {selectedEnquiry.nights && selectedEnquiry.nights > 0 ? ` (${selectedEnquiry.nights} Nights)` : ""}
                  </span>
                </div>
              )}
              {selectedEnquiry.roomsRequested && (
                <div className="flex items-center justify-between">
                  <span className="text-[#A8A59E]">Rooms Requested:</span>
                  <span className="text-white font-mono font-medium">
                    {selectedEnquiry.roomsRequested} {selectedEnquiry.roomsRequested === 1 ? "Room" : "Rooms"}
                  </span>
                </div>
              )}
              {selectedEnquiry.guests && (
                <div className="flex items-center justify-between">
                  <span className="text-[#A8A59E]">Party Size:</span>
                  <span className="text-white font-medium">{selectedEnquiry.guests} Guests</span>
                </div>
              )}
              {selectedEnquiry.details?.totalAmount && (
                <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                  <span className="text-[#A8A59E]">Estimated Total (incl. GST):</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    ₹{Number(selectedEnquiry.details.totalAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            {/* Specific Submission Details */}
            {selectedEnquiry.details && Object.keys(selectedEnquiry.details).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-[#A8A59E]">Form Submission Payload</span>
                <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs text-[#F7F3EC] space-y-1 font-mono">
                  {Object.entries(selectedEnquiry.details).map(([k, v]) => {
                    if (v === undefined || v === null || v === "") return null;
                    return (
                      <div key={k} className="flex items-baseline justify-between text-[11px]">
                        <span className="text-[#A8A59E] capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>
                        <span className="text-[#C9A96E] text-right font-medium max-w-[220px] truncate">
                          {String(v)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status Workflow Selector (Dropdown + Buttons) */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-[#A8A59E]">Lead Status</span>
              <div className="grid grid-cols-2 gap-2">
                {(["new", "contacted", "in_discussion", "converted", "closed"] as EnquiryStatus[]).map((st) => (
                  <button
                    key={st}
                    disabled={isUpdating === selectedEnquiry.id}
                    onClick={() => handleStatusChange(selectedEnquiry.id, st)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
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
                  disabled={isUpdating === selectedEnquiry.id}
                  className="text-[11px] text-[#C9A96E] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isUpdating === selectedEnquiry.id ? "Saving..." : "Save Notes"}
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

      {/* Overbooking Capacity Warning & Explicit Override Modal */}
      {overbookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151518] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl text-[#F7F3EC] space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white">
                  Inventory Capacity Warning
                </h3>
                <span className="text-[11px] text-amber-400/90 font-mono">
                  Database Overbooking Guard Active
                </span>
              </div>
            </div>

            <p className="text-xs text-[#A8A59E] leading-relaxed">
              {overbookingModal.message}
            </p>

            <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-amber-200/90 space-y-1">
              <p className="font-semibold text-white">Management Notice:</p>
              <p>Confirming this lead will exceed 12-room inventory on the requested dates. Only proceed if you have verified physical suite availability or guest rearrangement.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setOverbookingModal(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#A8A59E] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(overbookingModal.enquiryId, overbookingModal.newStatus, true)}
                className="px-4 py-2 rounded-lg bg-[#E02B1D] hover:bg-[#c42215] text-white text-xs font-semibold transition cursor-pointer shadow-md"
              >
                Confirm with Management Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
