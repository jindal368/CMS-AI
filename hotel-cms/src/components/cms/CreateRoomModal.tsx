"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/ui/Portal";

interface CreateRoomModalProps {
  hotelId: string;
  onClose: () => void;
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
type Currency = (typeof CURRENCIES)[number];

export default function CreateRoomModal({ hotelId, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [maxGuests, setMaxGuests] = useState("2");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amenityRef = useRef<HTMLInputElement>(null);

  const addAmenity = () => {
    const val = amenityInput.trim();
    if (val && !amenities.includes(val)) {
      setAmenities((prev) => [...prev, val]);
    }
    setAmenityInput("");
  };

  const removeAmenity = (item: string) => {
    setAmenities((prev) => prev.filter((a) => a !== item));
  };

  const handleAmenityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAmenity();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Room name is required.");
      return;
    }
    if (!basePrice || isNaN(Number(basePrice))) {
      setError("A valid base price is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          name: name.trim(),
          description: description.trim() || undefined,
          pricing: { basePrice: Number(basePrice), currency },
          amenities,
          maxGuests: Number(maxGuests),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create room");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#ffffff] border border-[#e2dfe8] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2dfe8] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">Add Room</h2>
            <p className="text-xs text-[#7c7893] mt-0.5">Create a new room for this hotel</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">
              Room Name <span className="text-[#e85d45]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Deluxe Ocean Suite"
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] placeholder-[#7c7893] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the room…"
              rows={3}
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] placeholder-[#7c7893] rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none"
            />
          </div>

          {/* Pricing row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5a5670]">
                Base Price <span className="text-[#e85d45]">*</span>
              </label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                min={0}
                placeholder="5000"
                className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] placeholder-[#7c7893] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5a5670]">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Guests */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">Max Guests</label>
            <input
              type="number"
              value={maxGuests}
              onChange={(e) => setMaxGuests(e.target.value)}
              min={1}
              max={20}
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            />
          </div>

          {/* Amenities */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">Amenities</label>
            <div className="bg-[#f0eef5] border border-[#e2dfe8] focus-within:border-[#7c5cbf] rounded-lg px-3 py-2 transition-colors">
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#7c5cbf]/10 text-[#7c5cbf] border border-[#7c5cbf]/20"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => removeAmenity(a)}
                        className="hover:text-[#e85d45] transition-colors"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                ref={amenityRef}
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={handleAmenityKeyDown}
                placeholder="Type amenity and press Enter…"
                className="w-full bg-transparent text-[#1a1a2e] placeholder-[#7c7893] text-sm outline-none"
              />
            </div>
            <p className="text-xs text-[#7c7893]">Press Enter to add each amenity</p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-[#e85d45]/10 border border-[#e85d45]/20 text-xs text-[#e85d45]">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0fa886]/10 hover:bg-[#0fa886]/20 text-[#0fa886] border border-[#0fa886]/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                "Create Room"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
