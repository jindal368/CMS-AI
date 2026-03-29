"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HotelTabs from "@/components/hotel-tabs";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CompetitorScan {
  id: string;
  changes: unknown[];
  insights: unknown[];
  scannedAt: string;
}

interface Competitor {
  id: string;
  hotelId: string;
  name: string;
  url: string;
  lastScanAt: string | null;
  createdAt: string;
  latestScan: CompetitorScan | null;
}

interface Change {
  type: string;
  detail?: string;
}

interface Insight {
  priority: "high" | "medium" | "low";
  suggestion: string;
}

interface Props {
  hotelId: string;
  competitors: Competitor[];
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

// ─── Change Pills ───────────────────────────────────────────────────────────────

function ChangePill({ change }: { change: Change }) {
  const type = change.type;

  if (type === "title_changed") {
    return (
      <span
        className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: "#d49a1220", color: "#d49a12" }}
      >
        Title Changed
      </span>
    );
  }
  if (type === "description_changed") {
    return (
      <span
        className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: "#d49a1220", color: "#d49a12" }}
      >
        Description Changed
      </span>
    );
  }
  if (type === "section_added") {
    return (
      <span
        className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: "#0fa88620", color: "#0fa886" }}
      >
        Section Added{change.detail ? `: ${change.detail}` : ""}
      </span>
    );
  }
  if (type === "section_removed") {
    return (
      <span
        className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: "#e85d4520", color: "#e85d45" }}
      >
        Section Removed{change.detail ? `: ${change.detail}` : ""}
      </span>
    );
  }
  if (type === "major_content_update") {
    return (
      <span
        className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: "#7c5cbf20", color: "#7c5cbf" }}
      >
        Major Content Update
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: "#7c789320", color: "#7c7893" }}
    >
      {type}
    </span>
  );
}

const PRIORITY_DOT: Record<string, string> = {
  high: "#dc2626",
  medium: "#d49a12",
  low: "#3b7dd8",
};

