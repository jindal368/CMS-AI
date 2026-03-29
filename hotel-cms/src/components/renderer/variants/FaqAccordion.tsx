"use client";

import { useState } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqAccordionProps {
  title?: string;
  subtitle?: string;
  items?: FaqItem[];
  defaultOpen?: number;
}

const defaultItems: FaqItem[] = [
  {
    question: "What are the check-in and check-out times?",
    answer: "Check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in and late check-out may be available upon request, subject to availability.",
  },
  {
    question: "Is parking available?",
    answer: "Yes, we offer complimentary valet parking for all guests. Self-parking is also available in our secure underground garage.",
  },
  {
    question: "Do you allow pets?",
    answer: "We warmly welcome well-behaved pets. A small pet fee applies per night. Please inform us at the time of booking so we can prepare accordingly.",
  },
  {
    question: "What is your cancellation policy?",
    answer: "We offer free cancellation up to 48 hours before your scheduled check-in. Cancellations within 48 hours may be subject to a one-night charge.",
  },
];

export default function FaqAccordion({
  title = "Frequently Asked Questions",
  subtitle = "",
  items = [],
  defaultOpen = 0,
}: FaqAccordionProps) {
  const faqs = items.length ? items : defaultItems;
  const [openIndex, setOpenIndex] = useState<number>(defaultOpen);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? -1 : i);
  };

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Support
          </span>
          <h2 className="text-4xl font-light text-stone-900 mt-3 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-stone-500 mt-4 text-lg font-light">
              {subtitle}
            </p>
          )}
          <div className="w-12 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        {/* Accordion */}
        <div className="divide-y divide-stone-100">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between py-5 text-left group"
                aria-expanded={openIndex === i}
              >
                <span className="font-semibold text-stone-900 pr-6 group-hover:text-stone-600 transition-colors duration-200">
                  {faq.question}
                </span>
                <span
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-stone-200 text-stone-500 text-sm font-bold transition-transform duration-300"
                  style={{
                    transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: openIndex === i ? "500px" : "0px",
                  opacity: openIndex === i ? 1 : 0,
                }}
              >
                <p className="pb-5 text-stone-500 font-light leading-relaxed text-sm">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
