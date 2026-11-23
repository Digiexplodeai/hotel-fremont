"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  CreditCard,
  Calendar,
  Users,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/config/hotel";
import {
  getTestDataSummaryAction,
  cleanupTestDataAction,
} from "@/actions/recordManagement";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function TestDataCleanup() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    bookings: any[];
    reservations: any[];
    enquiries: any[];
    totalSimulatedAmount: number;
    isTestMode: boolean;
  }>({
    bookings: [],
    reservations: [],
    enquiries: [],
    totalSimulatedAmount: 0,
    isTestMode: true,
  });

  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [selectedReservationIds, setSelectedReservationIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "reservations" | "enquiries">("bookings");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"selected" | "all">("selected");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setSuccessBanner(null);
    try {
      const res = await getTestDataSummaryAction();
      if (res.success) {
        setData({
          bookings: res.bookings,
          reservations: res.reservations,
          enquiries: res.enquiries,
          totalSimulatedAmount: res.totalSimulatedAmount,
          isTestMode: res.isTestMode,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const totalItems = data.bookings.length + data.reservations.length + data.enquiries.length;

  const handleToggleBooking = (id: string) => {
    setSelectedBookingIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleReservation = (id: string) => {
    setSelectedReservationIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllInTab = () => {
    if (activeTab === "bookings") {
      if (selectedBookingIds.length === data.bookings.length) {
        setSelectedBookingIds([]);
      } else {
        setSelectedBookingIds(data.bookings.map((b) => b.id));
      }
    } else {
      const targetList = activeTab === "reservations" ? data.reservations : data.enquiries;
      const targetIds = targetList.map((r) => r.id);
      const isAllSelected = targetIds.every((id) => selectedReservationIds.includes(id));
      if (isAllSelected) {
        setSelectedReservationIds((prev) => prev.filter((id) => !targetIds.includes(id)));
      } else {
        setSelectedReservationIds((prev) => Array.from(new Set([...prev, ...targetIds])));
      }
    }
  };

  const handleExecuteDelete = async () => {
    if (deleteMode === "all") {
      const res = await cleanupTestDataAction({ cleanAll: true, reason: "Full pre-launch test data clean slate" });
      if (res.success) {
        setSuccessBanner(`Successfully deleted ${res.deletedBookingsCount} bookings and ${res.deletedReservationsCount} reservations/enquiries.`);
        setSelectedBookingIds([]);
        setSelectedReservationIds([]);
        await fetchSummary();
      } else {
        throw new Error(res.error || "Cleanup failed.");
      }
    } else {
      const res = await cleanupTestDataAction({
        bookingIds: selectedBookingIds,
        reservationIds: selectedReservationIds,
        reason: "Selective test data cleanup from admin panel",
      });
      if (res.success) {
        setSuccessBanner(`Successfully deleted ${res.deletedBookingsCount} bookings and ${res.deletedReservationsCount} reservations.`);
        setSelectedBookingIds([]);
        setSelectedReservationIds([]);
        await fetchSummary();
      } else {
        throw new Error(res.error || "Selective deletion failed.");
      }
    }
  };

  const selectedCount = selectedBookingIds.length + selectedReservationIds.length;

  return (
    <div className="bg-[#1A191D] border border-[#373138] rounded-2xl shadow-sm overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-6 border-b border-[#373138] bg-[#232126] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              Razorpay Test Mode Active
            </span>
          </div>
          <h3 className="font-serif font-bold text-lg text-[#F5F2EF]">
            Test Data Management &amp; Pre-Launch Clean Slate
          </h3>
          <p className="text-xs text-[#8E8A85] mt-0.5">
            Safely inspect, archive, and permanently delete simulated test bookings and enquiries before go-live.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="p-2 rounded-xl bg-[#1A191D] border border-[#373138] text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#232126] transition disabled:opacity-50 cursor-pointer"
            title="Refresh Test Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {totalItems > 0 && (
            <button
              onClick={() => {
                setDeleteMode("all");
                setDeleteModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean All Test Data</span>
            </button>
          )}
        </div>
      </div>

      {successBanner && (
        <div className="m-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-b border-[#373138]">
        <div className="p-4 rounded-xl bg-[#232126] border border-[#373138]">
          <span className="text-[10px] font-semibold text-[#8E8A85] uppercase tracking-wider block">
            Test Online Bookings
          </span>
          <span className="text-2xl font-serif font-bold text-[#F5F2EF] mt-1 block">
            {data.bookings.length}
          </span>
          <span className="text-[11px] text-amber-400 font-mono mt-0.5 block">
            Razorpay Simulated
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#232126] border border-[#373138]">
          <span className="text-[10px] font-semibold text-[#8E8A85] uppercase tracking-wider block">
            Test Room Reservations
          </span>
          <span className="text-2xl font-serif font-bold text-[#F5F2EF] mt-1 block">
            {data.reservations.length}
          </span>
          <span className="text-[11px] text-[#8E8A85] mt-0.5 block">
            Front Desk Test Records
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#232126] border border-[#373138]">
          <span className="text-[10px] font-semibold text-[#8E8A85] uppercase tracking-wider block">
            Test Leads &amp; Enquiries
          </span>
          <span className="text-2xl font-serif font-bold text-[#F5F2EF] mt-1 block">
            {data.enquiries.length}
          </span>
          <span className="text-[11px] text-[#8E8A85] mt-0.5 block">
            Banquet / Dining Inquiries
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#232126] border border-[#373138]">
          <span className="text-[10px] font-semibold text-[#8E8A85] uppercase tracking-wider block">
            Simulated Revenue
          </span>
          <span className="text-2xl font-serif font-bold text-[#ED252C] mt-1 block">
            {formatINR(data.totalSimulatedAmount)}
          </span>
          <span className="text-[11px] text-emerald-400 mt-0.5 block">
            100% Test Mode Volume
          </span>
        </div>
      </div>

      {/* Tabs and Bulk Action Bar */}
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "bookings"
                  ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                  : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
              }`}
            >
              Test Bookings ({data.bookings.length})
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "reservations"
                  ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                  : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
              }`}
            >
              Test Reservations ({data.reservations.length})
            </button>
            <button
              onClick={() => setActiveTab("enquiries")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "enquiries"
                  ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                  : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
              }`}
            >
              Test Enquiries ({data.enquiries.length})
            </button>
          </div>

          {/* Selected Action */}
          {selectedCount > 0 && (
            <button
              onClick={() => {
                setDeleteMode("selected");
                setDeleteModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete {selectedCount} Selected Record(s)</span>
            </button>
          )}
        </div>

        {/* Records Table */}
        <div className="border border-[#373138] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#232126] border-b border-[#373138] text-[#8E8A85] uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">
                  <button onClick={handleSelectAllInTab} className="text-[#8E8A85] hover:text-[#F5F2EF]">
                    <CheckSquare className="w-4 h-4" />
                  </button>
                </th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Category / Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment Env</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#373138]">
              {activeTab === "bookings" &&
                (data.bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8E8A85]">
                      No test bookings in database. Clean slate confirmed!
                    </td>
                  </tr>
                ) : (
                  data.bookings.map((b) => {
                    const isSelected = selectedBookingIds.includes(b.id);
                    return (
                      <tr
                        key={b.id}
                        className={`hover:bg-[#232126]/60 transition cursor-pointer ${
                          isSelected ? "bg-rose-950/30" : ""
                        }`}
                        onClick={() => handleToggleBooking(b.id)}
                      >
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleBooking(b.id)}
                            className="rounded border-[#373138] bg-[#0D0D10] text-[#742B40] focus:ring-[#742B40] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C6A16A]">
                          {b.booking_ref}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#F5F2EF]">
                          {b.guest_name}
                        </td>
                        <td className="py-3.5 px-4 text-[#B7A9A7]">
                          {b.room_category}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#8E8A85] text-[11px]">
                          {b.check_in} → {b.check_out}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F5F2EF]">
                          {formatINR(Number(b.total_amount) || 0)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                            TEST
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 uppercase">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ))}

              {activeTab === "reservations" &&
                (data.reservations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8E8A85]">
                      No test reservations in database.
                    </td>
                  </tr>
                ) : (
                  data.reservations.map((r) => {
                    const isSelected = selectedReservationIds.includes(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-[#232126]/60 transition cursor-pointer ${
                          isSelected ? "bg-rose-950/30" : ""
                        }`}
                        onClick={() => handleToggleReservation(r.id)}
                      >
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleReservation(r.id)}
                            className="rounded border-[#373138] bg-[#0D0D10] text-[#742B40] focus:ring-[#742B40] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C6A16A]">
                          {r.reference_code || `FRM-${r.id.slice(0, 6)}`}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#F5F2EF]">
                          {r.full_name}
                        </td>
                        <td className="py-3.5 px-4 text-[#B7A9A7]">
                          {r.room_type}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#8E8A85] text-[11px]">
                          {r.check_in} → {r.check_out}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F5F2EF]">
                          {formatINR(Number(r.estimated_total) || 0)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                            TEST
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 uppercase">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ))}

              {activeTab === "enquiries" &&
                (data.enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8E8A85]">
                      No test enquiries in database.
                    </td>
                  </tr>
                ) : (
                  data.enquiries.map((e) => {
                    const isSelected = selectedReservationIds.includes(e.id);
                    return (
                      <tr
                        key={e.id}
                        className={`hover:bg-[#232126]/60 transition cursor-pointer ${
                          isSelected ? "bg-rose-950/30" : ""
                        }`}
                        onClick={() => handleToggleReservation(e.id)}
                      >
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleReservation(e.id)}
                            className="rounded border-[#373138] bg-[#0D0D10] text-[#742B40] focus:ring-[#742B40] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C6A16A]">
                          {e.reference_code || `FRM-${e.id.slice(0, 6)}`}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#F5F2EF]">
                          {e.full_name}
                        </td>
                        <td className="py-3.5 px-4 text-[#B7A9A7]">
                          {e.room_type || e.channel}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#8E8A85] text-[11px]">
                          {e.check_in || "General Inquiry"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F5F2EF]">
                          —
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                            TEST
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/50 uppercase">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleExecuteDelete}
        title={
          deleteMode === "all"
            ? "Clean All Hotel Fremont Test Data?"
            : `Delete ${selectedCount} Selected Test Record(s)?`
        }
        description={
          deleteMode === "all"
            ? "This will permanently remove all test bookings, test reservations, and simulated enquiries created during the testing phase. Your 21-room inventory, rates, and configuration will remain untouched."
            : `This will permanently delete the ${selectedCount} selected test records from Supabase. This operation cannot be undone.`
        }
        impactDetails={
          deleteMode === "all"
            ? [
                { label: "Test Bookings to Delete", value: `${data.bookings.length} Records` },
                { label: "Test Reservations to Delete", value: `${data.reservations.length} Records` },
                { label: "Test Enquiries to Delete", value: `${data.enquiries.length} Records` },
                { label: "Simulated Volume Cleaned", value: formatINR(data.totalSimulatedAmount) },
                { label: "Environment Mode", value: "Razorpay Test Mode" },
              ]
            : [
                { label: "Selected Bookings", value: `${selectedBookingIds.length} Records` },
                { label: "Selected Reservations", value: `${selectedReservationIds.length} Records` },
                { label: "Total Selected", value: `${selectedCount} Records` },
              ]
        }
        requireTypeDelete={true}
        requiredConfirmationText={deleteMode === "all" ? "DELETE TEST DATA" : "DELETE"}
        confirmButtonText={deleteMode === "all" ? "Clean Slate (Delete All)" : "Delete Selected"}
      />
    </div>
  );
}
