"use client";

import { useState, useEffect } from "react";

export interface BookingStickyProps {
  cta?: string;
  showPrice?: boolean;
  externalUrl?: string;
}

export default function BookingSticky({
  cta = "Check Availability",
  showPrice = true,
  externalUrl = "",
}: BookingStickyProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-stone-900 text-white shadow-2xl transition-transform duration-400 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          {showPrice && (
            <div className="hidden sm:block">
              <p className="text-xs tracking-[0.15em] uppercase text-stone-400">
                From
              </p>
              <p className="text-xl font-light">
                USD 320
                <span className="text-stone-400 text-sm font-normal ml-1">/night</span>
              </p>
            </div>
          )}
          <div className="hidden md:flex items-center gap-3 text-stone-400 text-xs">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Best rate guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Free cancellation
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:+1800000000"
            className="hidden sm:inline-flex items-center gap-2 text-stone-300 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call to book
          </a>

          <button
            onClick={() => externalUrl ? window.open(externalUrl, "_blank") : undefined}
            className="inline-block px-8 py-3 bg-white text-stone-900 text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-100 transition-colors duration-200"
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}
