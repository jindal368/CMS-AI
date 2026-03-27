"use client";

import { useState } from "react";
import Link from "next/link";
import type { RoomData } from "./RoomsGrid";

export interface RoomsShowcaseProps {
  autoplay?: boolean;
  showDetails?: boolean;
  transitionEffect?: "slide" | "fade" | "zoom";
  rooms?: RoomData[];
}

const placeholderRooms: RoomData[] = [
  {
    id: "1",
    name: "Deluxe King Room",
    description:
      "Immerse yourself in understated luxury. Floor-to-ceiling windows frame panoramic city views while bespoke furnishings create an atmosphere of quiet sophistication.",
    pricing: { basePrice: 320, currency: "USD" },
    amenities: ["wifi", "king bed", "city view", "minibar"],
    images: [],
    maxGuests: 2,
  },
  {
    id: "2",
    name: "Superior Suite",
    description:
      "A sanctuary of refined comfort — the Superior Suite features a generous living area, private terrace, and marble bathroom with deep-soak tub.",
    pricing: { basePrice: 580, currency: "USD" },
    amenities: ["wifi", "balcony", "bathtub", "breakfast"],
    images: [],
    maxGuests: 3,
  },
  {
    id: "3",
    name: "Penthouse Suite",
    description:
      "The pinnacle of our collection. The Penthouse commands 360° views, a private plunge pool, and dedicated butler service for an unrivalled experience.",
    pricing: { basePrice: 1200, currency: "USD" },
    amenities: ["pool", "spa", "ocean view", "breakfast"],
    images: [],
    maxGuests: 4,
  },
];

export default function RoomsShowcase({
  showDetails = true,
  rooms = [],
}: RoomsShowcaseProps) {
  const displayRooms = rooms.length ? rooms : placeholderRooms;
  const [active, setActive] = useState(0);

  const current = displayRooms[active];
  const prev = () => setActive((i) => (i - 1 + displayRooms.length) % displayRooms.length);
  const next = () => setActive((i) => (i + 1) % displayRooms.length);

  return (
    <section className="relative w-full min-h-[700px] bg-stone-950 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        {current.images?.[0] ? (
          <img
            src={current.images[0]}
            alt={current.name}
            className="w-full h-full object-cover transition-opacity duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center min-h-[700px]">
        <div className="max-w-7xl mx-auto w-full px-8 md:px-16 py-20 grid md:grid-cols-2 gap-16">
          {/* Left: Room Info */}
          <div className="flex flex-col justify-center text-white">
            <span className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-4 font-medium">
              Room {active + 1} of {displayRooms.length}
            </span>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-5">
              {current.name}
            </h2>
            {showDetails && current.description && (
              <p className="text-stone-300 text-base leading-relaxed mb-8 max-w-lg font-light">
                {current.description}
              </p>
            )}
            {showDetails && current.pricing && (
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-3xl font-light">
                  {current.pricing.currency} {current.pricing.basePrice.toLocaleString()}
                </span>
                <span className="text-stone-400 text-sm">/night</span>
              </div>
            )}
            {showDetails && current.amenities && current.amenities.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-10">
                {current.amenities.map((a) => (
                  <span
                    key={a}
                    className="text-xs tracking-wide uppercase text-stone-300 border border-stone-600 px-3 py-1"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
            <Link
              href="#booking"
              className="self-start inline-block px-8 py-3 border border-white text-white text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-stone-900 transition-all duration-300 font-medium"
            >
              Reserve Now
            </Link>
          </div>

          {/* Right: Navigation thumbnails */}
          <div className="hidden md:flex flex-col justify-center gap-4">
            {displayRooms.map((room, i) => (
              <button
                key={room.id}
                onClick={() => setActive(i)}
                className={`group flex items-center gap-4 text-left transition-opacity duration-300 ${
                  i === active ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <div
                  className={`w-1 h-8 transition-all duration-300 ${
                    i === active ? "bg-white" : "bg-stone-600"
                  }`}
                />
                <span
                  className={`text-sm font-medium tracking-wide ${
                    i === active ? "text-white" : "text-stone-400"
                  }`}
                >
                  {room.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Arrow controls */}
      <div className="absolute bottom-8 left-8 md:left-16 z-10 flex gap-3">
        <button
          onClick={prev}
          aria-label="Previous room"
          className="w-10 h-10 border border-white/40 text-white/70 hover:border-white hover:text-white transition-all duration-200 flex items-center justify-center text-lg"
        >
          ←
        </button>
        <button
          onClick={next}
          aria-label="Next room"
          className="w-10 h-10 border border-white/40 text-white/70 hover:border-white hover:text-white transition-all duration-200 flex items-center justify-center text-lg"
        >
          →
        </button>
      </div>
    </section>
  );
}
