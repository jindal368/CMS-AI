"use client";

import { useState, useEffect } from "react";

export interface CountdownPromoProps {
  title?: string;
  description?: string;
  endDate?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string;
  textColor?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(endDate: string): TimeLeft | null {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function TimerBox({
  value,
  label,
  bgColor,
  textColor,
}: {
  value: string;
  label: string;
  bgColor: string;
  textColor: string;
}) {
  // Slightly lighter box bg by overlaying white at 12%
  const boxBg = "rgba(255,255,255,0.12)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-2xl px-5 py-4 min-w-[72px] text-center shadow-lg"
        style={{ backgroundColor: boxBg, border: "1px solid rgba(255,255,255,0.18)" }}
      >
        <span
          className="font-mono text-4xl font-bold leading-none tabular-nums"
          style={{ color: textColor }}
        >
          {value}
        </span>
      </div>
      <span
        className="text-xs tracking-widest uppercase font-medium"
        style={{ color: textColor, opacity: 0.65 }}
      >
        {label}
      </span>
    </div>
  );
}

export default function CountdownPromo({
  title = "Special Offer",
  description = "Exclusive rate for a limited time only. Book now to secure the best price.",
  endDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  })(),
  ctaText = "Book Before It's Gone",
  ctaLink = "{{booking}}",
  bgColor = "#e85d45",
  textColor = "#ffffff",
}: CountdownPromoProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calcTimeLeft(endDate)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const expired = timeLeft === null;

  return (
    <section
      className="py-20 px-6 relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Label */}
        <span
          className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            color: textColor,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          Limited Time Offer
        </span>

        {/* Title */}
        <h2
          className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          style={{ color: textColor }}
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p
            className="text-base md:text-lg mb-12 max-w-xl mx-auto font-light leading-relaxed"
            style={{ color: textColor, opacity: 0.85 }}
          >
            {description}
          </p>
        )}

        {/* Countdown or expired */}
        {expired ? (
          <div
            className="inline-block px-8 py-4 rounded-2xl mb-10 text-lg font-semibold"
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              color: textColor,
            }}
          >
            This offer has expired
          </div>
        ) : (
          <div className="flex items-start justify-center gap-4 md:gap-6 mb-12 flex-wrap">
            <TimerBox
              value={pad(timeLeft!.days)}
              label="Days"
              bgColor={bgColor}
              textColor={textColor}
            />
            <span
              className="text-4xl font-bold mt-4 hidden md:block"
              style={{ color: textColor, opacity: 0.5 }}
            >
              :
            </span>
            <TimerBox
              value={pad(timeLeft!.hours)}
              label="Hours"
              bgColor={bgColor}
              textColor={textColor}
            />
            <span
              className="text-4xl font-bold mt-4 hidden md:block"
              style={{ color: textColor, opacity: 0.5 }}
            >
              :
            </span>
            <TimerBox
              value={pad(timeLeft!.minutes)}
              label="Minutes"
              bgColor={bgColor}
              textColor={textColor}
            />
            <span
              className="text-4xl font-bold mt-4 hidden md:block"
              style={{ color: textColor, opacity: 0.5 }}
            >
              :
            </span>
            <TimerBox
              value={pad(timeLeft!.seconds)}
              label="Seconds"
              bgColor={bgColor}
              textColor={textColor}
            />
          </div>
        )}

        {/* CTA */}
        <a
          href={expired ? undefined : ctaLink}
          aria-disabled={expired}
          className={`inline-block px-10 py-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 ${
            expired
              ? "opacity-40 cursor-not-allowed pointer-events-none"
              : "hover:opacity-90 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
          }`}
          style={{
            backgroundColor: textColor,
            color: bgColor,
          }}
        >
          {expired ? "Offer Expired" : ctaText}
        </a>
      </div>
    </section>
  );
}
