"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  impactDetails?: { label: string; value: string | number }[];
  requireTypeDelete?: boolean;
  requiredConfirmationText?: string;
  confirmButtonText?: string;
  isDestructive?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  impactDetails,
  requireTypeDelete = true,
  requiredConfirmationText = "DELETE",
  confirmButtonText = "Delete Permanently",
  isDestructive = true,
}: DeleteConfirmationModalProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmationValid =
    !requireTypeDelete ||
    typedConfirmation.trim().toUpperCase() === requiredConfirmationText.toUpperCase();

  const handleConfirm = async () => {
    if (!isConfirmationValid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      setTypedConfirmation("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute deletion.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white border border-[#EAE8E3] rounded-2xl shadow-2xl overflow-hidden text-[#24272B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EAE8E3] bg-[#FAF9F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDestructive
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#24272B]">{title}</h3>
              <p className="text-xs text-[#6B7280]">Administrative Record Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#6B7280] hover:text-[#24272B] hover:bg-[#EAE8E3]/50 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-[#4B5563] leading-relaxed">{description}</p>

          {/* Impact list */}
          {impactDetails && impactDetails.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#EAE8E3] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider block">
                Target Record Details
              </span>
              <div className="divide-y divide-[#EAE8E3]/70">
                {impactDetails.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                    <span className="text-[#6B7280] font-medium">{item.label}:</span>
                    <span className="font-semibold text-[#24272B] font-mono text-right truncate max-w-[220px]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety warning */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Audit Safety:</strong> This action will be recorded in the administrative audit log. Legally required payment reconciliations are safely retained.
            </div>
          </div>

          {/* Type to confirm requirement */}
          {requireTypeDelete && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-medium text-[#4B5563]">
                To confirm permanent deletion, type{" "}
                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  {requiredConfirmationText}
                </span>{" "}
                below:
              </label>
              <input
                type="text"
                autoFocus
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder={`Type "${requiredConfirmationText}" to confirm`}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#F8F7F4] text-xs font-mono focus:outline-none focus:border-rose-600 focus:bg-white transition"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#EAE8E3] bg-[#FAF9F7] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white border border-[#EAE8E3] text-xs font-semibold text-[#4B5563] hover:text-[#24272B] hover:bg-[#F8F7F4] transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isSubmitting}
            className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              isDestructive
                ? "bg-rose-700 hover:bg-rose-800 shadow-sm"
                : "bg-[#742B40] hover:bg-[#5b2232] shadow-sm"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
