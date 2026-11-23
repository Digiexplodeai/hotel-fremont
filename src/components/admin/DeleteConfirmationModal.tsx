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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#1A191D] border border-[#373138] rounded-2xl shadow-2xl overflow-hidden text-[#F5F2EF]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#373138] bg-[#232126] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDestructive
                  ? "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                  : "bg-amber-950/60 text-amber-400 border border-amber-800/50"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#F5F2EF]">{title}</h3>
              <p className="text-xs text-[#8E8A85]">Administrative Record Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#373138] transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-[#B7A9A7] leading-relaxed">{description}</p>

          {/* Impact list */}
          {impactDetails && impactDetails.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#141316] border border-[#373138] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#8E8A85] tracking-wider block">
                Target Record Details
              </span>
              <div className="divide-y divide-[#373138]">
                {impactDetails.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                    <span className="text-[#8E8A85] font-medium">{item.label}:</span>
                    <span className="font-semibold text-[#F5F2EF] font-mono text-right truncate max-w-[220px]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety warning */}
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Audit Safety:</strong> This action will be recorded in the administrative audit log. Legally required payment reconciliations are safely retained.
            </div>
          </div>

          {/* Type to confirm requirement */}
          {requireTypeDelete && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-medium text-[#B7A9A7]">
                To confirm permanent deletion, type{" "}
                <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
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
                className="w-full px-3 py-2 rounded-xl border border-[#373138] bg-[#0D0D10] text-xs font-mono text-white placeholder-[#8E8A85] focus:outline-none focus:border-rose-500 focus:bg-[#141316] transition"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#373138] bg-[#232126] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#1A191D] border border-[#373138] text-xs font-semibold text-[#B7A9A7] hover:text-[#F5F2EF] hover:bg-[#373138] transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isSubmitting}
            className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-700 shadow-sm"
                : "bg-[#742B40] hover:bg-[#8B344D] border border-[#C6A16A]/20 shadow-sm"
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
