"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/ui/Portal";

interface RoomPricing {
  basePrice: number;
  currency: string;
}

interface SerializedRoom {
  id: string;
  name: string;
  description: string | null;
  pricing: RoomPricing | null;
  amenities: string[];
  maxGuests: number;
}

interface EditRoomModalProps {
  room: SerializedRoom;
  onClose: () => void;
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
type Currency = (typeof CURRENCIES)[number];

export default function EditRoomModal({ room, onClose }: EditRoomModalProps) {
  const router = useRouter();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [basePrice, setBasePrice] = useState(String(room.pricing?.basePrice ?? ""));
  const [currency, setCurrency] = useState<Currency>((room.pricing?.currency as Currency) ?? "INR");
  const [amenities, setAmenities] = useState<string[]>(room.amenities ?? []);
  const [amenityInput, setAmenityInput] = useState("");
  const [maxGuests, setMaxGuests] = useState(String(room.maxGuests ?? 2));
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          pricing: { basePrice: Number(basePrice), currency },
          amenities,
          maxGuests: Number(maxGuests),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update room");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update room");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete room");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    } finally {
      setDeleting(false);
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
            <h2 className="text-base font-semibold text-[#1a1a2e]">Edit Room</h2>
            <p className="text-xs text-[#7c7893] mt-0.5 truncate max-w-[280px]">{room.name}</p>
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
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] placeholder-[#7c7893] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
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
              disabled={submitting || deleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7c5cbf]/10 hover:bg-[#7c5cbf]/20 text-[#7c5cbf] border border-[#7c5cbf]/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          {/* Danger zone */}
          <div className="border-t border-[#e2dfe8] pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#e85d45]/10 hover:bg-[#e85d45]/20 text-[#e85d45] border border-[#e85d45]/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Deleting…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete Room
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
