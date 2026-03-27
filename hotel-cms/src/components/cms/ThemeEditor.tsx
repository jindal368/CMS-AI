"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ThemeData {
  colorTokens: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: "small" | "medium" | "large";
  };
  spacing: "compact" | "balanced" | "spacious";
  baseTemplate: "luxury" | "boutique" | "business" | "resort";
}

interface ThemeEditorProps {
  hotelId: string;
  theme: ThemeData | null;
}

const DEFAULTS: ThemeData = {
  colorTokens: {
    primary: "#e85d45",
    secondary: "#0fa886",
    accent: "#7c5cbf",
    bg: "#f8f7fa",
    text: "#1a1a2e",
  },
  typography: {
    headingFont: "Cormorant Garamond",
    bodyFont: "Inter",
    scale: "medium",
  },
  spacing: "balanced",
  baseTemplate: "luxury",
};

const HEADING_FONT_SUGGESTIONS = [
  "Cormorant Garamond",
  "Playfair Display",
  "DM Serif Display",
  "Libre Baskerville",
  "Lora",
  "Merriweather",
];

const BODY_FONT_SUGGESTIONS = [
  "Inter",
  "DM Sans",
  "Nunito",
  "Lato",
  "Source Sans 3",
  "Open Sans",
];

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-24 text-xs text-[#7c7893] capitalize shrink-0">
        {label}
      </label>
      <div className="relative shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-[#e2dfe8] bg-[#f0eef5] cursor-pointer p-0.5 appearance-none"
          style={{ colorScheme: "dark" }}
        />
      </div>
      <div
        className="w-5 h-5 rounded-md border border-[#e2dfe8] shrink-0"
        style={{ backgroundColor: value }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
        }}
        maxLength={7}
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-[#f0eef5] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] text-xs font-mono outline-none transition-colors"
        placeholder="#000000"
      />
    </div>
  );
}

