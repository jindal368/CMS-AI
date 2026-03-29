"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/ui/Portal";

interface CreatePageModalProps {
  hotelId: string;
  onClose: () => void;
}

const PAGE_TYPES = [
  "home",
  "rooms",
  "gallery",
  "contact",
  "about",
  "dining",
  "spa",
  "events",
  "custom",
] as const;

type PageType = (typeof PAGE_TYPES)[number];

function generateSlug(pageType: PageType | ""): string {
  if (!pageType) return "";
  if (pageType === "home") return "/";
  return pageType.toLowerCase();
}

export default function CreatePageModal({
  hotelId,
  onClose,
}: CreatePageModalProps) {
  const router = useRouter();
  const [pageType, setPageType] = useState<PageType | "">("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [locale, setLocale] = useState("en");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug when pageType changes, unless user has manually edited it
  useEffect(() => {
    if (!slugTouched) {
      setSlug(generateSlug(pageType));
    }
  }, [pageType, slugTouched]);

  const handleSlugChange = (val: string) => {
    setSlugTouched(true);
    setSlug(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageType) {
      setError("Please select a page type.");
      return;
    }
    if (!slug) {
      setError("Slug is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          slug,
          pageType,
          locale,
          metaTags: {
            title: metaTitle,
            description: metaDescription,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create page");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-[#ffffff] border border-[#e2dfe8] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2dfe8]">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">
              Create Page
            </h2>
            <p className="text-xs text-[#7c7893] mt-0.5">
              Add a new page to this hotel
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Page Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">
              Page Type <span className="text-[#e85d45]">*</span>
            </label>
            <select
              value={pageType}
              onChange={(e) => setPageType(e.target.value as PageType)}
              required
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] rounded-lg px-3 py-2 text-sm outline-none transition-colors capitalize"
            >
              <option value="" disabled className="text-[#7c7893]">
                Select a page type…
              </option>
              {PAGE_TYPES.map((pt) => (
                <option key={pt} value={pt} className="capitalize">
                  {pt.charAt(0).toUpperCase() + pt.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">
              Slug <span className="text-[#e85d45]">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              placeholder="e.g. /rooms or about"
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] placeholder-[#7c7893] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            />
          </div>

          {/* Locale */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">
              Locale
            </label>
            <input
              type="text"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              placeholder="en"
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] placeholder-[#7c7893] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            />
          </div>

          {/* Meta Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">
              Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Page title for search engines"
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] placeholder-[#7c7893] rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            />
          </div>

          {/* Meta Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5a5670]">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Brief description for search engines"
              rows={3}
              className="w-full bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] placeholder-[#7c7893] rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none"
            />
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
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7c5cbf]/10 hover:bg-[#7c5cbf]/20 text-[#7c5cbf] border border-[#7c5cbf]/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating…
                </>
              ) : (
                "Create Page"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
