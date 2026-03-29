"use client";

import { useState } from "react";

interface BrandThemeData {
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
  };
  spacing: "compact" | "balanced" | "spacious";
  baseTemplate: "luxury" | "boutique" | "business" | "resort";
}

interface BrandThemeEditorProps {
  brandTheme: object | null;
  onSave: () => void;
}

const DEFAULTS: BrandThemeData = {
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
  },
  spacing: "balanced",
  baseTemplate: "luxury",
};

function isThemeData(obj: object): obj is BrandThemeData {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "colorTokens" in obj &&
    "typography" in obj &&
    "spacing" in obj &&
    "baseTemplate" in obj
  );
}

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
      <label className="w-24 text-xs text-muted capitalize shrink-0">{label}</label>
      <div className="relative shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-border bg-elevated cursor-pointer p-0.5 appearance-none"
          style={{ colorScheme: "dark" }}
        />
      </div>
      <div
        className="w-5 h-5 rounded-md border border-border shrink-0"
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
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-elevated border border-border focus:border-[#7c5cbf] text-foreground text-xs font-mono outline-none transition-colors"
        placeholder="#000000"
      />
    </div>
  );
}

export default function BrandThemeEditor({ brandTheme, onSave }: BrandThemeEditorProps) {
  const initial =
    brandTheme !== null && isThemeData(brandTheme as object)
      ? (brandTheme as BrandThemeData)
      : DEFAULTS;

  const [enabled, setEnabled] = useState(brandTheme !== null);

  const [primary, setPrimary] = useState(initial.colorTokens.primary);
  const [secondary, setSecondary] = useState(initial.colorTokens.secondary);
  const [accent, setAccent] = useState(initial.colorTokens.accent);
  const [bg, setBg] = useState(initial.colorTokens.bg);
  const [textColor, setTextColor] = useState(initial.colorTokens.text);
  const [headingFont, setHeadingFont] = useState(initial.typography.headingFont);
  const [bodyFont, setBodyFont] = useState(initial.typography.bodyFont);
  const [spacing, setSpacing] = useState<"compact" | "balanced" | "spacious">(initial.spacing);
  const [baseTemplate, setBaseTemplate] = useState<"luxury" | "boutique" | "business" | "resort">(
    initial.baseTemplate
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const body = enabled
        ? {
            brandTheme: {
              colorTokens: { primary, secondary, accent, bg, text: textColor },
              typography: { headingFont, bodyFont },
              spacing,
              baseTemplate,
            },
          }
        : { brandTheme: null };

      const res = await fetch("/api/brand/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaveStatus("saved");
      onSave();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center gap-3 p-4 bg-elevated rounded-xl">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            enabled ? "bg-[#7c5cbf]" : "bg-border"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <div>
          <p className="text-sm font-medium text-foreground">
            Apply organization theme to all hotels
          </p>
          <p className="text-xs text-muted">
            {enabled
              ? "Hotels without a custom theme will inherit this brand theme."
              : "Each hotel uses its own theme settings."}
          </p>
        </div>
      </div>

      {enabled && (
        <>
          {/* Colors */}
          <section className="bg-elevated rounded-xl p-5">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
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

          {/* Typography */}
          <section className="bg-elevated rounded-xl p-5">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              Typography
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Heading Font</label>
                <input
                  type="text"
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:border-[#7c5cbf] text-foreground text-sm outline-none transition-colors"
                  placeholder="e.g. Cormorant Garamond"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Body Font</label>
                <input
                  type="text"
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:border-[#7c5cbf] text-foreground text-sm outline-none transition-colors"
                  placeholder="e.g. Inter"
                />
              </div>
            </div>
          </section>

          {/* Spacing */}
          <section className="bg-elevated rounded-xl p-5">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              Spacing
            </h4>
            <select
              value={spacing}
              onChange={(e) =>
                setSpacing(e.target.value as "compact" | "balanced" | "spacious")
              }
              className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:border-[#7c5cbf] text-foreground text-sm outline-none transition-colors"
            >
              <option value="compact">Compact</option>
              <option value="balanced">Balanced</option>
              <option value="spacious">Spacious</option>
            </select>
          </section>

          {/* Base Template */}
          <section className="bg-elevated rounded-xl p-5">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
              Base Template
            </h4>
            <select
              value={baseTemplate}
              onChange={(e) =>
                setBaseTemplate(
                  e.target.value as "luxury" | "boutique" | "business" | "resort"
                )
              }
              className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:border-[#7c5cbf] text-foreground text-sm outline-none transition-colors"
            >
              <option value="luxury">Luxury</option>
              <option value="boutique">Boutique</option>
              <option value="business">Business</option>
              <option value="resort">Resort</option>
            </select>
          </section>
        </>
      )}

      {/* Save button */}
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
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save Theme"}
        </button>
      </div>
    </div>
  );
}
