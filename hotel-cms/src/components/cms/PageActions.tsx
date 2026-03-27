"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CreatePageModal from "./CreatePageModal";

interface SerializedPage {
  id: string;
  hotelId: string;
  slug: string;
  locale: string;
  pageType: string;
  sortOrder: number;
  metaTags: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  _count: { sections: number };
}

interface PageActionsProps {
  hotelId: string;
  pages: SerializedPage[];
}

const pageTypeIcons: Record<string, string> = {
  home: "🏠",
  rooms: "🛏",
  gallery: "🖼",
  contact: "📬",
  about: "ℹ️",
  dining: "🍽",
  spa: "🧖",
  events: "🎉",
  custom: "📄",
};

const pageTypeBadgeColors: Record<string, string> = {
  home: "text-[#0fa886] bg-[#0fa886]/10 border-[#0fa886]/20",
  rooms: "text-[#3b7dd8] bg-[#3b7dd8]/10 border-[#3b7dd8]/20",
  gallery: "text-[#7c5cbf] bg-[#7c5cbf]/10 border-[#7c5cbf]/20",
  contact: "text-[#d49a12] bg-[#d49a12]/10 border-[#d49a12]/20",
  about: "text-[#0fa886] bg-[#0fa886]/10 border-[#0fa886]/20",
  dining: "text-[#e85d45] bg-[#e85d45]/10 border-[#e85d45]/20",
  spa: "text-[#7c5cbf] bg-[#7c5cbf]/10 border-[#7c5cbf]/20",
  events: "text-[#d49a12] bg-[#d49a12]/10 border-[#d49a12]/20",
  custom: "text-[#7c7893] bg-[#7c7893]/10 border-[#7c7893]/20",
};

export default function PageActions({ hotelId, pages }: PageActionsProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (page: SerializedPage) => {
    const confirmed = window.confirm(
      `Delete the "${page.pageType}" page (${page.slug})? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(page.id);
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete page");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete page");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1a1a2e]">
          Pages{" "}
          <span className="text-[#7c7893] font-normal">({pages.length})</span>
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e85d45]/10 hover:bg-[#e85d45]/20 text-[#e85d45] text-xs font-medium transition-colors"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Page
        </button>
      </div>

      {/* Pages list */}
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-[#f0eef5] flex items-center justify-center mb-3">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-[#7c7893]"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-sm text-[#7c7893]">No pages yet</p>
          <p className="text-xs text-[#7c7893]/60 mt-1">
            Add your first page to build this hotel&apos;s website
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => {
            const badgeColor =
              pageTypeBadgeColors[page.pageType] ?? pageTypeBadgeColors.custom;
            const isDeleting = deletingId === page.id;

            return (
              <div
                key={page.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#f0eef5] hover:bg-[#e8e5f0] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base shrink-0" title={page.pageType}>
                    {pageTypeIcons[page.pageType] ?? "📄"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/hotels/${hotelId}/pages/${page.id}`}
                        className="text-sm font-medium text-[#1a1a2e] hover:text-[#7c5cbf] transition-colors truncate"
                      >
                        {page.slug === "/" ? "/" : `/${page.slug}`}
                      </Link>
                      <span
                        className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border capitalize shrink-0 ${badgeColor}`}
                      >
                        {page.pageType}
                      </span>
                      {page.locale !== "en" && (
                        <span className="text-xs text-[#3b7dd8] bg-[#3b7dd8]/10 px-1.5 py-0.5 rounded uppercase shrink-0">
                          {page.locale}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7c7893] mt-0.5">
                      {page._count.sections}{" "}
                      {page._count.sections === 1 ? "section" : "sections"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  <Link
                    href={`/hotels/${hotelId}/pages/${page.id}`}
                    className="p-1.5 rounded-lg text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#ffffff] transition-colors"
                    title="Open page builder"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(page)}
                    disabled={isDeleting}
                    title="Delete page"
                    className="p-1.5 rounded-lg text-[#7c7893] hover:text-[#e85d45] hover:bg-[#e85d45]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <svg
                        className="w-4 h-4 animate-spin"
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
                    ) : (
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
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
            );
          })}
        </div>
      )}

      {/* Create page modal */}
      {showModal && (
        <CreatePageModal
          hotelId={hotelId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
