"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HotelTabs from "@/components/hotel-tabs";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  hotelId: string;
  guestName: string;
  reviewText: string;
  rating: number;
  source: string;
  reviewDate: string | null;
  sentiment: string;
  aiResponse: string | null;
  finalResponse: string | null;
  status: string;
  respondedAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  avgRating: number;
  responseRate: number;
  pending: number;
}

interface Props {
  hotelId: string;
  reviews: Review[];
  stats: Stats;
  hotelName: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hour${diffH === 1 ? "" : "s"} ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} day${diffD === 1 ? "" : "s"} ago`;
}

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "xs";
}) {
  const sizeCls = size === "xs" ? "text-xs" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeCls}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= rating ? "#e85d45" : "#d1cfe8" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function SentimentBadge({ sentiment, tiny = false }: { sentiment: string; tiny?: boolean }) {
  const cls = tiny
    ? "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
    : "inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full";

  if (sentiment === "positive") {
    return (
      <span className={cls} style={{ background: "#0fa88620", color: "#0fa886" }}>
        Positive
      </span>
    );
  }
  if (sentiment === "negative") {
    return (
      <span className={cls} style={{ background: "#e85d4520", color: "#e85d45" }}>
        Negative
      </span>
    );
  }
  return (
    <span className={cls} style={{ background: "#d49a1220", color: "#d49a12" }}>
      Neutral
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "responded") {
    return (
      <span
        className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: "#0fa88620", color: "#0fa886" }}
      >
        Responded
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span
        className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: "#7c789320", color: "#7c7893" }}
      >
        Skipped
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "#7c5cbf20", color: "#7c5cbf" }}
    >
      Pending
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, string> = {
    google: "Google",
    tripadvisor: "TripAdvisor",
    "booking.com": "Booking.com",
    expedia: "Expedia",
    other: "Other",
  };
  return (
    <span
      className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: "#7c5cbf15", color: "#7c5cbf" }}
    >
      {labels[source] ?? source}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="w-3 h-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ─── Response Panel ─────────────────────────────────────────────────────────────

interface ResponsePanelProps {
  reviewId: string;
  sentiment: string;
  initialResponse: string;
  onClose: () => void;
  onDone: () => void;
}

function ResponsePanel({
  reviewId,
  sentiment,
  initialResponse,
  onClose,
  onDone,
}: ResponsePanelProps) {
  const router = useRouter();
  const [responseText, setResponseText] = useState(initialResponse);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/regenerate`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Regeneration failed");
      } else {
        setResponseText(data.data?.aiResponse ?? responseText);
      }
    } catch {
      setError("Network error");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(responseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent
    }
  }

  async function handleMarkResponded() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "responded", finalResponse: responseText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update");
      } else {
        router.refresh();
        onDone();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "skipped" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update");
      } else {
        router.refresh();
        onDone();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card-static rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#1a1a2e]">AI Response</p>
          <SentimentBadge sentiment={sentiment} />
        </div>
        <button
          onClick={onClose}
          className="text-xs text-[#7c7893] hover:text-[#1a1a2e] transition-colors"
        >
          ✕
        </button>
      </div>

      <textarea
        rows={5}
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg border border-[#e2dfe8] bg-white/80 text-[#1a1a2e] placeholder:text-[#7c7893] focus:outline-none focus:ring-2 focus:ring-[#7c5cbf]/30 focus:border-[#7c5cbf] transition-colors resize-none"
      />

      {error && <p className="text-xs text-[#e85d45]">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleRegenerate}
          disabled={regenerating || saving}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60"
          style={{ borderColor: "#7c5cbf", color: "#7c5cbf" }}
        >
          {regenerating ? (
            <>
              <Spinner />
              Regenerating…
            </>
          ) : (
            "Regenerate"
          )}
        </button>

        <button
          onClick={handleCopy}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60"
          style={{ borderColor: "#3b7dd8", color: "#3b7dd8" }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>

        <button
          onClick={handleMarkResponded}
          disabled={saving || regenerating}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity disabled:opacity-60"
          style={{ background: "#0fa886" }}
        >
          {saving ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            "Mark Responded"
          )}
        </button>

        <button
          onClick={handleSkip}
          disabled={saving || regenerating}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60"
          style={{ borderColor: "#7c7893", color: "#7c7893" }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ─── Review Card ────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingResponse, setEditingResponse] = useState(false);

  async function handleCopyResponse() {
    const text = review.finalResponse ?? review.aiResponse ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }

  const truncated =
    review.reviewText.length > 100
      ? review.reviewText.slice(0, 100) + "…"
      : review.reviewText;

  return (
    <div className="glass-card rounded-xl p-4 space-y-2">
      {/* Top row */}
      <div
        className="flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-semibold text-[#1a1a2e]">
              {review.guestName}
            </span>
            <StarRow rating={review.rating} size="xs" />
            <SourceBadge source={review.source} />
            <span className="text-[11px] text-[#7c7893]">
              {relativeTime(review.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SentimentBadge sentiment={review.sentiment} tiny />
            <StatusBadge status={review.status} />
          </div>
        </div>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-[#7c7893] shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Review text preview */}
      {!expanded && (
        <p className="text-xs text-[#7c7893] leading-relaxed">{truncated}</p>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="space-y-3 pt-1">
          <p className="text-sm text-[#1a1a2e] leading-relaxed">
            {review.reviewText}
          </p>

          {review.aiResponse && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c7893]">
                AI Response
              </p>
              <p className="text-xs text-[#1a1a2e] leading-relaxed bg-white/60 rounded-lg px-3 py-2">
                {review.aiResponse}
              </p>
            </div>
          )}

          {review.finalResponse && review.finalResponse !== review.aiResponse && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c7893]">
                Final Response
              </p>
              <p className="text-xs text-[#1a1a2e] leading-relaxed bg-white/60 rounded-lg px-3 py-2">
                {review.finalResponse}
              </p>
            </div>
          )}

          {review.respondedAt && (
            <p className="text-[11px] text-[#7c7893]">
              Responded {relativeTime(review.respondedAt)}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(review.status === "responded" || review.status === "skipped") &&
              (review.finalResponse || review.aiResponse) && (
                <button
                  onClick={handleCopyResponse}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: "#3b7dd8", color: "#3b7dd8" }}
                >
                  {copied ? "Copied!" : "Copy Response"}
                </button>
              )}

            {review.status === "pending" && review.aiResponse && !editingResponse && (
              <button
                onClick={() => setEditingResponse(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: "#7c5cbf", color: "#7c5cbf" }}
              >
                Edit &amp; Send
              </button>
            )}
          </div>

          {editingResponse && review.aiResponse && (
            <ResponsePanel
              reviewId={review.id}
              sentiment={review.sentiment}
              initialResponse={review.aiResponse}
              onClose={() => setEditingResponse(false)}
              onDone={() => {
                setEditingResponse(false);
                setExpanded(false);
                router.refresh();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Review Form ────────────────────────────────────────────────────────────

interface AddReviewFormProps {
  hotelId: string;
  onSuccess: (review: Review) => void;
  onCancel: () => void;
}

function AddReviewForm({ hotelId, onSuccess, onCancel }: AddReviewFormProps) {
  const [guestName, setGuestName] = useState("");
  const [rating, setRating] = useState(0);
  const [source, setSource] = useState("google");
  const [reviewDate, setReviewDate] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    guestName.trim().length > 0 && reviewText.trim().length > 0 && rating > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          guestName: guestName.trim(),
          reviewText: reviewText.trim(),
          rating,
          source,
          reviewDate: reviewDate || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create review");
      } else {
        const r = data.data ?? data;
        // Normalize dates
        onSuccess({
          ...r,
          reviewDate: r.reviewDate ?? null,
          respondedAt: r.respondedAt ?? null,
          createdAt: r.createdAt ?? new Date().toISOString(),
        });
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card-static rounded-xl p-5 space-y-4"
    >
      <p className="text-sm font-semibold text-[#1a1a2e]">Add Review</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Guest name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#7c7893]">
            Guest Name
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="e.g. John Smith"
            required
            className="w-full text-sm px-3 py-2 rounded-lg border border-[#e2dfe8] bg-white/80 text-[#1a1a2e] placeholder:text-[#7c7893] focus:outline-none focus:ring-2 focus:ring-[#e85d45]/30 focus:border-[#e85d45] transition-colors"
          />
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#7c7893]">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg border border-[#e2dfe8] bg-white/80 text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#e85d45]/30 focus:border-[#e85d45] transition-colors"
          >
            <option value="google">Google</option>
            <option value="tripadvisor">TripAdvisor</option>
            <option value="booking.com">Booking.com</option>
            <option value="expedia">Expedia</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Star rating */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#7c7893]">Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="text-2xl leading-none transition-colors focus:outline-none"
              style={{ color: n <= rating ? "#e85d45" : "#d1cfe8" }}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-xs text-[#7c7893]">{rating} / 5</span>
          )}
        </div>
      </div>

      {/* Review date */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#7c7893]">
          Review Date{" "}
          <span className="text-[#7c7893] font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={reviewDate}
          onChange={(e) => setReviewDate(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border border-[#e2dfe8] bg-white/80 text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#e85d45]/30 focus:border-[#e85d45] transition-colors"
        />
      </div>

      {/* Review text */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#7c7893]">
          Review Text
        </label>
        <textarea
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Guest's review…"
          required
          className="w-full text-sm px-3 py-2 rounded-lg border border-[#e2dfe8] bg-white/80 text-[#1a1a2e] placeholder:text-[#7c7893] focus:outline-none focus:ring-2 focus:ring-[#e85d45]/30 focus:border-[#e85d45] transition-colors resize-none"
        />
      </div>

      {error && <p className="text-xs text-[#e85d45]">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-opacity disabled:opacity-50"
          style={{
            background: canSubmit
              ? "linear-gradient(135deg, #e85d45 0%, #c94a34 100%)"
              : "#e85d4580",
          }}
        >
          {loading ? (
            <>
              <Spinner />
              Generating response…
            </>
          ) : (
            "Generate Response"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium px-3 py-2 rounded-lg border transition-colors"
          style={{ borderColor: "#e2dfe8", color: "#7c7893" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: Stats }) {
  const responseRateColor =
    stats.responseRate >= 80
      ? "#0fa886"
      : stats.responseRate >= 50
        ? "#d49a12"
        : "#e85d45";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total */}
      <div className="glass-card-static rounded-xl px-4 py-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c7893]">
          Total Reviews
        </p>
        <p className="text-2xl font-bold text-[#1a1a2e] tabular-nums">
          {stats.total}
        </p>
      </div>

      {/* Avg Rating */}
      <div className="glass-card-static rounded-xl px-4 py-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c7893]">
          Avg Rating
        </p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-[#1a1a2e] tabular-nums">
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
          </p>
          {stats.avgRating > 0 && (
            <span className="flex items-center gap-0.5 text-sm">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    color:
                      n <= Math.round(stats.avgRating) ? "#e85d45" : "#d1cfe8",
                  }}
                >
                  ★
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Response Rate */}
      <div className="glass-card-static rounded-xl px-4 py-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c7893]">
          Response Rate
        </p>
        <p
          className="text-2xl font-bold tabular-nums"
          style={{ color: responseRateColor }}
        >
          {stats.total > 0 ? `${stats.responseRate}%` : "—"}
        </p>
      </div>

      {/* Pending */}
      <div className="glass-card-static rounded-xl px-4 py-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c7893]">
          Pending
        </p>
        <p
          className="text-2xl font-bold tabular-nums"
          style={{ color: stats.pending > 0 ? "#e85d45" : "#0fa886" }}
        >
          {stats.pending}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

type FilterTab = "all" | "pending" | "responded" | "skipped";

export default function ReviewsManager({
  hotelId,
  reviews: initialReviews,
  stats,
  hotelName,
}: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingNewReview, setPendingNewReview] = useState<Review | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const respondedCount = reviews.filter((r) => r.status === "responded").length;
  const skippedCount = reviews.filter((r) => r.status === "skipped").length;

  const filteredReviews =
    activeFilter === "all"
      ? reviews
      : reviews.filter((r) => r.status === activeFilter);

  function handleAddSuccess(newReview: Review) {
    setReviews((prev) => [newReview, ...prev]);
    setShowAddForm(false);
    setPendingNewReview(newReview);
    router.refresh();
  }

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "responded", label: "Responded" },
    { key: "skipped", label: "Skipped" },
  ];

  return (
    <div className="bg-[#ffffff] border border-[#e2dfe8] rounded-xl overflow-hidden">
      <div className="px-5 pt-4">
        <HotelTabs hotelId={hotelId} />
      </div>

      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1a1a2e]">
              Reviews Workbench
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums"
              style={{ background: "#e85d4518", color: "#e85d45" }}
            >
              {reviews.length}
            </span>
          </div>

          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              setPendingNewReview(null);
            }}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: "#e85d45",
              color: showAddForm ? "#fff" : "#e85d45",
              background: showAddForm ? "#e85d45" : "transparent",
            }}
          >
            {showAddForm ? (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Review
              </>
            )}
          </button>
        </div>

        {/* Stats bar */}
        <StatsBar stats={stats} />

        {/* Add Review Form */}
        {showAddForm && (
          <AddReviewForm
            hotelId={hotelId}
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Response panel for newly created review */}
        {pendingNewReview && pendingNewReview.aiResponse && (
          <div className="space-y-2">
            <div className="glass-card-static rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#1a1a2e]">
                  {pendingNewReview.guestName}
                </span>
                <StarRow rating={pendingNewReview.rating} size="xs" />
                <SentimentBadge sentiment={pendingNewReview.sentiment} tiny />
              </div>
              <p className="text-xs text-[#7c7893]">{pendingNewReview.reviewText}</p>
            </div>
            <ResponsePanel
              reviewId={pendingNewReview.id}
              sentiment={pendingNewReview.sentiment}
              initialResponse={pendingNewReview.aiResponse}
              onClose={() => setPendingNewReview(null)}
              onDone={() => {
                setPendingNewReview(null);
                router.refresh();
              }}
            />
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1 border-b border-[#e2dfe8]">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-[#e85d45] text-[#e85d45]"
                    : "border-transparent text-[#7c7893] hover:text-[#1a1a2e]"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{
                      background: isActive ? "#e85d4520" : "#7c789320",
                      color: isActive ? "#e85d45" : "#7c7893",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reviews list */}
        {filteredReviews.length === 0 ? (
          <div className="glass-card-static rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#e85d4518" }}
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
                style={{ color: "#e85d45" }}
              >
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1a1a2e]">
              {activeFilter === "all"
                ? "No reviews yet"
                : `No ${activeFilter} reviews`}
            </p>
            {activeFilter === "all" && (
              <p className="text-xs text-[#7c7893] max-w-xs">
                Add reviews to generate AI-powered responses and track guest
                satisfaction for {hotelName}.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
