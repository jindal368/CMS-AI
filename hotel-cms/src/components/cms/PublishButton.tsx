"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";

interface PublishButtonProps {
  hotelId: string;
  publishedAt: string | null; // ISO string or null
  hotelSlug: string | null;
  orgSlug: string;
}

export default function PublishButton({
  hotelId,
  publishedAt,
  hotelSlug,
  orgSlug,
}: PublishButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isPublished = publishedAt !== null;

  async function handleToggle() {
    setLoading(true);
    try {
      const endpoint = isPublished
        ? `/api/hotels/${hotelId}/unpublish`
        : `/api/hotels/${hotelId}/publish`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        router.refresh();
        toast(
          isPublished ? "Hotel unpublished" : "Hotel published successfully!",
          isPublished ? "info" : "success"
        );
      } else {
        toast("Failed to update publish status", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status badge */}
      {isPublished ? (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: "#0fa88620", color: "#0fa886", transition: "background-color 500ms ease, color 500ms ease" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#0fa886" }}
          />
          Live
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: "#7c789320", color: "var(--muted)", transition: "background-color 500ms ease, color 500ms ease" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#7c7893" }}
          />
          Draft
        </span>
      )}

      {/* Action button */}
      {isPublished ? (
        <button
          onClick={handleToggle}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-opacity disabled:opacity-50"
          style={{
            borderColor: "rgba(124,120,147,0.35)",
            color: "var(--muted)",
            background: "transparent",
          }}
        >
          {loading && (
            <svg
              className="animate-spin w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="60"
                strokeDashoffset="20"
              />
            </svg>
          )}
          Unpublish
        </button>
      ) : (
        <button
          onClick={handleToggle}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-50 text-white"
          style={{ background: "#0fa886" }}
        >
          {loading && (
            <svg
              className="animate-spin w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="60"
                strokeDashoffset="20"
              />
            </svg>
          )}
          Publish
        </button>
      )}

      {/* View Live link */}
      {isPublished && hotelSlug && (
        <a
          href={`/site/${orgSlug}/${hotelSlug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70 animate-fade"
          style={{ color: "#0fa886" }}
        >
          View Live
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      )}
    </div>
  );
}
