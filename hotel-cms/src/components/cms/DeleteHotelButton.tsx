"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  hotelId: string;
  hotelName: string;
};

export default function DeleteHotelButton({ hotelId, hotelName }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirm" | "deleting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (stage === "idle") {
      setStage("confirm");
      return;
    }

    if (stage === "confirm") {
      setStage("deleting");
      setError(null);

      try {
        const res = await fetch(`/api/hotels/${hotelId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("[DeleteHotelButton] DELETE failed", body);
          setError("Failed to delete hotel. Please try again.");
          setStage("confirm");
          return;
        }

        router.push("/hotels");
      } catch (err) {
        console.error("[DeleteHotelButton] delete error", err);
        setError("Unexpected error. Please try again.");
        setStage("confirm");
      }
    }
  }

  function handleCancel() {
    setStage("idle");
    setError(null);
  }

  if (stage === "idle") {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e85d45]/10 hover:bg-[#e85d45]/20 border border-[#e85d45]/20 text-[#e85d45] text-xs font-medium transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={handleCancel}
          disabled={stage === "deleting"}
          className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-border border border-border text-muted hover:text-foreground text-xs font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleClick}
          disabled={stage === "deleting"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e85d45] hover:bg-[#e85d45]/90 text-white text-xs font-medium transition-colors disabled:opacity-60"
        >
          {stage === "deleting" ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Deleting…
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Delete &ldquo;{hotelName}&rdquo;?
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-[#e85d45]">{error}</p>
      )}
    </div>
  );
}
