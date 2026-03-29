"use client";

import { useState, useEffect, useCallback } from "react";

interface VersionEntry {
  id: string;
  versionNum: number;
  modelTier: number;
  modelUsed: string;
  description: string;
  status: string;
  createdAt: string;
}

interface VersionTimelineProps {
  hotelId: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  published: {
    label: "Published",
    color: "text-[#0fa886]",
    bg: "bg-[#0fa886]/10",
    border: "border-[#0fa886]/30",
    dot: "bg-[#0fa886]",
  },
  draft: {
    label: "Draft",
    color: "text-[#7c5cbf]",
    bg: "bg-[#7c5cbf]/10",
    border: "border-[#7c5cbf]/30",
    dot: "bg-[#7c5cbf]",
  },
  rejected: {
    label: "Rejected",
    color: "text-[#e85d45]",
    bg: "bg-[#e85d45]/10",
    border: "border-[#e85d45]/30",
    dot: "bg-[#e85d45]",
  },
  rolled_back: {
    label: "Rolled Back",
    color: "text-[#d49a12]",
    bg: "bg-[#d49a12]/10",
    border: "border-[#d49a12]/30",
    dot: "bg-[#d49a12]",
  },
};

const tierColors: Record<number, string> = {
  0: "text-[#0fa886] bg-[#0fa886]/10 border-[#0fa886]/20",
  1: "text-[#3b7dd8] bg-[#3b7dd8]/10 border-[#3b7dd8]/20",
  2: "text-[#7c5cbf] bg-[#7c5cbf]/10 border-[#7c5cbf]/20",
  3: "text-[#d49a12] bg-[#d49a12]/10 border-[#d49a12]/20",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function VersionTimeline({ hotelId }: VersionTimelineProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/versions?hotelId=${hotelId}`);
      if (!res.ok) throw new Error("Failed to fetch versions");
      const data = await res.json();
      setVersions((data.data ?? []).slice().reverse()); // newest first
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load versions");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleAction = async (versionId: string, action: "publish" | "reject" | "rollback") => {
    setActionLoading(`${versionId}-${action}`);
    try {
      const res = await fetch(`/api/versions/${versionId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      await fetchVersions();
    } catch {
      // Silently handle — refresh anyway
      await fetchVersions();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-card px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            Version History
          </span>
          {!loading && (
            <span className="text-xs text-[#9994ad] bg-elevated px-2 py-0.5 rounded-full">
              {versions.length} versions
            </span>
          )}
        </div>
        <button
          onClick={fetchVersions}
          disabled={loading}
          className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors disabled:opacity-50"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          >
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 w-48 bg-elevated rounded-xl animate-pulse shrink-0" />
          ))}
        </div>
      ) : error ? (
        <div className="px-3 py-2 rounded-lg bg-[#e85d45]/10 border border-[#e85d45]/20 text-xs text-[#e85d45]">
          {error}
        </div>
      ) : versions.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <div className="px-4 py-3 rounded-xl bg-elevated border border-border">
            <p className="text-xs text-muted">No versions yet</p>
            <p className="text-xs text-[#9994ad] mt-0.5">Use AI actions to generate versions</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 overflow-x-auto pb-1">
          {versions.map((version, idx) => {
            const status = statusConfig[version.status] ?? statusConfig.draft;
            const tierColor = tierColors[version.modelTier] ?? tierColors[0];
            const isFirst = idx === 0;

            return (
              <div
                key={version.id}
                className={`shrink-0 w-56 rounded-xl border p-3 transition-all ${
                  isFirst
                    ? "bg-elevated border-border"
                    : "bg-background border-[#f0eef5]"
                }`}
              >
                {/* Version number + status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span className="text-xs font-bold text-foreground">
                      v{version.versionNum}
                    </span>
                    {isFirst && (
                      <span className="text-xs px-1 py-0.5 rounded bg-[#e85d45]/10 text-[#e85d45] border border-[#e85d45]/20">
                        latest
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${status.color} ${status.bg} ${status.border}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#5a5670] leading-relaxed mb-2 line-clamp-2 min-h-[2rem]">
                  {version.description || "No description"}
                </p>

                {/* Model info */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded border font-mono ${tierColor}`}
                  >
                    T{version.modelTier}
                  </span>
                  <span className="text-xs text-[#9994ad] font-mono truncate max-w-[100px]">
                    {version.modelUsed}
                  </span>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-[#9994ad] mb-3">
                  {formatRelativeTime(version.createdAt)}
                </p>

                {/* Action buttons */}
                <div className="flex gap-1">
                  {version.status === "draft" && (
                    <>
                      <button
                        onClick={() => handleAction(version.id, "publish")}
                        disabled={!!actionLoading}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-[#0fa886]/10 hover:bg-[#0fa886]/20 text-[#0fa886] text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `${version.id}-publish` ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        Publish
                      </button>
                      <button
                        onClick={() => handleAction(version.id, "reject")}
                        disabled={!!actionLoading}
                        className="flex items-center justify-center px-2 py-1 rounded-lg bg-[#e85d45]/10 hover:bg-[#e85d45]/20 text-[#e85d45] text-xs font-medium transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        {actionLoading === `${version.id}-reject` ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                  {(version.status === "published" || version.status === "rejected" || version.status === "rolled_back") && (
                    <button
                      onClick={() => handleAction(version.id, "rollback")}
                      disabled={!!actionLoading}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-[#d49a12]/10 hover:bg-[#d49a12]/20 text-[#d49a12] text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `${version.id}-rollback` ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      Rollback
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
