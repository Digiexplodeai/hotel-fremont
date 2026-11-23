"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  EnquiryRecord,
  EnquiryStatus,
  EnquiryType,
  updateEnquiryStatusAction,
  addEnquiryNoteAction,
} from "@/actions/enquiries";
import {
  cleanEnquiryNotes,
  formatEnquiryDate,
  formatReceivedTimestamp,
  formatEventTime,
  getEnquiryDateLabel,
} from "@/lib/enquiryFormat";
import {
  deleteEnquiryAction,
  bulkDeleteEnquiriesAction,
  bulkArchiveEnquiriesAction,
} from "@/actions/recordManagement";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";
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
  MoreVertical,
  Archive,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  ShieldAlert,
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
    bg: "bg-blue-950/40",
    text: "text-blue-300",
    border: "border-blue-800/40",
    icon: BedDouble,
  },
  book_now: {
    label: "Room Reservation",
    bg: "bg-emerald-950/40",
    text: "text-emerald-300",
    border: "border-emerald-800/40",
    icon: BedDouble,
  },
  dining_aura: {
    label: "Dining Hall",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    border: "border-amber-800/40",
    icon: Utensils,
  },
  dining: {
    label: "Dining Hall",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    border: "border-amber-800/40",
    icon: Utensils,
  },
  event_banquet: {
    label: "Cloud 6 Banquet",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
    border: "border-purple-800/40",
    icon: Building,
  },
  conference: {
    label: "Conference Hall",
    bg: "bg-indigo-950/40",
    text: "text-indigo-300",
    border: "border-indigo-800/40",
    icon: Building,
  },
  contact: {
    label: "General Inquiry",
    bg: "bg-[#232126]",
    text: "text-[#B7A9A7]",
    border: "border-[#373138]",
    icon: MessageSquare,
  },
};

