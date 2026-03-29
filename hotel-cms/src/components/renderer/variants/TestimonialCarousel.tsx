"use client";

import { useState } from "react";

export interface Testimonial {
  quote: string;
  author: string;
  location: string;
  rating: number;
}

export interface TestimonialCarouselProps {
  title?: string;
  testimonials?: Testimonial[];
}

const defaultTestimonials: Testimonial[] = [
  {
    quote: "An absolutely magical experience. The attention to detail was extraordinary.",
    author: "Sophie M.",
    location: "Paris, France",
    rating: 5,
  },
  {
    quote: "The perfect blend of luxury and warmth. We felt truly at home.",
    author: "James K.",
    location: "London, UK",
    rating: 5,
  },
  {
    quote: "From the stunning rooms to the incredible dining, everything exceeded expectations.",
    author: "Elena V.",
    location: "Milan, Italy",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 justify-center" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="w-5 h-5"
          fill={i < rating ? "#c9a96e" : "none"}
          stroke="#c9a96e"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.048 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialCarousel({
  title = "What Our Guests Say",
  testimonials = [],
}: TestimonialCarouselProps) {
  const items = testimonials.length ? testimonials : defaultTestimonials;
  const [active, setActive] = useState(0);

  const prev = () => setActive((a) => (a - 1 + items.length) % items.length);
  const next = () => setActive((a) => (a + 1) % items.length);

  const current = items[active];

  return (
    <section
      className="py-24 px-6"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Section label */}
        <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
          Guest Reviews
        </span>

        {/* Title */}
        <h2
          className="text-4xl font-light mt-4 mb-14 text-white tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {title}
        </h2>

        {/* Testimonial card */}
        <div className="relative">
          {/* Large open quote mark */}
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-7xl font-serif leading-none select-none pointer-events-none"
            style={{ color: "#c9a96e", opacity: 0.25 }}
            aria-hidden="true"
          >
            &ldquo;
          </div>

          <div className="relative z-10 px-4 md:px-12">
            {/* Stars */}
            <div className="mb-6">
              <StarRating rating={current.rating} />
            </div>

            {/* Quote */}
            <p
              className="text-xl md:text-2xl font-light leading-relaxed text-white italic mb-8"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              &ldquo;{current.quote}&rdquo;
            </p>

            {/* Author */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-px mb-3" style={{ backgroundColor: "#c9a96e" }} />
              <p className="font-semibold text-white text-base">{current.author}</p>
              <p className="text-stone-400 text-sm">{current.location}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-12">
          {/* Prev */}
          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors duration-200 hover:bg-stone-700"
            style={{ borderColor: "#4a4a6a", color: "#a0a0c0" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === active ? "24px" : "8px",
                  height: "8px",
                  backgroundColor: i === active ? "#c9a96e" : "#4a4a6a",
                }}
              />
            ))}
          </div>

          {/* Next */}
          <button
            onClick={next}
            aria-label="Next testimonial"
            className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors duration-200 hover:bg-stone-700"
            style={{ borderColor: "#4a4a6a", color: "#a0a0c0" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Slide counter */}
        <p className="mt-4 text-stone-500 text-xs tracking-widest">
          {active + 1} / {items.length}
        </p>
      </div>
    </section>
  );
}
