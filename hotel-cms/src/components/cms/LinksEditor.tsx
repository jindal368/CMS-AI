"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  hotelId: string;
  links: Record<string, string>;
  contactInfo: Record<string, any>;
};

const inputClass =
  "w-full bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] focus:outline-none rounded-lg px-4 py-2.5 text-sm text-[#1a1a2e] placeholder:text-[#b0abc0] transition-colors";

const labelClass = "block text-xs font-medium text-[#7c7893] mb-1.5";

function isAuto(value: string | undefined): boolean {
  return !value || value === "auto";
}

type AutoFieldKey = "phone" | "email" | "maps";

export default function LinksEditor({ hotelId, links, contactInfo }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const [form, setForm] = useState({
    booking: links.booking ?? "",
    whatsapp: links.whatsapp ?? "",
    instagram: links.instagram ?? "",
    facebook: links.facebook ?? "",
    twitter: links.twitter ?? "",
    phone: links.phone ?? "",
    email: links.email ?? "",
    maps: links.maps ?? "",
  });

  // Override toggles: if value is "auto" or empty, we treat as auto (derived from contactInfo)
  const [overrides, setOverrides] = useState<Record<AutoFieldKey, boolean>>({
    phone: !isAuto(links.phone),
    email: !isAuto(links.email),
    maps: !isAuto(links.maps),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaveStatus("idle");
  }

  function toggleOverride(key: AutoFieldKey) {
    setOverrides((prev) => {
      const next = !prev[key];
      if (!next) {
        // switching back to auto — clear the stored override value
        setForm((f) => ({ ...f, [key]: "" }));
      }
      setSaveStatus("idle");
      return { ...prev, [key]: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");

    const linksPayload: Record<string, string> = {};

    if (form.booking) linksPayload.booking = form.booking;
    if (form.whatsapp) linksPayload.whatsapp = form.whatsapp;
    if (form.instagram) linksPayload.instagram = form.instagram;
    if (form.facebook) linksPayload.facebook = form.facebook;
    if (form.twitter) linksPayload.twitter = form.twitter;

    // auto-derived fields
    linksPayload.phone = overrides.phone && form.phone ? form.phone : "auto";
    linksPayload.email = overrides.email && form.email ? form.email : "auto";
    linksPayload.maps = overrides.maps && form.maps ? form.maps : "auto";

    try {
      const res = await fetch(`/api/hotels/${hotelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: linksPayload }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[LinksEditor] PUT failed", body);
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
      router.refresh();
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      console.error("[LinksEditor] save error", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  const phone = contactInfo?.phone as string | undefined;
  const email = contactInfo?.email as string | undefined;
  const address = contactInfo?.address as string | undefined;

  return (
    <div className="space-y-6">
      {/* Booking & Contact */}
      <div>
        <p className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider mb-3">
          Booking &amp; Contact
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Booking URL</label>
            <input
              type="url"
              name="booking"
              value={form.booking}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://booking.com/hotel/your-hotel"
            />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input
              type="text"
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              className={inputClass}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div>
        <p className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider mb-3">
          Social Media
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Instagram</label>
            <input
              type="url"
              name="instagram"
              value={form.instagram}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://instagram.com/yourhotel"
            />
          </div>
          <div>
            <label className={labelClass}>Facebook</label>
            <input
              type="url"
              name="facebook"
              value={form.facebook}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://facebook.com/yourhotel"
            />
          </div>
          <div>
            <label className={labelClass}>Twitter / X</label>
            <input
              type="url"
              name="twitter"
              value={form.twitter}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://x.com/yourhotel"
            />
          </div>
        </div>
      </div>

      {/* Auto-derived */}
      <div>
        <p className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider mb-3">
          Auto-Derived (from Contact Info)
        </p>
        <div className="space-y-3">
          {/* Phone */}
          <AutoField
            label="Phone"
            fieldKey="phone"
            autoLabel={phone ? `Auto: tel:${phone}` : "Auto: (no phone set)"}
            isOverridden={overrides.phone}
            value={form.phone}
            onChange={handleChange}
            onToggle={() => toggleOverride("phone")}
            placeholder="tel:+919876543210"
          />

          {/* Email */}
          <AutoField
            label="Email"
            fieldKey="email"
            autoLabel={email ? `Auto: mailto:${email}` : "Auto: (no email set)"}
            isOverridden={overrides.email}
            value={form.email}
            onChange={handleChange}
            onToggle={() => toggleOverride("email")}
            placeholder="mailto:info@yourhotel.com"
          />

          {/* Maps */}
          <AutoField
            label="Maps"
            fieldKey="maps"
            autoLabel={address ? "Auto: Google Maps" : "Auto: (no address set)"}
            isOverridden={overrides.maps}
            value={form.maps}
            onChange={handleChange}
            onToggle={() => toggleOverride("maps")}
            placeholder="https://maps.google.com/?q=your+hotel"
          />
        </div>
      </div>

      {/* Save row */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7c5cbf]/10 hover:bg-[#7c5cbf]/20 border border-[#7c5cbf]/30 text-[#7c5cbf] text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Save Links
            </>
          )}
        </button>

        {saveStatus === "saved" && (
          <span className="text-xs text-[#0fa886] font-medium">Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="text-xs text-[#e85d45]">Failed to save. Try again.</span>
        )}
      </div>
    </div>
  );
}

// ─── AutoField sub-component ─────────────────────────────

interface AutoFieldProps {
  label: string;
  fieldKey: AutoFieldKey;
  autoLabel: string;
  isOverridden: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  placeholder: string;
}

function AutoField({
  label,
  fieldKey,
  autoLabel,
  isOverridden,
  value,
  onChange,
  onToggle,
  placeholder,
}: AutoFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className={labelClass.replace(" mb-1.5", "")}>{label}</span>
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
              isOverridden
                ? "bg-[#7c5cbf]/10 border-[#7c5cbf]/30 text-[#7c5cbf]"
                : "bg-[#f0eef5] border-[#e2dfe8] text-[#7c7893] hover:border-[#7c5cbf]/30 hover:text-[#7c5cbf]"
            }`}
          >
            {isOverridden ? "Override on" : "Override"}
          </button>
        </div>

        {isOverridden ? (
          <input
            type="text"
            name={fieldKey}
            value={value}
            onChange={onChange}
            className={inputClass}
            placeholder={placeholder}
          />
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0eef5] border border-[#e2dfe8] text-xs text-[#7c7893]">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0 text-[#b0abc0]">
              <path
                fillRule="evenodd"
                d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                clipRule="evenodd"
              />
            </svg>
            {autoLabel}
          </div>
        )}
      </div>
    </div>
  );
}
