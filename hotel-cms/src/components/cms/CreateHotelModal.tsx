"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/ui/Portal";

interface CreateHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "idle" | "creating-hotel" | "creating-pages" | "done" | "error";

const DEFAULT_PAGES = [
  { slug: "/", pageType: "home" as const, sortOrder: 0 },
  { slug: "rooms", pageType: "rooms" as const, sortOrder: 1 },
  { slug: "gallery", pageType: "gallery" as const, sortOrder: 2 },
  { slug: "contact", pageType: "contact" as const, sortOrder: 3 },
];

export default function CreateHotelModal({ isOpen, onClose }: CreateHotelModalProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<"luxury" | "boutique" | "business" | "resort" | "budget">("boutique");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pagesCreated, setPagesCreated] = useState(0);

  const isLoading = step === "creating-hotel" || step === "creating-pages";

  function resetForm() {
    setName("");
    setCategory("boutique");
    setPhone("");
    setEmail("");
    setAddress("");
    setCity("");
    setCountry("");
    setStep("idle");
    setErrorMsg("");
    setPagesCreated(0);
  }

  function handleClose() {
    if (isLoading) return;
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setStep("creating-hotel");
    setErrorMsg("");

    try {
      // Step 1: Create hotel
      const hotelRes = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          contactInfo: {
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            city: city.trim() || undefined,
            country: country.trim() || undefined,
          },
        }),
      });

      if (!hotelRes.ok) {
        const body = await hotelRes.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to create hotel");
      }

      const hotelData = await hotelRes.json();
      const newHotel = hotelData.data ?? hotelData;

      // Step 2: Create default pages
      setStep("creating-pages");
      setPagesCreated(0);

      for (let i = 0; i < DEFAULT_PAGES.length; i++) {
        const p = DEFAULT_PAGES[i];
        const pageRes = await fetch("/api/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotelId: newHotel.id,
            slug: p.slug,
            pageType: p.pageType,
            sortOrder: p.sortOrder,
          }),
        });

        if (!pageRes.ok) {
          // Non-fatal: log but continue
          console.warn(`[CreateHotelModal] Failed to create page ${p.slug}`);
        }

        setPagesCreated(i + 1);
      }

      setStep("done");

      // Brief pause so the user sees "Done!" before navigating
      await new Promise((r) => setTimeout(r, 600));

      resetForm();
      onClose();
      router.push(`/hotels/${newHotel.id}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
      setStep("error");
    }
  }

  if (!isOpen) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-elevated border border-border focus:border-[#7c5cbf] focus:outline-none text-foreground text-sm placeholder-muted transition-colors";
  const labelClass = "block text-xs font-medium text-muted mb-1.5";

  const stepLabel =
    step === "creating-hotel"
      ? "Creating hotel..."
      : step === "creating-pages"
        ? `Creating pages... (${pagesCreated}/${DEFAULT_PAGES.length})`
        : step === "done"
          ? "Done!"
          : null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        aria-modal="true"
        role="dialog"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 animate-fade"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal card */}
        <div className="relative z-10 w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 animate-modal max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Create Hotel</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
            {/* Name + Category row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="hotel-name" className={labelClass}>
                  Hotel name <span className="text-[#e85d45]">*</span>
                </label>
                <input
                  id="hotel-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="The Grand Horizon"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="hotel-category" className={labelClass}>
                  Category
                </label>
                <select
                  id="hotel-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                  className={inputClass}
                  disabled={isLoading}
                >
                  <option value="luxury">Luxury</option>
                  <option value="boutique">Boutique</option>
                  <option value="business">Business</option>
                  <option value="resort">Resort</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hotel-phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="hotel-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="hotel-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="hotel-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@hotel.com"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="hotel-address" className={labelClass}>
                Address
              </label>
              <input
                id="hotel-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Ocean Drive"
                className={inputClass}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hotel-city" className={labelClass}>
                  City
                </label>
                <input
                  id="hotel-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Miami"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="hotel-country" className={labelClass}>
                  Country
                </label>
                <input
                  id="hotel-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="United States"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error */}
            {step === "error" && errorMsg && (
              <p className="text-sm text-[#e85d45] bg-[#e85d45]/10 border border-[#e85d45]/20 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            {/* Progress */}
            {stepLabel && (
              <div className="flex items-center gap-2 text-sm text-[#0fa886]">
                {step !== "done" && (
                  <svg
                    className="w-4 h-4 animate-spin shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
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
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {step === "done" && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{stepLabel}</span>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#e85d45] hover:bg-[#f5866e] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
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
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Hotel"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
