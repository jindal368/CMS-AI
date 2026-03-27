"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SerializedVersion {
  id: string;
  versionNum: number;
  modelTier: number;
  modelUsed: string;
  description: string;
  status: string;
  createdAt: string;
}

interface VersionActionsProps {
  hotelId: string;
  versions: SerializedVersion[];
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  draft: {
    label: "Draft",
    color: "text-[#7c5cbf]",
    bg: "bg-[#7c5cbf]/10",
    border: "border-[#7c5cbf]/30",
    dot: "bg-[#7c5cbf]",
  },
  published: {
    label: "Published",
    color: "text-[#0fa886]",
    bg: "bg-[#0fa886]/10",
    border: "border-[#0fa886]/30",
    dot: "bg-[#0fa886]",
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
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Action = "publish" | "reject" | "rollback";

interface ConfirmDialog {
  versionId: string;
  versionNum: number;
  action: Action;
}

function SpinnerIcon() {
  return (
    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function VersionActions({ hotelId: _hotelId, versions }: VersionActionsProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (versionId: string, action: Action) => {
    setActionLoading(`${versionId}-${action}`);
    setError(null);
    try {
      const res = await fetch(`/api/versions/${versionId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to ${action}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const requestConfirm = (versionId: string, versionNum: number, action: Action) => {
    setConfirm({ versionId, versionNum, action });
  };

  const confirmAction = async () => {
    if (!confirm) return;
    const { versionId, action } = confirm;
    setConfirm(null);
    await handleAction(versionId, action);
  };

  const actionLabel: Record<Action, string> = {
    publish: "Publish",
    reject: "Reject",
    rollback: "Rollback to this",
  };

  const actionDescription: Record<Action, (vNum: number) => string> = {
    publish: (v) => `Publish v${v}? This will make it the live version.`,
    reject: (v) => `Reject v${v}? This marks it as rejected and cannot be undone.`,
    rollback: (v) => `Rollback to v${v}? The current published version will be replaced.`,
  };

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-[#f0eef5] flex items-center justify-center mb-3">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#7c7893]">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-sm text-[#7c7893]">No versions yet</p>
        <p className="text-xs text-[#7c7893]/60 mt-1">
          Version history will appear here when changes are made
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-[#ffffff] border border-[#e2dfe8] rounded-xl p-5 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-[#1a1a2e] mb-2">
              {actionLabel[confirm.action]} v{confirm.versionNum}
            </h3>
            <p className="text-xs text-[#7c7893] mb-5">
              {actionDescription[confirm.action](confirm.versionNum)}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  confirm.action === "publish"
                    ? "bg-[#0fa886]/15 hover:bg-[#0fa886]/25 text-[#0fa886]"
                    : confirm.action === "reject"
                    ? "bg-[#e85d45]/15 hover:bg-[#e85d45]/25 text-[#e85d45]"
                    : "bg-[#d49a12]/15 hover:bg-[#d49a12]/25 text-[#d49a12]"
                }`}
              >
                {actionLabel[confirm.action]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#e85d45]/10 border border-[#e85d45]/20 flex items-center justify-between">
          <span className="text-xs text-[#e85d45]">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 text-[#e85d45]/60 hover:text-[#e85d45] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[#e2dfe8]" />

        <div className="space-y-3">
          {versions.map((version, idx) => {
            const status = statusConfig[version.status] ?? statusConfig.draft;
            const tierColor = tierColors[version.modelTier] ?? tierColors[0];
            const isLatest = idx === 0;
            const isPublishing = actionLoading === `${version.id}-publish`;
            const isRejecting = actionLoading === `${version.id}-reject`;
            const isRollingBack = actionLoading === `${version.id}-rollback`;
            const isAnyLoading = isPublishing || isRejecting || isRollingBack;

            return (
              <div key={version.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 mt-3.5">
                  <div
                    className={`w-[10px] h-[10px] rounded-full border-2 border-[#f8f7fa] ${status.dot}`}
                  />
                </div>

                {/* Card */}
                <div
                  className={`flex-1 rounded-xl border p-4 transition-colors ${
                    isLatest
                      ? "bg-[#f0eef5] border-[#e2dfe8]"
                      : "bg-[#ffffff] border-[#e2dfe8]/60"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1a1a2e] font-mono">
                        v{version.versionNum}
                      </span>
                      {isLatest && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#e85d45]/10 text-[#e85d45] border border-[#e85d45]/20 font-medium">
                          latest
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${status.color} ${status.bg} ${status.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    {/* Tier + model */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border font-mono font-semibold ${tierColor}`}
                      >
                        T{version.modelTier}
                      </span>
                      {version.modelUsed && version.modelUsed !== "none" && (
                        <span className="text-xs text-[#7c7893] font-mono truncate max-w-[120px]">
                          {version.modelUsed}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {version.description && (
                    <p className="text-xs text-[#5a5670] leading-relaxed mb-3">
                      {version.description}
                    </p>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#7c7893]">
                      {formatRelativeTime(version.createdAt)}
                    </span>

                    {/* Action buttons */}
                    <div className="flex gap-1.5">
                      {version.status === "draft" && (
                        <>
                          <button
                            onClick={() =>
                              requestConfirm(version.id, version.versionNum, "publish")
                            }
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0fa886]/10 hover:bg-[#0fa886]/20 text-[#0fa886] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPublishing ? <SpinnerIcon /> : (
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            Publish
                          </button>
                          <button
                            onClick={() =>
                              requestConfirm(version.id, version.versionNum, "reject")
                            }
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e85d45]/10 hover:bg-[#e85d45]/20 text-[#e85d45] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRejecting ? <SpinnerIcon /> : (
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            Reject
                          </button>
                        </>
                      )}

                      {version.status === "published" && (
                        <button
                          onClick={() =>
                            requestConfirm(version.id, version.versionNum, "rollback")
                          }
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d49a12]/10 hover:bg-[#d49a12]/20 text-[#d49a12] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRollingBack ? <SpinnerIcon /> : (
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path
                                fillRule="evenodd"
                                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          Rollback to this
                        </button>
                      )}

                      {/* Suppress unused variable warning — isAnyLoading used for per-card opacity if needed */}
                      {isAnyLoading && null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
