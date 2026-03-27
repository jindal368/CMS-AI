"use client";

import { useRef, useState, useCallback } from "react";

interface MediaUploadProps {
  hotelId: string;
  onComplete: () => void;
}

interface UploadResult {
  fileName: string;
  error?: string;
}

export default function MediaUpload({ hotelId, onComplete }: MediaUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      setUploading(true);
      setResults([]);
      setShowSuccess(false);
      setProgress({ current: 0, total: imageFiles.length });

      const uploadResults: UploadResult[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        setProgress({ current: i + 1, total: imageFiles.length });
        const file = imageFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("hotelId", hotelId);

        try {
          const res = await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            uploadResults.push({
              fileName: file.name,
              error: body?.error ?? `Upload failed (${res.status})`,
            });
          } else {
            uploadResults.push({ fileName: file.name });
          }
        } catch {
          uploadResults.push({ fileName: file.name, error: "Network error" });
        }
      }

      setUploading(false);
      setProgress(null);
      setResults(uploadResults);

      const failures = uploadResults.filter((r) => r.error);
      if (failures.length === 0) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onComplete();
        }, 1500);
      } else {
        // Still call onComplete so successful uploads are reflected
        onComplete();
      }
    },
    [hotelId, onComplete]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        uploadFiles(files);
        // Reset input so same file can be re-selected
        e.target.value = "";
      }
    },
    [uploadFiles]
  );

  const failedUploads = results.filter((r) => r.error);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "relative flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed transition-colors",
          isDragOver
            ? "border-[#7c5cbf] bg-[#7c5cbf]/5"
            : "border-[#e2dfe8] bg-[#f0eef5] hover:border-[#d4d0de]",
          uploading ? "pointer-events-none opacity-60" : "cursor-pointer",
        ].join(" ")}
      >
        {/* Upload icon */}
        <div className="w-10 h-10 rounded-full bg-[#e2dfe8] flex items-center justify-center mb-3">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={["w-5 h-5", isDragOver ? "text-[#7c5cbf]" : "text-[#7c7893]"].join(" ")}
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {uploading && progress ? (
          <div className="flex flex-col items-center gap-2">
            {/* Spinner */}
            <svg
              className="w-5 h-5 text-[#3b7dd8] animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
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
            <p className="text-sm text-[#1a1a2e]">
              Uploading {progress.current}/{progress.total}&hellip;
            </p>
          </div>
        ) : showSuccess ? (
          <div className="flex flex-col items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-[#0fa886]">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-[#0fa886]">Upload complete</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#1a1a2e] mb-1">
              {isDragOver ? "Drop images here" : "Drag & drop images here"}
            </p>
            <p className="text-xs text-[#7c7893] mb-3">or</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b7dd8]/10 hover:bg-[#3b7dd8]/20 text-[#3b7dd8] text-xs font-medium transition-colors"
            >
              Browse files
            </button>
            <p className="text-xs text-[#7c7893] mt-2">
              JPEG, PNG, WebP, AVIF, GIF &mdash; max 20 MB each
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      {/* Failed upload errors */}
      {failedUploads.length > 0 && (
        <div className="space-y-1.5">
          {failedUploads.map((r) => (
            <div
              key={r.fileName}
              className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#e85d45]/10 border border-[#e85d45]/20"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-[#e85d45] mt-0.5 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="min-w-0">
                <p className="text-xs text-[#e85d45] font-medium truncate">{r.fileName}</p>
                <p className="text-xs text-[#e85d45]/70">{r.error}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
