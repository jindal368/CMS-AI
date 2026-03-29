"use client";

import { useState } from "react";
import { LOCALE_NAMES } from "@/lib/i18n/languages";

interface AddLanguageModalProps {
  hotelId: string;
  enabledLocales: string[];
  onClose: () => void;
  onAdded: () => void;
}

type ModalState =
  | { phase: "pick" }
  | { phase: "translating"; locale: string; language: string }
  | { phase: "done"; locale: string; count: number }
  | { phase: "error"; message: string };

export default function AddLanguageModal({
  hotelId,
  enabledLocales,
  onClose,
  onAdded,
}: AddLanguageModalProps) {
  const [state, setState] = useState<ModalState>({ phase: "pick" });

  const availableLocales = Object.entries(LOCALE_NAMES).filter(
    ([locale]) => !enabledLocales.includes(locale)
  );

  const handleSelect = async (locale: string, language: string) => {
    setState({ phase: "translating", locale, language });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000);

    try {
      const res = await fetch(`/api/i18n/translate/${hotelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLocale: locale, targetLanguage: language }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed: ${res.status}`);
      }

      const data = await res.json();
      const count = data.pagesTranslated ?? data.count ?? 0;
      setState({ phase: "done", locale, count });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        setState({ phase: "error", message: "Request timed out after 3 minutes." });
      } else {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "Translation failed.",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-sm"
        onClick={state.phase === "translating" ? undefined : onClose}
      />

      {/* Glass card */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(124,92,191,0.18), 0 1.5px 6px rgba(0,0,0,0.08)",
          border: "1px solid rgba(255,255,255,0.55)",
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1a1a2e]">Add Language</h2>
            <p className="text-xs text-[#7c7893] mt-0.5">
              Select a language to translate all pages
            </p>
          </div>
          {state.phase !== "translating" && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7c7893] hover:text-[#1a1a2e] hover:bg-white/60 transition-colors"
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {state.phase === "pick" && (
            <>
              {availableLocales.length === 0 ? (
                <p className="text-sm text-[#7c7893] text-center py-4">
                  All available languages are already enabled.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {availableLocales.map(([locale, language]) => (
                    <button
                      key={locale}
                      onClick={() => handleSelect(locale, language)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border border-white/50 bg-white/50 hover:bg-[#7c5cbf]/10 hover:border-[#7c5cbf]/30 group"
                    >
                      <span className="text-xs font-bold text-[#7c5cbf] bg-[#7c5cbf]/10 px-1.5 py-0.5 rounded-md group-hover:bg-[#7c5cbf]/20 transition-colors">
                        {locale.toUpperCase()}
                      </span>
                      <span className="text-sm text-[#1a1a2e] font-medium truncate">
                        {language}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {state.phase === "translating" && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-[#7c5cbf]/10 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 animate-spin text-[#7c5cbf]"
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
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1a2e]">
                  Translating to {LOCALE_NAMES[state.locale] ?? state.locale}…
                </p>
                <p className="text-xs text-[#7c7893] mt-1">
                  This may take 1–3 minutes. Please wait.
                </p>
              </div>
            </div>
          )}

          {state.phase === "done" && (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#0fa886]/12 flex items-center justify-center">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-7 h-7 text-[#0fa886]"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1a2e]">
                  Done! {state.count} {state.count === 1 ? "page" : "pages"} translated.
                </p>
                <p className="text-xs text-[#7c7893] mt-1">
                  {LOCALE_NAMES[state.locale] ?? state.locale} is now available for this hotel.
                </p>
              </div>
              <button
                onClick={() => { onAdded(); onClose(); }}
                className="px-5 py-2 rounded-lg bg-[#0fa886] hover:bg-[#0d9878] text-white text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {state.phase === "error" && (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e85d45]/10 flex items-center justify-center">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-7 h-7 text-[#e85d45]"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#e85d45]">Translation failed</p>
                <p className="text-xs text-[#7c7893] mt-1 max-w-xs">{state.message}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setState({ phase: "pick" })}
                  className="px-4 py-2 rounded-lg border border-[#7c7893]/30 text-[#7c7893] text-sm font-medium hover:bg-white/60 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-[#e85d45]/10 text-[#e85d45] text-sm font-medium hover:bg-[#e85d45]/20 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
