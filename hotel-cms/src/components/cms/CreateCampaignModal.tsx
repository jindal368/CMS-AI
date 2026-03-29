"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/ui/Portal";

interface Hotel {
  id: string;
  name: string;
  category: string;
}

interface CreateCampaignModalProps {
  hotels: Hotel[];
  onClose: () => void;
}

export default function CreateCampaignModal({ hotels, onClose }: CreateCampaignModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = title.trim() !== "" && brief.trim() !== "" && !loading;

  function toggleHotel(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set());
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const targetHotels = selectAll ? [] : Array.from(selectedIds);

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), brief: brief.trim(), targetHotels }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to create campaign");
      }

      const data = await res.json();
      const campaign = data.data ?? data;

      onClose();
      router.push("/campaigns/" + campaign.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] focus:outline-none text-[#1a1a2e] text-sm placeholder-[#7c7893] transition-colors";
  const labelClass = "block text-xs font-medium text-[#7c7893] mb-1.5";

  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => { if (!loading) onClose(); }}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-lg mx-4 glass-card-static rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e2dfe8]">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#e85d45]">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6a1 1 0 00.804.98l10 2A1 1 0 0018 13V3zM4 7.5A1.5 1.5 0 002.5 9v2A1.5 1.5 0 004 12.5h1V7.5H4z" />
            </svg>
            <h2 className="text-base font-semibold text-[#1a1a2e]">Create Campaign</h2>
          </div>
          <button
            type="button"
            onClick={() => { if (!loading) onClose(); }}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="campaign-title" className={labelClass}>
              Title <span className="text-[#e85d45]">*</span>
            </label>
            <input
              id="campaign-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer Pool Package"
              className={inputClass}
              disabled={loading}
            />
          </div>

          {/* Brief */}
          <div>
            <label htmlFor="campaign-brief" className={labelClass}>
              Brief <span className="text-[#e85d45]">*</span>
            </label>
            <textarea
              id="campaign-brief"
              required
              rows={4}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="20% off all pool-view rooms. Highlight pool amenities, target couples and families."
              className={`${inputClass} resize-none`}
              disabled={loading}
            />
          </div>

          {/* Target Hotels */}
          {hotels.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={labelClass.replace(" mb-1.5", "")}>Target Hotels</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={loading}
                    className="w-3.5 h-3.5 accent-[#e85d45]"
                  />
                  <span className="text-xs text-[#7c7893] font-medium">Select All</span>
                </label>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {hotels.map((hotel) => (
                  <label
                    key={hotel.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      selectAll
                        ? "bg-[#f0eef5]/50 border-[#e2dfe8] opacity-60 cursor-not-allowed"
                        : selectedIds.has(hotel.id)
                        ? "bg-[#e85d45]/8 border-[#e85d45]/30"
                        : "bg-[#f0eef5] border-[#e2dfe8] hover:border-[#7c5cbf]/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectAll || selectedIds.has(hotel.id)}
                      onChange={() => { if (!selectAll) toggleHotel(hotel.id); }}
                      disabled={loading || selectAll}
                      className="w-3.5 h-3.5 accent-[#e85d45] shrink-0"
                    />
                    <span className="text-sm text-[#1a1a2e] flex-1 truncate">{hotel.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#7c5cbf]/10 text-[#7c5cbf] font-medium capitalize shrink-0">
                      {hotel.category}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <p className="text-sm text-[#e85d45] bg-[#e85d45]/10 border border-[#e85d45]/20 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, #e85d45, #d49a12)"
                : "linear-gradient(135deg, #e85d45, #d49a12)",
            }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Creating...
              </>
            ) : (
              "Create Campaign"
            )}
          </button>
        </form>
      </div>
    </div>
    </Portal>
  );
}
