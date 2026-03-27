"use client";

import { useState, useMemo } from "react";

export interface ImageData {
  id: string;
  url: string;
  altText?: string;
  tags?: string[];
}

export interface GalleryMasonryProps {
  columns?: number;
  gap?: number;
  enableLightbox?: boolean;
  filterByTag?: string;
  images?: ImageData[];
}

const placeholderImages: ImageData[] = [
  { id: "1", url: "", altText: "Hotel lobby", tags: ["interior", "lobby"] },
  { id: "2", url: "", altText: "Pool area", tags: ["exterior", "pool"] },
  { id: "3", url: "", altText: "Deluxe suite", tags: ["rooms"] },
  { id: "4", url: "", altText: "Fine dining", tags: ["dining"] },
  { id: "5", url: "", altText: "Spa treatment", tags: ["spa"] },
  { id: "6", url: "", altText: "Garden view", tags: ["exterior"] },
  { id: "7", url: "", altText: "Bar lounge", tags: ["dining", "interior"] },
  { id: "8", url: "", altText: "Penthouse terrace", tags: ["rooms", "exterior"] },
];

const heights = ["row-span-1", "row-span-2", "row-span-1", "row-span-2", "row-span-1", "row-span-1", "row-span-2", "row-span-1"];
const bgColors = [
  "from-stone-200 to-stone-300",
  "from-amber-100 to-stone-200",
  "from-stone-300 to-stone-400",
  "from-stone-100 to-stone-200",
  "from-amber-50 to-stone-100",
  "from-stone-200 to-amber-100",
  "from-stone-100 to-stone-300",
  "from-amber-100 to-stone-200",
];

export default function GalleryMasonry({
  columns = 3,
  gap = 8,
  enableLightbox = true,
  filterByTag = "",
  images = [],
}: GalleryMasonryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const source = images.length ? images : placeholderImages;

  const filtered = useMemo(() => {
    if (!filterByTag) return source;
    return source.filter((img) =>
      img.tags?.some((t) => t.toLowerCase().includes(filterByTag.toLowerCase()))
    );
  }, [source, filterByTag]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    source.forEach((img) => img.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [source]);

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const display = activeTag
    ? filtered.filter((img) => img.tags?.includes(activeTag))
    : filtered;

  const colsClass: Record<number, string> = {
    2: "columns-2",
    3: "columns-3",
    4: "columns-4",
    5: "columns-5",
  };

  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + display.length) % display.length : null));
  const nextImage = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % display.length : null));

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Gallery
          </span>
          <h2 className="text-4xl font-light text-stone-900 mt-3 tracking-tight">
            Discover Our World
          </h2>
          <div className="w-12 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveTag(null)}
              className={`text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-all duration-200 ${
                !activeTag
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={`text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-all duration-200 ${
                  activeTag === tag
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Masonry grid */}
        <div
          className={`${colsClass[columns] ?? colsClass[3]}`}
          style={{ gap: `${gap}px`, columnGap: `${gap}px` }}
        >
          {display.map((img, i) => (
            <div
              key={img.id}
              className="mb-2 overflow-hidden group cursor-pointer break-inside-avoid"
              style={{ marginBottom: `${gap}px` }}
              onClick={() => enableLightbox && setLightboxIndex(i)}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.altText ?? "Gallery image"}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div
                  className={`w-full bg-gradient-to-br ${bgColors[i % bgColors.length]} flex items-center justify-center`}
                  style={{ height: i % 3 === 1 ? "320px" : "220px" }}
                >
                  <span className="text-stone-400/60 text-sm tracking-wide">
                    {img.altText}
                  </span>
                </div>
              )}
              {enableLightbox && (
                <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors duration-300 pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {enableLightbox && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white text-3xl font-light"
            onClick={closeLightbox}
          >
            ×
          </button>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            ←
          </button>
          <div
            className="max-w-5xl max-h-[85vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            {display[lightboxIndex].url ? (
              <img
                src={display[lightboxIndex].url}
                alt={display[lightboxIndex].altText ?? ""}
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <div className="w-[800px] h-[500px] bg-stone-800 flex items-center justify-center">
                <span className="text-stone-400">{display[lightboxIndex].altText}</span>
              </div>
            )}
            {display[lightboxIndex].altText && (
              <p className="text-stone-400 text-sm text-center mt-3">
                {display[lightboxIndex].altText}
              </p>
            )}
          </div>
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}
