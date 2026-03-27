"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MediaUpload from "./MediaUpload";

export interface SerializedMediaAsset {
  id: string;
  url: string;
  altText: string | null;
  tags: string[];
  variants: Record<string, string>;
  fileSize: number;
}

interface MediaActionsProps {
  hotelId: string;
  media: SerializedMediaAsset[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MediaCardProps {
  asset: SerializedMediaAsset;
  onDelete: (id: string) => Promise<void>;
  onAltTextSave: (id: string, altText: string) => Promise<void>;
}

function MediaCard({ asset, onDelete, onAltTextSave }: MediaCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [editingAlt, setEditingAlt] = useState(false);
  const [altDraft, setAltDraft] = useState(asset.altText ?? "");
  const [savingAlt, setSavingAlt] = useState(false);

  const thumbUrl = asset.variants.thumbnail ?? asset.url;
  const tags = asset.tags;

  const handleDeleteClick = async () => {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await onDelete(asset.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleAltBlur = async () => {
    setEditingAlt(false);
    const trimmed = altDraft.trim();
    if (trimmed === (asset.altText ?? "")) return;
    setSavingAlt(true);
    try {
      await onAltTextSave(asset.id, trimmed);
    } finally {
      setSavingAlt(false);
    }
  };

  const handleAltKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setAltDraft(asset.altText ?? "");
      setEditingAlt(false);
    }
  };

  return (
    <div className="group relative bg-[#f0eef5] border border-[#e2dfe8] rounded-xl overflow-hidden hover:border-[#d4d0de] transition-colors">
      {/* Thumbnail */}
      <div className="aspect-square relative bg-[#e2dfe8] flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt={asset.altText || "Media asset"}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {/* Delete button */}
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            className="p-1.5 rounded-lg bg-[#e85d45]/80 text-white hover:bg-[#e85d45] transition-colors disabled:opacity-50"
            title="Delete image"
          >
            {deleting ? (
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
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        {/* Alt text — click to edit */}
        {editingAlt ? (
          <input
            autoFocus
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            onBlur={handleAltBlur}
            onKeyDown={handleAltKeyDown}
            placeholder="Add alt text..."
            className="w-full text-xs bg-[#e2dfe8] border border-[#7c5cbf] rounded px-1.5 py-1 text-[#1a1a2e] focus:outline-none mb-1"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingAlt(true)}
            className="block w-full text-left mb-1 group/alt"
            title="Click to edit alt text"
          >
            <p
              className={[
                "text-xs line-clamp-1 rounded px-1 py-0.5 -mx-1 transition-colors",
                savingAlt
                  ? "text-[#7c5cbf]"
                  : asset.altText
                  ? "text-[#1a1a2e] group-hover/alt:bg-[#e2dfe8]"
                  : "text-[#7c7893] italic group-hover/alt:bg-[#e2dfe8]",
              ].join(" ")}
            >
              {savingAlt ? "Saving…" : asset.altText || "Add alt text…"}
            </p>
          </button>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#7c7893]">{formatBytes(asset.fileSize)}</span>
          {tags.length > 0 && (
            <span className="text-xs text-[#7c7893] bg-[#e2dfe8] px-1.5 py-0.5 rounded capitalize">
              {tags[0]}
              {tags.length > 1 && ` +${tags.length - 1}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MediaActions({ hotelId, media }: MediaActionsProps) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [mediaList, setMediaList] = useState<SerializedMediaAsset[]>(media);

  const handleUploadComplete = useCallback(() => {
    setShowUpload(false);
    router.refresh();
  }, [router]);

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body?.error ?? "Failed to delete image.");
        return;
      }
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    },
    [router]
  );

  const handleAltTextSave = useCallback(
    async (id: string, altText: string) => {
      const res = await fetch(`/api/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText }),
      });
      if (res.ok) {
        setMediaList((prev) =>
          prev.map((m) => (m.id === id ? { ...m, altText } : m))
        );
        router.refresh();
      }
    },
    [router]
  );

  const totalSize = mediaList.reduce((sum, m) => sum + m.fileSize, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">
            Media Library{" "}
            <span className="text-[#7c7893] font-normal">({mediaList.length})</span>
          </h3>
          {mediaList.length > 0 && (
            <p className="text-xs text-[#7c7893] mt-0.5">{formatBytes(totalSize)} total</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          className={[
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            showUpload
              ? "bg-[#e2dfe8] text-[#7c7893] hover:bg-[#d4d0de]"
              : "bg-[#3b7dd8]/10 hover:bg-[#3b7dd8]/20 text-[#3b7dd8]",
          ].join(" ")}
        >
          {showUpload ? (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
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
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Upload
            </>
          )}
        </button>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div className="mb-5">
          <MediaUpload hotelId={hotelId} onComplete={handleUploadComplete} />
        </div>
      )}

      {/* Media grid or empty state */}
      {mediaList.length === 0 && !showUpload ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[#e2dfe8] rounded-xl">
          <div className="w-12 h-12 rounded-full bg-[#f0eef5] flex items-center justify-center mb-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-[#7c7893]">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-sm text-[#7c7893]">No media assets yet</p>
          <p className="text-xs text-[#7c7893]/60 mt-1 mb-4">
            Upload images to build your hotel&apos;s visual library
          </p>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b7dd8] hover:bg-[#2d6dbf] text-white text-sm font-medium transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Upload Images
          </button>
        </div>
      ) : mediaList.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mediaList.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              onDelete={handleDelete}
              onAltTextSave={handleAltTextSave}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
