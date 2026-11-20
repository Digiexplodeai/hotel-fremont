"use client";

import React, { useState } from "react";
import { RoomTypeConfig, formatINR } from "@/config/hotel";
import { updateRoomTypeAction } from "@/actions/roomTypes";
import {
  Tag,
  BedDouble,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Info,
  Layers,
  Percent,
  UtensilsCrossed,
  ShieldCheck,
} from "lucide-react";

interface RatesManagerProps {
  initialRoomTypes: RoomTypeConfig[];
}

export default function RatesManager({ initialRoomTypes }: RatesManagerProps) {
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>(initialRoomTypes);
  const [editingCategory, setEditingCategory] = useState<RoomTypeConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    pricePerNight: number;
    rateEpSingle: number;
    rateEpDouble: number;
    rateCpSingle: number;
    rateCpDouble: number;
  }>({
    pricePerNight: 2299,
    rateEpSingle: 2299,
    rateEpDouble: 2499,
    rateCpSingle: 2499,
    rateCpDouble: 2799,
  });

  const handleStartEdit = (cat: RoomTypeConfig) => {
    setEditingCategory(cat);
    setFormData({
      pricePerNight: cat.pricePerNight,
      rateEpSingle: cat.rateEpSingle || cat.pricePerNight,
      rateEpDouble: cat.rateEpDouble || cat.pricePerNight + 200,
      rateCpSingle: cat.rateCpSingle || cat.pricePerNight + 200,
      rateCpDouble: cat.rateCpDouble || cat.pricePerNight + 500,
    });
    setErrorMessage(null);
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updates = {
        pricePerNight: Number(formData.rateEpSingle),
        rateEpSingle: Number(formData.rateEpSingle),
        rateEpDouble: Number(formData.rateEpDouble),
        rateCpSingle: Number(formData.rateCpSingle),
        rateCpDouble: Number(formData.rateCpDouble),
      };

      const categoryCode = editingCategory.code || editingCategory.slug || "";
      const res = await updateRoomTypeAction(categoryCode, updates);
      if (res.success) {
        setRoomTypes((prev) =>
          prev.map((r) => ((r.code === categoryCode || r.slug === categoryCode) ? { ...r, ...updates } : r))
        );
        setEditingCategory(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(res.error || "Failed to update rates");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving rate plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Rates updated successfully and synchronized to online booking engine!</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-white border border-[#EAE8E3] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#742B40]/10 text-[#742B40] text-[10px] font-bold uppercase tracking-wider">
              Verified 21-Key Pricing Architecture
            </span>
            <span className="text-xs text-[#6B7280]">· EP &amp; CP Meal Plans</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#24272B] mt-1">
            Room Rates, Meal Plans &amp; GST Rules
          </h2>
          <p className="text-xs text-[#6B7280] max-w-2xl mt-0.5 leading-relaxed">
            All prices are dynamically calculated server-side. Indian GST is applied based on government statutory thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] text-xs">
            <span className="text-[10px] text-[#6B7280] uppercase block font-semibold">Active Categories</span>
            <span className="text-[#24272B] font-bold font-mono">3 Room Classes (21 Keys)</span>
          </div>
        </div>
      </div>

      {/* Rates Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roomTypes.map((cat) => {
          const epSingle = cat.rateEpSingle || cat.pricePerNight;
          const epDouble = cat.rateEpDouble || cat.pricePerNight + 200;
          const cpSingle = cat.rateCpSingle || cat.pricePerNight + 200;
          const cpDouble = cat.rateCpDouble || cat.pricePerNight + 500;

          return (
            <div
              key={cat.slug}
              className="bg-white border border-[#EAE8E3] rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="p-5 border-b border-[#EAE8E3] bg-[#FAF9F7] flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#24272B]">{cat.name}</h3>
                    <div className="text-[11px] text-[#6B7280] flex items-center gap-2 mt-0.5">
                      <span>{cat.totalRooms} Keys</span>
                      <span>·</span>
                      <span>{cat.sizeSqft} sq ft</span>
                      <span>·</span>
                      <span>Max {cat.maxGuests} Guests</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-2 rounded-xl bg-white border border-[#EAE8E3] text-[#6B7280] hover:text-[#742B40] hover:border-[#742B40]/30 transition"
                    title="Edit Rate Plans"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Rates Table */}
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-[#742B40]" />
                      <span>EP — Room Only (Without Breakfast)</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3]">
                        <span className="text-[10px] text-[#6B7280] block">Single Guest</span>
                        <span className="text-sm font-bold font-mono text-[#24272B]">
                          {formatINR(epSingle)}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block">+ 12% GST</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8F7F4] border border-[#EAE8E3]">
                        <span className="text-[10px] text-[#6B7280] block">Double Guests</span>
                        <span className="text-sm font-bold font-mono text-[#24272B]">
                          {formatINR(epDouble)}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block">+ 12% GST</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#EAE8E3]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-[#B69A68]" />
                      <span>CP — With Morning Breakfast</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3]">
                        <span className="text-[10px] text-[#6B7280] block">Single Guest</span>
                        <span className="text-sm font-bold font-mono text-[#742B40]">
                          {formatINR(cpSingle)}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block">+ 12% GST</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3]">
                        <span className="text-[10px] text-[#6B7280] block">Double Guests</span>
                        <span className="text-sm font-bold font-mono text-[#742B40]">
                          {formatINR(cpDouble)}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block">+ 12% GST</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-[#FAF9F7] border-t border-[#EAE8E3] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#6B7280]">Floor Inventory</span>
                <span className="font-semibold text-[#24272B]">{cat.bedType}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Statutory GST & Meal Plan Policy Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#742B40]" />
            <h3 className="font-serif font-bold text-sm text-[#24272B]">
              Statutory GST Compliance
            </h3>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            In accordance with Government of India GST Council notifications:
          </p>
          <ul className="text-xs text-[#4B5563] space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#742B40] mt-1.5 shrink-0" />
              <span>
                <strong>12% GST</strong> applies to room tariffs below <strong>₹7,500/night</strong> (CGST 6% + SGST 6%). All Hotel Fremont standard categories fall under this bracket.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#742B40] mt-1.5 shrink-0" />
              <span>
                <strong>18% GST</strong> applies to room tariffs of <strong>₹7,500/night and above</strong>.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-[#EAE8E3] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B69A68]" />
            <h3 className="font-serif font-bold text-sm text-[#24272B]">
              Extra Guest &amp; Child Policies
            </h3>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Standard hotel occupancy rules applied during check-in:
          </p>
          <ul className="text-xs text-[#4B5563] space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B69A68] mt-1.5 shrink-0" />
              <span>
                <strong>Children below 6 years:</strong> Stay complimentary when sharing existing bedding with parents.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B69A68] mt-1.5 shrink-0" />
              <span>
                <strong>Extra Bed / Rollaway:</strong> Available at ₹800/night + taxes upon prior front-desk notice.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Edit Rate Plan Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE8E3] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE8E3]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#24272B]">
                  Edit Rates: {editingCategory.name}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Configure EP (Room Only) and CP (With Breakfast) tariffs
                </p>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:text-[#24272B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveRates} className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#24272B] block">
                  EP Rates (Room Only)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#6B7280] block mb-1">Single Occupancy (₹)</label>
                    <input
                      type="number"
                      value={formData.rateEpSingle}
                      onChange={(e) =>
                        setFormData({ ...formData, rateEpSingle: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-xs font-mono font-bold text-[#24272B] focus:outline-none focus:border-[#742B40]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#6B7280] block mb-1">Double Occupancy (₹)</label>
                    <input
                      type="number"
                      value={formData.rateEpDouble}
                      onChange={(e) =>
                        setFormData({ ...formData, rateEpDouble: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-xs font-mono font-bold text-[#24272B] focus:outline-none focus:border-[#742B40]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#EAE8E3]">
                <span className="text-xs font-semibold text-[#24272B] block">
                  CP Rates (With Breakfast)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#6B7280] block mb-1">Single Occupancy (₹)</label>
                    <input
                      type="number"
                      value={formData.rateCpSingle}
                      onChange={(e) =>
                        setFormData({ ...formData, rateCpSingle: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-xs font-mono font-bold text-[#742B40] focus:outline-none focus:border-[#742B40]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#6B7280] block mb-1">Double Occupancy (₹)</label>
                    <input
                      type="number"
                      value={formData.rateCpDouble}
                      onChange={(e) =>
                        setFormData({ ...formData, rateCpDouble: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-xs font-mono font-bold text-[#742B40] focus:outline-none focus:border-[#742B40]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAE8E3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE8E3] text-xs font-medium text-[#6B7280] hover:text-[#24272B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#742B40] hover:bg-[#5b2232] text-white text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Rate Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