function SpacingCard({
  value,
  current,
  onClick,
  description,
}: {
  value: "compact" | "balanced" | "spacious";
  current: string;
  onClick: () => void;
  description: string;
}) {
  const isSelected = value === current;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 p-3 rounded-xl border text-left transition-all ${
        isSelected
          ? "border-[#7c5cbf] bg-[#7c5cbf]/10 text-[#1a1a2e]"
          : "border-[#e2dfe8] bg-[#f0eef5] text-[#7c7893] hover:border-[#3d3850] hover:text-[#1a1a2e]"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
            isSelected ? "border-[#7c5cbf] bg-[#7c5cbf]" : "border-[#7c7893]"
          }`}
        />
        <span className="text-xs font-semibold capitalize">{value}</span>
      </div>
      <p className="text-xs opacity-70 leading-snug">{description}</p>
    </button>
  );
}

export default function ThemeEditor({ hotelId, theme }: ThemeEditorProps) {
  const router = useRouter();
  const initial = theme ?? DEFAULTS;

  const [primary, setPrimary] = useState(initial.colorTokens.primary);
  const [secondary, setSecondary] = useState(initial.colorTokens.secondary);
  const [accent, setAccent] = useState(initial.colorTokens.accent);
  const [bg, setBg] = useState(initial.colorTokens.bg);
  const [textColor, setTextColor] = useState(initial.colorTokens.text);

  const [headingFont, setHeadingFont] = useState(initial.typography.headingFont);
  const [bodyFont, setBodyFont] = useState(initial.typography.bodyFont);
  const [scale, setScale] = useState<"small" | "medium" | "large">(
    initial.typography.scale
  );

  const [spacing, setSpacing] = useState<"compact" | "balanced" | "spacious">(
    initial.spacing
  );
  const [baseTemplate, setBaseTemplate] = useState<
    "luxury" | "boutique" | "business" | "resort"
  >(initial.baseTemplate);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/hotels/${hotelId}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colorTokens: { primary, secondary, accent, bg, text: textColor },
          typography: { headingFont, bodyFont, scale },
          spacing,
          baseTemplate,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveStatus("saved");
      router.refresh();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Colors ── */}
      <section className="bg-[#f0eef5] rounded-xl p-5">
        <h4 className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider mb-4">
          Colors
        </h4>
        <div className="space-y-3">
          <ColorRow label="Primary" value={primary} onChange={setPrimary} />
          <ColorRow label="Secondary" value={secondary} onChange={setSecondary} />
          <ColorRow label="Accent" value={accent} onChange={setAccent} />
          <ColorRow label="Background" value={bg} onChange={setBg} />
          <ColorRow label="Text" value={textColor} onChange={setTextColor} />
        </div>
      </section>

      {/* ── Typography ── */}
      <section className="bg-[#f0eef5] rounded-xl p-5">
        <h4 className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider mb-4">
          Typography
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#7c7893] mb-1.5">
              Heading Font
            </label>
            <input
              type="text"
              value={headingFont}
              onChange={(e) => setHeadingFont(e.target.value)}
              list="heading-font-suggestions"
              className="w-full px-3 py-2 rounded-lg bg-[#ffffff] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] text-sm outline-none transition-colors"
              placeholder="e.g. Cormorant Garamond"
            />
            <datalist id="heading-font-suggestions">
              {HEADING_FONT_SUGGESTIONS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {HEADING_FONT_SUGGESTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHeadingFont(f)}
                  className={`px-2 py-0.5 rounded-md text-xs transition-colors ${
                    headingFont === f
                      ? "bg-[#7c5cbf]/20 text-[#7c5cbf] border border-[#7c5cbf]/30"
                      : "bg-[#ffffff] text-[#7c7893] border border-[#e2dfe8] hover:text-[#1a1a2e] hover:border-[#3d3850]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#7c7893] mb-1.5">
              Body Font
            </label>
            <input
              type="text"
              value={bodyFont}
              onChange={(e) => setBodyFont(e.target.value)}
              list="body-font-suggestions"
              className="w-full px-3 py-2 rounded-lg bg-[#ffffff] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] text-sm outline-none transition-colors"
              placeholder="e.g. Inter"
            />
            <datalist id="body-font-suggestions">
              {BODY_FONT_SUGGESTIONS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {BODY_FONT_SUGGESTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBodyFont(f)}
                  className={`px-2 py-0.5 rounded-md text-xs transition-colors ${
                    bodyFont === f
                      ? "bg-[#7c5cbf]/20 text-[#7c5cbf] border border-[#7c5cbf]/30"
                      : "bg-[#ffffff] text-[#7c7893] border border-[#e2dfe8] hover:text-[#1a1a2e] hover:border-[#3d3850]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#7c7893] mb-1.5">
              Type Scale
            </label>
            <select
              value={scale}
              onChange={(e) =>
                setScale(e.target.value as "small" | "medium" | "large")
              }
              className="w-full px-3 py-2 rounded-lg bg-[#ffffff] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] text-sm outline-none transition-colors"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Spacing ── */}
      <section className="bg-[#f0eef5] rounded-xl p-5">
        <h4 className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider mb-4">
          Spacing
        </h4>
        <div className="flex gap-3">
          <SpacingCard
            value="compact"
            current={spacing}
            onClick={() => setSpacing("compact")}
            description="Denser layout, more content visible"
          />
          <SpacingCard
            value="balanced"
            current={spacing}
            onClick={() => setSpacing("balanced")}
            description="Comfortable default balance"
          />
          <SpacingCard
            value="spacious"
            current={spacing}
            onClick={() => setSpacing("spacious")}
            description="Generous whitespace, premium feel"
          />
        </div>
      </section>

      {/* ── Base Template ── */}
      <section className="bg-[#f0eef5] rounded-xl p-5">
        <h4 className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider mb-4">
          Base Template
        </h4>
        <select
          value={baseTemplate}
          onChange={(e) =>
            setBaseTemplate(
              e.target.value as "luxury" | "boutique" | "business" | "resort"
            )
          }
          className="w-full px-3 py-2 rounded-lg bg-[#ffffff] border border-[#e2dfe8] focus:border-[#7c5cbf] text-[#1a1a2e] text-sm outline-none transition-colors"
        >
          <option value="luxury">Luxury</option>
          <option value="boutique">Boutique</option>
          <option value="business">Business</option>
          <option value="resort">Resort</option>
        </select>
      </section>

      {/* ── Preview Strip ── */}
      <section className="bg-[#f0eef5] rounded-xl p-5">
        <h4 className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider mb-4">
          Preview
        </h4>
        <div className="rounded-xl border border-[#e2dfe8] overflow-hidden">
          <div
            className="flex items-center gap-4 px-5 py-4 flex-wrap"
            style={{ backgroundColor: bg }}
          >
            {/* BG + text sample */}
            <div className="flex-1 min-w-[140px]">
              <p
                className="text-xs mb-0.5"
                style={{ color: textColor, opacity: 0.5, fontFamily: bodyFont }}
              >
                Body text sample
              </p>
              <p
                className="text-base font-semibold leading-tight"
                style={{ color: textColor, fontFamily: headingFont }}
              >
                {headingFont}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: textColor, opacity: 0.7, fontFamily: bodyFont }}
              >
                {bodyFont} · {scale} scale · {spacing}
              </p>
            </div>

            {/* Swatches */}
            <div className="flex items-center gap-2 shrink-0">
              {[
                { color: primary, label: "primary" },
                { color: secondary, label: "secondary" },
                { color: accent, label: "accent" },
              ].map(({ color, label }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-lg shadow-md"
                    style={{ backgroundColor: color }}
                    title={`${label}: ${color}`}
                  />
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: textColor, opacity: 0.5 }}
                  >
                    {color}
                  </span>
                </div>
              ))}
            </div>

            {/* Template badge */}
            <div
              className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${primary}20`,
                borderColor: `${primary}40`,
                color: primary,
              }}
            >
              {baseTemplate}
            </div>
          </div>
        </div>
      </section>

      {/* ── Save Button ── */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            saveStatus === "saved"
              ? "bg-[#0fa886]/20 text-[#0fa886] border border-[#0fa886]/30"
              : saveStatus === "saving"
              ? "bg-[#7c5cbf]/20 text-[#7c5cbf] border border-[#7c5cbf]/30 opacity-70 cursor-not-allowed"
              : "bg-[#7c5cbf] hover:bg-[#b89dfb] text-white"
          }`}
        >
          {saveStatus === "saving" && (
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
          )}
          {saveStatus === "saved" && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {saveStatus === "idle" && (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
            </svg>
          )}
          {saveStatus === "saving"
            ? "Saving…"
            : saveStatus === "saved"
            ? "Saved"
            : "Save Theme"}
        </button>
      </div>
    </div>
  );
}
