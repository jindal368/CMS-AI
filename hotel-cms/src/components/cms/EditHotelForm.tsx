"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ContactInfo = {
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
};

type SeoConfig = {
  title?: string;
  description?: string;
};

type HotelData = {
  id: string;
  name: string;
  category: string;
  contactInfo: ContactInfo;
  seoConfig: SeoConfig;
};

type Props = {
  hotel: HotelData;
};

const categoryColors: Record<string, string> = {
  luxury: "text-[#d49a12] bg-[#d49a12]/10 border-[#d49a12]/20",
  boutique: "text-[#7c5cbf] bg-[#7c5cbf]/10 border-[#7c5cbf]/20",
  business: "text-[#3b7dd8] bg-[#3b7dd8]/10 border-[#3b7dd8]/20",
  resort: "text-[#0fa886] bg-[#0fa886]/10 border-[#0fa886]/20",
  budget: "text-muted bg-[#7c7893]/10 border-[#7c7893]/20",
};

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-elevated border border-border focus:border-[#7c5cbf] focus:outline-none text-foreground text-sm placeholder:text-muted transition-colors";

const labelClass = "block text-xs font-medium text-muted mb-1";

export default function EditHotelForm({ hotel }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const [form, setForm] = useState({
    name: hotel.name,
    category: hotel.category,
    phone: hotel.contactInfo.phone ?? "",
    email: hotel.contactInfo.email ?? "",
    address: hotel.contactInfo.address ?? "",
    city: hotel.contactInfo.city ?? "",
    country: hotel.contactInfo.country ?? "",
    seoTitle: hotel.seoConfig.title ?? "",
    seoDescription: hotel.seoConfig.description ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleCancel() {
    setForm({
      name: hotel.name,
      category: hotel.category,
      phone: hotel.contactInfo.phone ?? "",
      email: hotel.contactInfo.email ?? "",
      address: hotel.contactInfo.address ?? "",
      city: hotel.contactInfo.city ?? "",
      country: hotel.contactInfo.country ?? "",
      seoTitle: hotel.seoConfig.title ?? "",
      seoDescription: hotel.seoConfig.description ?? "",
    });
    setSaveStatus("idle");
    setMode("view");
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");

    const payload: Record<string, unknown> = {};

    if (form.name !== hotel.name) payload.name = form.name;
    if (form.category !== hotel.category) payload.category = form.category;

    const origContact = hotel.contactInfo;
    const contactChanged =
      form.phone !== (origContact.phone ?? "") ||
      form.email !== (origContact.email ?? "") ||
      form.address !== (origContact.address ?? "") ||
      form.city !== (origContact.city ?? "") ||
      form.country !== (origContact.country ?? "");

    if (contactChanged) {
      payload.contactInfo = {
        ...(form.phone && { phone: form.phone }),
        ...(form.email && { email: form.email }),
        ...(form.address && { address: form.address }),
        ...(form.city && { city: form.city }),
        ...(form.country && { country: form.country }),
      };
    }

    const origSeo = hotel.seoConfig;
    const seoChanged =
      form.seoTitle !== (origSeo.title ?? "") ||
      form.seoDescription !== (origSeo.description ?? "");

    if (seoChanged) {
      payload.seoConfig = {
        ...(form.seoTitle && { title: form.seoTitle }),
        ...(form.seoDescription && { description: form.seoDescription }),
      };
    }

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      setMode("view");
      return;
    }

    try {
      const res = await fetch(`/api/hotels/${hotel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[EditHotelForm] PUT failed", body);
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
      router.refresh();
      setMode("view");
    } catch (err) {
      console.error("[EditHotelForm] save error", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  const catColor = categoryColors[form.category] ?? categoryColors.budget;

  if (mode === "view") {
    const contact = hotel.contactInfo;
    return (
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-elevated flex items-center justify-center text-xl font-bold text-[#e85d45] shrink-0">
            {hotel.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-foreground">
                {hotel.name}
              </h2>
              <span
                className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${categoryColors[hotel.category] ?? categoryColors.budget}`}
              >
                {hotel.category}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              {contact?.email && (
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {contact.email}
                </span>
              )}
              {contact?.phone && (
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {contact.phone}
                </span>
              )}
              {contact?.address && (
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {contact.address}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setMode("edit")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated hover:bg-border border border-border text-foreground text-xs font-medium transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Edit Hotel</h3>
        <div className="flex items-center gap-2">
          {saveStatus === "error" && (
            <span className="text-xs text-[#e85d45]">Failed to save. Try again.</span>
          )}
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-elevated hover:bg-border border border-border text-muted hover:text-foreground text-xs font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c5cbf]/10 hover:bg-[#7c5cbf]/20 border border-[#7c5cbf]/30 text-[#7c5cbf] text-xs font-medium transition-colors disabled:opacity-50"
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
                Save changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Core info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelClass}>Hotel name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Grand Hotel"
          />
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={inputClass}
          >
            {["luxury", "boutique", "business", "resort", "budget"].map((c) => (
              <option key={c} value={c} className="bg-elevated capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          {form.category && (
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium capitalize border mt-1.5 ${catColor}`}
            >
              {form.category}
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="info@hotel.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>Address</label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              className={inputClass}
              placeholder="123 Main Street"
            />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              className={inputClass}
              placeholder="New York"
            />
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>Country</label>
            <input
              id="country"
              name="country"
              type="text"
              value={form.country}
              onChange={handleChange}
              className={inputClass}
              placeholder="United States"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">SEO</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="seoTitle" className={labelClass}>SEO title</label>
            <input
              id="seoTitle"
              name="seoTitle"
              type="text"
              value={form.seoTitle}
              onChange={handleChange}
              className={inputClass}
              placeholder="Grand Hotel — Luxury Stays"
            />
          </div>
          <div>
            <label htmlFor="seoDescription" className={labelClass}>SEO description</label>
            <textarea
              id="seoDescription"
              name="seoDescription"
              value={form.seoDescription}
              onChange={handleChange}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="A short description shown in search engine results…"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
