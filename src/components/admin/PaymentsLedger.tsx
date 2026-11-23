"use client";

import React, { useState, useMemo } from "react";
import { BookingRecord } from "@/actions/rooms";
import { ReservationRecord } from "@/actions/reservations";
import { formatINR } from "@/config/hotel";
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  ExternalLink,
  CreditCard,
  Building,
  Calendar,
  X,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export interface PaymentTransaction {
  id: string;
  referenceCode: string;
  guestName: string;
  guestPhone: string;
  amount: number;
  totalAmount: number;
  status: "paid" | "captured" | "pending" | "failed" | "refunded";
  gateway: "Razorpay" | "Front Desk Cash" | "Direct UPI";
  paymentId?: string;
  orderId?: string;
  method?: string;
  paidAt?: string;
  createdAt: string;
  roomCategory: string;
  environment?: "TEST" | "LIVE";
}

interface PaymentsLedgerProps {
  bookings: BookingRecord[];
  reservations: ReservationRecord[];
}

export default function PaymentsLedger({ bookings, reservations }: PaymentsLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);

  // Normalize payments ledger from bookings and reservations
  const transactions = useMemo(() => {
    const list: PaymentTransaction[] = [];

    // From bookings (online bookings with Razorpay)
    bookings.forEach((b) => {
      const isPaid =
        b.status === "paid" ||
        b.status === "confirmed" ||
        b.status === "checked_in" ||
        b.status === "checked_out" ||
        Boolean(b.amountPaid && b.amountPaid > 0);

      list.push({
        id: b.id,
        referenceCode: b.bookingCode,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        amount: b.amountPaid || b.totalAmount || 0,
        totalAmount: b.totalAmount || 0,
        status: isPaid ? "paid" : b.status === "failed" ? "failed" : "pending",
        gateway: b.razorpayPaymentId ? "Razorpay" : "Front Desk Cash",
        paymentId: b.razorpayPaymentId,
        orderId: b.razorpayOrderId,
        method: b.paymentMethod || (b.razorpayPaymentId ? "Online / Card / UPI" : "Front Desk Pay"),
        paidAt: b.paidAt,
        createdAt: b.createdAt,
        roomCategory: b.categoryName || b.categorySlug,
        environment: b.paymentEnvironment || (b.razorpayPaymentId ? "TEST" : undefined),
      });
    });

    // From reservations
    reservations.forEach((r) => {
      if (list.some((tx) => tx.referenceCode === r.reference_code)) return;

      const isPaid = r.status === "paid" || Boolean(r.amount_paid && r.amount_paid > 0);

      list.push({
        id: r.id,
        referenceCode: r.reference_code || r.id.slice(0, 8),
        guestName: r.full_name,
        guestPhone: r.phone,
        amount: r.amount_paid || r.estimated_total || 0,
        totalAmount: r.estimated_total || 0,
        status: isPaid ? "paid" : r.status === "cancelled" ? "failed" : "pending",
        gateway: r.razorpay_payment_id ? "Razorpay" : "Direct UPI",
        paymentId: r.razorpay_payment_id || undefined,
        orderId: r.razorpay_order_id || undefined,
        method: r.payment_method || (r.razorpay_payment_id ? "Razorpay" : "Pay at Hotel"),
        paidAt: r.paid_at || undefined,
        createdAt: r.created_at,
        roomCategory: r.room_type,
        environment: r.payment_environment || (r.razorpay_payment_id ? "TEST" : undefined),
      });
    });

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bookings, reservations]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.referenceCode.toLowerCase().includes(q) ||
        tx.guestName.toLowerCase().includes(q) ||
        tx.guestPhone.includes(q) ||
        (tx.paymentId && tx.paymentId.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === "paid") return tx.status === "paid" || tx.status === "captured";
      if (statusFilter === "pending") return tx.status === "pending";
      if (statusFilter === "failed") return tx.status === "failed";

      return true;
    });
  }, [transactions, searchQuery, statusFilter]);

  // Aggregate metrics
  const totalCollected = useMemo(() => {
    return transactions
      .filter((tx) => tx.status === "paid" || tx.status === "captured")
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

  const razorpayOnlineShare = useMemo(() => {
    return transactions
      .filter((tx) => (tx.status === "paid" || tx.status === "captured") && tx.gateway === "Razorpay")
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

  const pendingAmount = useMemo(() => {
    return transactions
      .filter((tx) => tx.status === "pending")
      .reduce((acc, tx) => acc + tx.totalAmount, 0);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
              Total Revenue Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#F5F2EF] mt-2">
            {formatINR(totalCollected)}
          </div>
          <p className="text-xs text-[#8E8A85] mt-1">Confirmed payments received</p>
        </div>

        <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
              Razorpay Gateway (Online)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#742B40]/25 text-[#ED252C] border border-[#742B40]/40 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#ED252C] mt-2">
            {formatINR(razorpayOnlineShare)}
          </div>
          <p className="text-xs text-[#8E8A85] mt-1">Direct web booking collections</p>
        </div>

        <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
              Pending Payment Amount
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#F5F2EF] mt-2">
            {formatINR(pendingAmount)}
          </div>
          <p className="text-xs text-[#8E8A85] mt-1">Awaiting online or desk settlement</p>
        </div>

        <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8A85]">
              Total Transactions
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#F5F2EF] mt-2">
            {transactions.length}
          </div>
          <p className="text-xs text-[#8E8A85] mt-1">All booking &amp; reservation records</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking ref (FRM-xxxx), guest, payment ID..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D0D10] border border-[#373138] rounded-xl text-xs text-[#F5F2EF] placeholder-[#8E8A85] focus:outline-none focus:border-[#C6A16A] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
            }`}
          >
            All Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              statusFilter === "paid"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
            }`}
          >
            Paid / Captured
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              statusFilter === "pending"
                ? "bg-[#742B40] text-white border border-[#C6A16A]/20 shadow-sm"
                : "bg-[#232126] text-[#B7A9A7] hover:text-[#F5F2EF] border border-[#373138]"
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#1A191D] border border-[#373138] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#232126] border-b border-[#373138] text-[#8E8A85] uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Guest Details</th>
                <th className="py-3 px-4">Room Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Gateway &amp; Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#373138]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8E8A85]">
                    No payment records found matching query.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#232126]/60 transition cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C6A16A]">
                      {tx.referenceCode}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#F5F2EF]">{tx.guestName}</div>
                      <div className="text-[11px] text-[#8E8A85] font-mono">{tx.guestPhone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-[#B7A9A7]">
                      <span className="px-2 py-0.5 rounded-lg bg-[#232126] border border-[#373138] text-[11px]">
                        {tx.roomCategory}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#F5F2EF]">
                      {formatINR(tx.amount)}
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-[#F5F2EF]">
                        {tx.gateway === "Razorpay" ? (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                        <span>{tx.gateway}</span>
                        {tx.environment === "TEST" && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50 text-[9px] font-mono font-bold tracking-wider">
                            TEST
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8E8A85] font-mono truncate max-w-[140px]">
                        {tx.paymentId || tx.method || "Direct"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.status === "paid" || tx.status === "captured" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      ) : tx.status === "failed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/50">
                          <AlertCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/50">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#8E8A85] font-mono text-[11px]">
                      {tx.paidAt
                        ? new Date(tx.paidAt).toLocaleDateString("en-IN")
                        : new Date(tx.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 rounded-lg text-[#8E8A85] hover:text-[#C6A16A] hover:bg-[#232126] transition cursor-pointer"
                        title="View Payment Verification"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A191D] border border-[#373138] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-[#F5F2EF]">
            <div className="flex items-center justify-between pb-3 border-b border-[#373138]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#F5F2EF]">
                  Payment Voucher · {selectedTx.referenceCode}
                </h3>
                <p className="text-xs text-[#8E8A85]">
                  {selectedTx.gateway} Transaction Audit Record
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-[#8E8A85] hover:text-[#F5F2EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#232126] border border-[#373138] text-center space-y-1">
              <span className="text-xs text-[#8E8A85] uppercase tracking-wider block font-semibold">
                Settled Amount
              </span>
              <span className="text-3xl font-bold font-serif text-[#ED252C]">
                {formatINR(selectedTx.amount)}
              </span>
              <span className="text-xs text-emerald-400 font-semibold block">
                Full 100% Online Payment Mode
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#373138]">
                <span className="text-[#8E8A85]">Payment Environment:</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/50">
                  {selectedTx.environment || (selectedTx.paymentId ? "TEST" : "DIRECT")} MODE
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#373138]">
                <span className="text-[#8E8A85]">Payment Status:</span>
                <span className="font-semibold uppercase text-emerald-400">
                  {selectedTx.status === "paid" || selectedTx.status === "captured" ? "PAID" : selectedTx.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#373138]">
                <span className="text-[#8E8A85]">Guest:</span>
                <span className="font-semibold text-[#F5F2EF]">{selectedTx.guestName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#373138]">
                <span className="text-[#8E8A85]">Phone:</span>
                <span className="font-mono text-[#F5F2EF]">{selectedTx.guestPhone}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#373138]">
                <span className="text-[#8E8A85]">Room Category:</span>
                <span className="text-[#F5F2EF]">{selectedTx.roomCategory}</span>
              </div>
              {selectedTx.paymentId && (
                <div className="flex items-center justify-between py-1.5 border-b border-[#373138]">
                  <span className="text-[#8E8A85]">Razorpay Payment ID:</span>
                  <span className="font-mono font-semibold text-[#C6A16A]">
                    {selectedTx.paymentId}
                  </span>
                </div>
              )}
              {selectedTx.orderId && (
                <div className="flex items-center justify-between py-1.5 border-b border-[#373138]">
                  <span className="text-[#8E8A85]">Razorpay Order ID:</span>
                  <span className="font-mono text-[#B7A9A7]">{selectedTx.orderId}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#8E8A85]">Timestamp:</span>
                <span className="font-mono text-[#8E8A85]">
                  {selectedTx.paidAt || selectedTx.createdAt}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#373138] flex items-center justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2 rounded-xl bg-[#742B40] hover:bg-[#8B344D] text-white border border-[#C6A16A]/20 text-xs font-semibold transition cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