const statusBadges: Record<
  EnquiryStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  new: {
    label: "New Lead",
    bg: "bg-rose-950/40",
    text: "text-rose-300",
    border: "border-rose-800/40",
  },
  contacted: {
    label: "Contacted",
    bg: "bg-blue-950/40",
    text: "text-blue-300",
    border: "border-blue-800/40",
  },
  in_discussion: {
    label: "In Discussion",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    border: "border-amber-800/40",
  },
  converted: {
    label: "Converted",
    bg: "bg-emerald-950/40",
    text: "text-emerald-300",
    border: "border-emerald-800/40",
  },
  closed: {
    label: "Closed / Lost",
    bg: "bg-[#232126]",
    text: "text-[#8E8A85]",
    border: "border-[#373138]",
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

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Three-dot action menu & feedback
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Deletion modals state
  const [deleteModalEnquiry, setDeleteModalEnquiry] = useState<EnquiryRecord | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);

  // Details drawer modal
  const [detailModalEnquiry, setDetailModalEnquiry] = useState<EnquiryRecord | null>(null);

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTargetId, setNoteTargetId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("Front Desk");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Close three-dot action menu on click outside
  useEffect(() => {
    const handleWindowClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

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
        const desc = ((e.notes || "") + (e.roomType || "")).toLowerCase();
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
      conference: enquiries.filter((e) => ((e.notes || "") + (e.roomType || "")).toLowerCase().includes("conference")).length,
    };
  }, [enquiries]);

  // Selection helpers
  const isAllFilteredSelected = useMemo(() => {
    if (filteredEnquiries.length === 0) return false;
    return filteredEnquiries.every((e) => selectedIds.includes(e.id));
  }, [filteredEnquiries, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredEnquiries.map((e) => e.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const set = new Set([...selectedIds, ...filteredEnquiries.map((e) => e.id)]);
      setSelectedIds(Array.from(set));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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

  // Single Archive handler
  const handleArchiveSingle = async (enquiry: EnquiryRecord) => {
    setActiveMenuId(null);
    setUpdatingId(enquiry.id);
    try {
      const res = await updateEnquiryStatusAction(enquiry.id, "closed");
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === enquiry.id ? { ...e, status: "closed" } : e))
        );
        setActionFeedback(`Enquiry from ${enquiry.name} archived.`);
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(res.error || "Failed to archive enquiry");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Single Delete handler (confirmed via modal)
  const handleConfirmSingleDelete = async () => {
    if (!deleteModalEnquiry) return;
    const target = deleteModalEnquiry;
    try {
      const res = await deleteEnquiryAction(target.id, "Deleted from CRM enquiries inbox");
      if (res.success) {
        setEnquiries((prev) => prev.filter((e) => e.id !== target.id));
        setSelectedIds((prev) => prev.filter((id) => id !== target.id));
        setDeleteModalEnquiry(null);
        setActionFeedback(`Enquiry from ${target.name} permanently deleted.`);
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(res.error || "Failed to delete enquiry.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting enquiry.");
    }
  };

  // Bulk Archive handler
  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Archive ${selectedIds.length} selected enquiries as closed/resolved?`)) {
      return;
    }
    setIsBulkArchiving(true);
    try {
      const res = await bulkArchiveEnquiriesAction(selectedIds, "Bulk archived from CRM inbox");
      if (res.success) {
        const archivedSet = new Set(selectedIds);
        setEnquiries((prev) =>
          prev.map((e) => (archivedSet.has(e.id) ? { ...e, status: "closed" } : e))
        );
        setActionFeedback(`${res.archivedCount} enquiries archived successfully.`);
        setSelectedIds([]);
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(res.error || "Failed to bulk archive enquiries.");
      }
    } finally {
      setIsBulkArchiving(false);
    }
  };

  // Bulk Delete handler (confirmed via modal)
  const handleConfirmBulkDelete = async () => {
    try {
      const res = await bulkDeleteEnquiriesAction(selectedIds, "Bulk deleted from CRM enquiries inbox");
      if (res.success) {
        const deletedSet = new Set(selectedIds);
        setEnquiries((prev) => prev.filter((e) => !deletedSet.has(e.id)));
        setActionFeedback(`${res.deletedCount} selected enquiries permanently deleted.`);
        setSelectedIds([]);
        setIsBulkDeleteOpen(false);
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(res.error || "Failed to bulk delete enquiries.");
      }
    } catch (err: any) {
      alert(err.message || "Error executing bulk deletion.");
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
    const cleanFirstLine = cleanEnquiryNotes(enquiry.notes || "").split("\n")[0];
    const message = encodeURIComponent(
      `Hello ${enquiry.name}, thank you for reaching out to Hotel Fremont (Sector 80, Airport Road, Mohali). We are following up on your ${
        typeBadges[enquiry.type]?.label || "inquiry"
      }${cleanFirstLine ? ` (${cleanFirstLine})` : ""}. How may we assist you today?`
    );
    return `https://wa.me/${phoneDigits}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Filter & Search Bar */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/30 shadow-sm"
                : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126]"
            }`}
          >
            <span>All Leads</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "all" ? "bg-white/20 text-white" : "bg-[#232126] text-[#8E8A85]"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "rooms"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/30 shadow-sm"
                : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126]"
            }`}
          >
            <span>Room Stays</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "rooms" ? "bg-white/20 text-white" : "bg-[#232126] text-[#8E8A85]"
              }`}
            >
              {counts.rooms}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("banquet")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "banquet"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/30 shadow-sm"
                : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126]"
            }`}
          >
            <span>Cloud 6 Banquet</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "banquet" ? "bg-white/20 text-white" : "bg-[#232126] text-[#8E8A85]"
              }`}
            >
              {counts.banquet}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("restaurant")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === "restaurant"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/30 shadow-sm"
                : "text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126]"
            }`}
          >
            <span>Dining Hall</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "restaurant" ? "bg-white/20 text-white" : "bg-[#232126] text-[#8E8A85]"
              }`}
            >
              {counts.restaurant}
            </span>
          </button>
        </div>

        {/* Right Search & Status Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8E8A85] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guest name, phone, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] placeholder-[#8E8A85] focus:outline-none focus:border-[#C6A16A] transition"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#8E8A85]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#0D0D10] border border-[#373138] text-xs text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A] cursor-pointer"
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

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#742B40]/20 border border-[#742B40]/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-[#742B40] text-white text-xs font-bold font-mono border border-[#C6A16A]/30">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-[#F5F2EF]">
              leads selected for batch processing
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleBulkArchive}
              disabled={isBulkArchiving}
              className="px-3 py-1.5 rounded-xl bg-[#232126] hover:bg-[#2c2a30] border border-[#373138] text-[#F5F2EF] font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5 text-[#C6A16A]" />
              <span>{isBulkArchiving ? "Archiving..." : "Bulk Archive"}</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Enquiries CRM Table / List */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header with Select-All Checkbox */}
        <div className="p-3.5 bg-[#141316] border-b border-[#373138] flex items-center justify-between text-xs text-[#8E8A85] font-medium">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 cursor-pointer hover:text-[#F5F2EF]"
              title={isAllFilteredSelected ? "Deselect All" : "Select All"}
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-[#C6A16A]" />
              ) : (
                <Square className="w-4 h-4 text-[#8E8A85]" />
              )}
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7A9A7]">
                Select All ({filteredEnquiries.length})
              </span>
            </button>
          </div>
          <span className="text-[11px] text-[#8E8A85]">
            Showing {filteredEnquiries.length} of {enquiries.length} leads
          </span>
        </div>

        {filteredEnquiries.length > 0 ? (
          <div className="divide-y divide-[#373138]">
            {filteredEnquiries.map((enquiry) => {
              const badge = typeBadges[enquiry.type] || typeBadges.contact;
              const status = statusBadges[enquiry.status] || statusBadges.new;
              const Icon = badge.icon;
              const isUpdating = updatingId === enquiry.id;
              const isSelected = selectedIds.includes(enquiry.id);
              const isMenuOpen = activeMenuId === enquiry.id;

              return (
                <div
                  key={enquiry.id}
                  className={`p-4 sm:p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isSelected ? "bg-[#742B40]/15" : "hover:bg-[#232126]/60"
                  }`}
                >
                  {/* Left Column: Selection Checkbox & Guest Info */}
                  <div className="flex items-start gap-3.5">
                    {/* Row Checkbox */}
                    <button
                      onClick={(e) => toggleSelectOne(enquiry.id, e)}
                      className="mt-2.5 shrink-0 cursor-pointer text-[#8E8A85] hover:text-[#C6A16A]"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#C6A16A]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-[#F5F2EF]">
                          {enquiry.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                        {enquiry.referenceCode && (
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0D0D10] text-[#8E8A85] rounded border border-[#373138]">
                            {enquiry.referenceCode}
                          </span>
                        )}
                      </div>

                      {/* Customer Contact & Party Size */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#B7A9A7]">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#C6A16A]" />
                          <span>{enquiry.phone}</span>
                        </span>
                        {enquiry.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#C6A16A]" />
                            <span>{enquiry.email}</span>
                          </span>
                        )}
                        {(() => {
                          const displayGuests = enquiry.details?.guestRange || (enquiry.guests ? `${enquiry.guests} Guests` : null);
                          if (!displayGuests) return null;
                          return (
                            <span className="flex items-center gap-1 text-[#F5F2EF]">
                              <User className="w-3 h-3 text-[#C6A16A]" />
                              <span>{displayGuests}</span>
                            </span>
                          );
                        })()}
                      </div>

                      {/* Labeled Dates & Timing Section */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs">
                        {/* Event Date / Preferred Dining Date (Prominent) */}
                        {(() => {
                          const dateLabel = getEnquiryDateLabel(enquiry.type);
                          const isGeneralContact = enquiry.type === "contact";
                          const hasDate = Boolean(enquiry.hasEventDate || enquiry.eventDate || enquiry.dates);
                          const formattedDate = formatEnquiryDate(enquiry.eventDate || enquiry.dates);
                          const timeStr = enquiry.eventTime ? ` at ${enquiry.eventTime}` : "";

                          if (hasDate && formattedDate) {
                            return (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 font-medium shadow-2xs">
                                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="text-[11px] font-semibold text-amber-300">{dateLabel}:</span>
                                <span className="font-semibold text-[#F5F2EF]">{formattedDate}{timeStr}</span>
                              </div>
                            );
                          }

                          if (!isGeneralContact) {
                            return (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#232126] border border-[#373138] text-[#8E8A85] text-xs">
                                <Calendar className="w-3.5 h-3.5 text-[#8E8A85] shrink-0" />
                                <span className="text-[11px] font-medium text-[#8E8A85]">{dateLabel}:</span>
                                <span className="italic">Not specified</span>
                              </div>
                            );
                          }

                          return null;
                        })()}

                        {/* Received On (Timestamp, Asia/Kolkata) */}
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-[#8E8A85]">
                          <Clock className="w-3.5 h-3.5 text-[#C6A16A] shrink-0" />
                          <span className="font-medium text-[#8E8A85]">Received On:</span>
                          <span className="font-mono text-[#B7A9A7] font-medium">
                            {formatReceivedTimestamp(enquiry.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Clean Description without repeated dates */}
                      {enquiry.notes && (
                        <p className="text-xs text-[#B7A9A7] mt-1 line-clamp-2 bg-[#141316] p-2 rounded-lg border border-[#373138]">
                          {cleanEnquiryNotes(enquiry.notes)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status, WhatsApp, Note & Three-Dot Menu */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#373138]">
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
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm shadow-emerald-950/40"
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
                      className="px-3 py-1.5 rounded-xl bg-[#232126] hover:bg-[#2c2a30] text-[#F5F2EF] text-xs font-medium border border-[#373138] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <StickyNote className="w-3.5 h-3.5 text-[#C6A16A]" />
                      <span>Add Note</span>
                    </button>

                    {/* Three-Dot Action Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : enquiry.id);
                        }}
                        className="p-1.5 rounded-lg border border-[#373138] hover:bg-[#232126] text-[#B7A9A7] transition cursor-pointer"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-[#1A191D] border border-[#373138] shadow-2xl py-1 text-xs text-[#F5F2EF] animate-in fade-in"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setDetailModalEnquiry(enquiry);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#232126] flex items-center gap-2 cursor-pointer text-[#F5F2EF]"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C6A16A]" />
                            <span>View Full Details</span>
                          </button>

                          <button
                            onClick={() => handleArchiveSingle(enquiry)}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#232126] flex items-center gap-2 cursor-pointer text-[#B7A9A7]"
                          >
                            <Archive className="w-3.5 h-3.5 text-[#8E8A85]" />
                            <span>Archive Lead</span>
                          </button>

                          <div className="border-t border-[#373138] my-1" />

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeleteModalEnquiry(enquiry);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Lead</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-[#8E8A85] mx-auto" />
            <h4 className="text-sm font-semibold text-[#F5F2EF]">No enquiries found</h4>
            <p className="text-xs text-[#8E8A85]">
              {searchQuery
                ? "No guest leads match your current search criteria."
                : "All guest enquiries have been attended to."}
            </p>
          </div>
        )}
      </div>

      {/* Modal: View Full Details */}
      {detailModalEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-[#F5F2EF]">
            <div className="flex items-center justify-between border-b border-[#373138] pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                  Lead Details · {detailModalEnquiry.name}
                </h3>
                <span className="text-[11px] text-[#8E8A85] font-mono">
                  Reference: {detailModalEnquiry.referenceCode || detailModalEnquiry.id}
                </span>
              </div>
              <button
                onClick={() => setDetailModalEnquiry(null)}
                className="text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#141316] rounded-xl border border-[#373138]">
                <div>
                  <span className="text-[#8E8A85] block text-[10px] uppercase font-semibold">Customer Name</span>
                  <span className="text-[#F5F2EF] font-semibold">{detailModalEnquiry.name}</span>
                </div>
                <div>
                  <span className="text-[#8E8A85] block text-[10px] uppercase font-semibold">Phone</span>
                  <span className="font-mono text-[#F5F2EF] font-medium">{detailModalEnquiry.phone}</span>
                </div>
                <div>
                  <span className="text-[#8E8A85] block text-[10px] uppercase font-semibold">Email</span>
                  <span className="text-[#F5F2EF]">{detailModalEnquiry.email || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-[#8E8A85] block text-[10px] uppercase font-semibold">Enquiry Category</span>
                  <span className="font-medium text-[#C6A16A]">
                    {typeBadges[detailModalEnquiry.type]?.label || detailModalEnquiry.type}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8A85] block text-[10px] uppercase font-semibold">Current Status</span>
                  <span className="font-medium text-[#F5F2EF] capitalize">{detailModalEnquiry.status}</span>
                </div>
                {(detailModalEnquiry.details?.guestRange || detailModalEnquiry.guests) && (
                  <div>
                    <span className="text-[#8E8A85] block text-[10px] uppercase font-semibold">Estimated Guests</span>
                    <span className="font-medium text-[#F5F2EF]">
                      {detailModalEnquiry.details?.guestRange || `${detailModalEnquiry.guests} Guests`}
                    </span>
                  </div>
                )}
              </div>

              {/* Labeled Dates & Timing Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-950/20 rounded-xl border border-amber-800/30">
                {/* Event / Dining Date */}
                <div>
                  <span className="text-amber-400 block text-[10px] uppercase font-semibold mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>{getEnquiryDateLabel(detailModalEnquiry.type)}</span>
                  </span>
                  <p className="font-semibold text-sm text-[#F5F2EF]">
                    {detailModalEnquiry.hasEventDate || detailModalEnquiry.eventDate || detailModalEnquiry.dates
                      ? formatEnquiryDate(detailModalEnquiry.eventDate || detailModalEnquiry.dates)
                      : (detailModalEnquiry.type === "contact" ? "Not requested" : "Not specified")}
                  </p>
                  {detailModalEnquiry.eventTime && (
                    <span className="text-xs text-[#B7A9A7] block mt-0.5">
                      Preferred Time: <strong className="text-[#F5F2EF]">{detailModalEnquiry.eventTime}</strong>
                    </span>
                  )}
                </div>

                {/* Received Date & Time (Submission Timestamp) */}
                <div>
                  <span className="text-[#8E8A85] block text-[10px] uppercase font-semibold mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#C6A16A]" />
                    <span>Received On (Submission Time)</span>
                  </span>
                  <p className="font-mono text-xs font-semibold text-[#F5F2EF]">
                    {formatReceivedTimestamp(detailModalEnquiry.createdAt)}
                  </p>
                  <span className="text-[10px] text-[#8E8A85] block mt-0.5">Timezone: Asia/Kolkata (IST)</span>
                </div>
              </div>

              {detailModalEnquiry.notes && (
                <div>
                  <span className="text-[#8E8A85] block text-[10px] uppercase font-semibold mb-1">
                    Event Summary &amp; Customer Notes
                  </span>
                  <div className="p-3 rounded-xl bg-[#141316] border border-[#373138] text-[#B7A9A7] whitespace-pre-wrap leading-relaxed">
                    {cleanEnquiryNotes(detailModalEnquiry.notes)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#373138]">
              <button
                onClick={() => {
                  setDeleteModalEnquiry(detailModalEnquiry);
                  setDetailModalEnquiry(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 font-semibold text-xs transition flex items-center gap-1.5 border border-rose-800/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete This Lead</span>
              </button>

              <button
                onClick={() => setDetailModalEnquiry(null)}
                className="px-4 py-2 rounded-xl bg-[#742B40] text-white font-semibold text-xs hover:bg-[#5E2233] border border-[#C6A16A]/30 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Internal Note */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-[#F5F2EF]">
            <div className="flex items-center justify-between border-b border-[#373138] pb-3">
              <h3 className="text-base font-serif font-bold text-[#F5F2EF]">
                Add Internal Follow-up Note
              </h3>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#B7A9A7] mb-1 font-medium">Assigned Staff / Author</label>
                <input
                  type="text"
                  value={noteAuthor}
                  onChange={(e) => setNoteAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div>
                <label className="block text-[#B7A9A7] mb-1 font-medium">Note Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Spoke to guest regarding corporate group stay. Sent quotation for 5 Super Deluxe rooms."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D10] border border-[#373138] text-[#F5F2EF] focus:outline-none focus:border-[#C6A16A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#373138]">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingNote}
                  className="px-4 py-2 rounded-xl bg-[#742B40] hover:bg-[#5E2233] text-white font-semibold border border-[#C6A16A]/30 cursor-pointer"
                >
                  {isAddingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Single Enquiry Deletion */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteModalEnquiry)}
        title={`Delete Enquiry from ${deleteModalEnquiry?.name}?`}
        description="This will permanently delete this customer lead record from the database."
        impactDetails={
          deleteModalEnquiry
            ? [
                { label: "Guest Name", value: deleteModalEnquiry.name },
                { label: "Phone", value: deleteModalEnquiry.phone },
                { label: "Type", value: typeBadges[deleteModalEnquiry.type]?.label || deleteModalEnquiry.type },
                { label: "Status", value: deleteModalEnquiry.status },
              ]
            : []
        }
        requireTypeDelete={true}
        requiredConfirmationText="DELETE"
        onClose={() => setDeleteModalEnquiry(null)}
        onConfirm={handleConfirmSingleDelete}
      />

      {/* Confirmation Modal: Bulk Enquiry Deletion */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteOpen}
        title={`Bulk Delete ${selectedIds.length} Selected Enquiries?`}
        description="This will permanently delete all selected lead records from the CRM inbox."
        impactDetails={[
          { label: "Selected Records", value: selectedIds.length },
          { label: "Category", value: activeTab.toUpperCase() },
          { label: "Action", value: "Permanent Database Deletion" },
        ]}
        requireTypeDelete={true}
        requiredConfirmationText="DELETE"
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
      />
    </div>
  );
}