// ─── Competitor Card ────────────────────────────────────────────────────────────

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const changes = (competitor.latestScan?.changes ?? []) as Change[];
  const insights = (competitor.latestScan?.insights ?? []) as Insight[];

  async function handleScan() {
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch(`/api/competitors/${competitor.id}/scan`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScanError(data.error ?? "Scan failed");
      } else {
        router.refresh();
      }
    } catch {
      setScanError("Network error");
    } finally {
      setScanning(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete competitor "${competitor.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/competitors/${competitor.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1a1a2e] truncate">{competitor.name}</p>
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#7c7893] hover:text-[#1a1a2e] transition-colors truncate block"
          >
            {competitor.url}
          </a>
          {competitor.latestScan ? (
            <p className="text-[11px] text-[#7c7893] mt-0.5">
              Last scanned {relativeTime(competitor.latestScan.scannedAt)}
            </p>
          ) : (
            <p className="text-[11px] text-[#7c7893] mt-0.5">Not scanned yet</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60"
            style={{
              borderColor: "#7c5cbf",
              color: "#7c5cbf",
              background: "transparent",
            }}
          >
            {scanning ? (
              <>
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
                Scanning…
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Scan
              </>
            )}
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-[#e85d4510]"
            style={{ borderColor: "#e85d4540", color: "#e85d45" }}
            title="Delete competitor"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {scanError && (
        <p className="text-xs text-[#e85d45]">{scanError}</p>
      )}

      {/* Changes */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c7893] mb-2">
          Changes
        </p>
        {!competitor.latestScan ? (
          <p className="text-xs text-[#7c7893] italic">Not scanned yet</p>
        ) : changes.length === 0 ? (
          <span
            className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "#7c789320", color: "#7c7893" }}
          >
            No Changes
          </span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {changes.map((change, idx) => (
              <ChangePill key={idx} change={change} />
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c7893] mb-2">
            Insights
          </p>
          <div className="space-y-1.5">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-white/40 rounded-lg px-3 py-2"
              >
                <span
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                  style={{ background: PRIORITY_DOT[insight.priority] ?? "#7c7893" }}
                />
                <p className="text-xs text-[#1a1a2e] leading-relaxed">{insight.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function CompetitorsManager({ hotelId, competitors, hotelName }: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [scanAllLoading, setScanAllLoading] = useState(false);
  const [scanAllResult, setScanAllResult] = useState<string | null>(null);
  const [scanAllError, setScanAllError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, name: addName, url: addUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add competitor");
      } else {
        setAddName("");
        setAddUrl("");
        setShowAddForm(false);
        router.refresh();
      }
    } catch {
      setAddError("Network error");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleScanAll() {
    setScanAllLoading(true);
    setScanAllResult(null);
    setScanAllError(null);
    try {
      const res = await fetch(`/api/competitors/scan-all/${hotelId}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setScanAllError(data.error ?? "Scan failed");
      } else {
        const scanned = data.data?.scanned ?? 0;
        const withChanges = data.data?.withChanges ?? 0;
        setScanAllResult(`Scanned ${scanned} competitor${scanned === 1 ? "" : "s"}. ${withChanges} had changes.`);
        router.refresh();
      }
    } catch {
      setScanAllError("Network error");
    } finally {
      setScanAllLoading(false);
    }
  }

  return (
    <div className="bg-[#ffffff] border border-[#e2dfe8] rounded-xl overflow-hidden">
      <div className="px-5 pt-4">
        <HotelTabs hotelId={hotelId} />
      </div>

      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1a1a2e]">Competitive Intelligence</h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums"
              style={{ background: "#7c5cbf18", color: "#7c5cbf" }}
            >
              {competitors.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanAll}
              disabled={scanAllLoading || competitors.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity disabled:opacity-50"
              style={{ background: "#7c5cbf" }}
            >
              {scanAllLoading ? (
                <>
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
                  Scanning…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Scan All
                </>
              )}
            </button>

            <button
              onClick={() => {
                setShowAddForm((v) => !v);
                setAddError(null);
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
                  Add Competitor
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scan All feedback */}
        {scanAllResult && (
          <div
            className="text-xs font-medium px-3 py-2 rounded-lg"
            style={{ background: "#0fa88618", color: "#0fa886" }}
          >
            {scanAllResult}
          </div>
        )}
        {scanAllError && (
          <div
            className="text-xs font-medium px-3 py-2 rounded-lg"
            style={{ background: "#e85d4518", color: "#e85d45" }}
          >
            {scanAllError}
          </div>
        )}

        {/* Add Competitor Form */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="glass-card-static rounded-xl p-5 space-y-4"
          >
            <p className="text-sm font-semibold text-[#1a1a2e]">Add Competitor</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#7c7893]">Name</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Competitor name"
                  required
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#e2dfe8] bg-white/80 text-[#1a1a2e] placeholder:text-[#7c7893] focus:outline-none focus:ring-2 focus:ring-[#e85d45]/30 focus:border-[#e85d45] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#7c7893]">URL</label>
                <input
                  type="url"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  placeholder="https://competitor.com"
                  required
                  className="w-full text-sm px-3 py-2 rounded-lg border border-[#e2dfe8] bg-white/80 text-[#1a1a2e] placeholder:text-[#7c7893] focus:outline-none focus:ring-2 focus:ring-[#e85d45]/30 focus:border-[#e85d45] transition-colors"
                />
              </div>
            </div>

            {addError && (
              <p className="text-xs text-[#e85d45]">{addError}</p>
            )}

            <button
              type="submit"
              disabled={addLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-opacity disabled:opacity-60"
              style={{ background: "#e85d45" }}
            >
              {addLoading ? (
                <>
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
                  Adding…
                </>
              ) : (
                "Add"
              )}
            </button>
          </form>
        )}

        {/* Empty state */}
        {competitors.length === 0 && !showAddForm ? (
          <div className="glass-card-static rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#7c5cbf18" }}
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
                style={{ color: "#7c5cbf" }}
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1a1a2e]">No competitors yet</p>
            <p className="text-xs text-[#7c7893] max-w-xs">
              Add competitors to monitor what they&apos;re doing. You can track up to 5 competitor websites per hotel.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {competitors.map((competitor) => (
              <CompetitorCard key={competitor.id} competitor={competitor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
