"use client";

import { useState, useRef } from "react";
import type { ImageData } from "./GalleryMasonry";

export interface GalleryFilmstripProps {
  heroSize?: "medium" | "large" | "full";
  thumbnailCount?: number;
  autoScroll?: boolean;
  images?: ImageData[];
}

const placeholderImages: ImageData[] = [
  { id: "1", url: "", altText: "Grand entrance" },
  { id: "2", url: "", altText: "Infinity pool" },
  { id: "3", url: "", altText: "Deluxe suite" },
  { id: "4", url: "", altText: "Rooftop terrace" },
  { id: "5", url: "", altText: "Spa retreat" },
  { id: "6", url: "", altText: "Fine dining" },
  { id: "7", url: "", altText: "Garden lounge" },
  { id: "8", url: "", altText: "Beachfront view" },
];

const heroBgColors = [
  "from-stone-700 to-stone-900",
  "from-amber-800 to-stone-900",
  "from-stone-600 to-stone-800",
];

const thumbBgColors = [
  "from-stone-300 to-stone-400",
  "from-amber-200 to-stone-300",
  "from-stone-200 to-stone-300",
  "from-amber-100 to-stone-200",
  "from-stone-300 to-amber-200",
  "from-stone-200 to-stone-400",
  "from-amber-50 to-stone-200",
  "from-stone-100 to-stone-300",
];

const heroHeightMap: Record<string, string> = {
  medium: "h-[420px]",
  large: "h-[560px]",
  full: "h-[720px]",
};

export default function GalleryFilmstrip({
  heroSize = "large",
  thumbnailCount = 6,
  images = [],
}: GalleryFilmstripProps) {
  const source = images.length ? images : placeholderImages;
  const [heroIndex, setHeroIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  const hero = source[heroIndex];
  const thumbs = source.slice(0, thumbnailCount);
  const heroHeight = heroHeightMap[heroSize] ?? heroHeightMap.large;

  const prev = () => setHeroIndex((i) => (i - 1 + source.length) % source.length);
  const next = () => setHeroIndex((i) => (i + 1) % source.length);

  return (
    <section className="py-20 bg-stone-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-500 font-medium">
            Gallery
          </span>
          <h2 className="text-4xl font-light text-white mt-3 tracking-tight">
            Visual Journey
          </h2>
        </div>

        {/* Hero image */}
        <div className={`relative w-full ${heroHeight} overflow-hidden mb-3 group`}>
          {hero.url ? (
            <img
              src={hero.url}
              alt={hero.altText ?? ""}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${heroBgColors[heroIndex % heroBgColors.length]} flex items-center justify-center`}
            >
              <span className="text-stone-400 text-xl tracking-wider">{hero.altText}</span>
            </div>
          )}

          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-stone-950/60 hover:bg-stone-950/90 text-white text-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={next}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-stone-950/60 hover:bg-stone-950/90 text-white text-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Next"
          >
            →
          </button>

          {/* Caption */}
          {hero.altText && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-950/70 to-transparent px-6 py-4">
              <p className="text-white/80 text-sm tracking-wide">{hero.altText}</p>
            </div>
          )}

          {/* Index counter */}
          <div className="absolute top-5 right-5 text-white/50 text-xs tracking-[0.2em] font-medium">
            {String(heroIndex + 1).padStart(2, "0")} / {String(source.length).padStart(2, "0")}
          </div>
        </div>

        {/* Filmstrip thumbnails */}
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {thumbs.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setHeroIndex(i)}
              className={`relative flex-none w-28 h-20 overflow-hidden transition-all duration-200 ${
                i === heroIndex
                  ? "ring-2 ring-white opacity-100"
                  : "opacity-50 hover:opacity-80"
              }`}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.altText ?? ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${thumbBgColors[i % thumbBgColors.length]}`}
                />
              )}
            </button>
          ))}

          {source.length > thumbnailCount && (
            <button
              onClick={next}
              className="flex-none w-28 h-20 border border-stone-700 text-stone-500 hover:text-white hover:border-stone-400 transition-colors text-xs tracking-[0.15em] uppercase flex items-center justify-center"
            >
              +{source.length - thumbnailCount} more
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
