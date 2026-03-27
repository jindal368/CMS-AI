"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateHotelModal from "./CreateHotelModal";

interface HotelActionsProps {
  /** Optional list of hotel IDs that can be deleted via the trash icon */
  hotelIds?: string[];
  onDelete?: (hotelId: string) => void;
}

export default function HotelActions({ hotelIds: _hotelIds, onDelete: _onDelete }: HotelActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors shadow-lg shadow-[#e85d45]/20"
        style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Create Hotel
      </button>

      <CreateHotelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

// ─── Delete button sub-component ─────────────────────────────────────────────

interface HotelDeleteButtonProps {
  hotelId: string;
  onDelete?: (hotelId: string) => void;
}

export function HotelDeleteButton({ hotelId, onDelete }: HotelDeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      // Auto-reset confirm state after 3 s if user doesn't act
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onDelete?.(hotelId);
      router.refresh();
    } catch (err) {
      console.error("[HotelDeleteButton]", err);
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete();
      }}
      disabled={loading}
      title={confirming ? "Click again to confirm deletion" : "Delete hotel"}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        confirming
          ? "bg-[#e85d45]/20 text-[#e85d45] hover:bg-[#e85d45]/30"
          : "text-[#7c7893] hover:text-[#e85d45] hover:bg-[#e85d45]/10"
      }`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
