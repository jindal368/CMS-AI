"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Portal from "@/components/ui/Portal";

interface Hotel {
  id: string;
  name: string;
}

interface InviteUserModalProps {
  hotels: Hotel[];
  onClose: () => void;
}

type Step = "form" | "submitting" | "success" | "error";

export default function InviteUserModal({ hotels, onClose }: InviteUserModalProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [selectedHotelIds, setSelectedHotelIds] = useState<string[]>([]);

  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const allSelected = hotels.length > 0 && selectedHotelIds.length === hotels.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedHotelIds([]);
    } else {
      setSelectedHotelIds(hotels.map((h) => h.id));
    }
  }

  function toggleHotel(id: string) {
    setSelectedHotelIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleDone() {
    onClose();
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    setStep("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role,
          hotelAccess: selectedHotelIds,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to invite user");
      }

      setTemporaryPassword(body.data?.temporaryPassword ?? body.temporaryPassword ?? "");
      setStep("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
      setStep("error");
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#f0eef5] border border-border focus:border-[#7c5cbf] focus:outline-none text-foreground text-sm placeholder-muted transition-colors";
  const labelClass = "block text-xs font-medium text-muted mb-1.5";

  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={step !== "submitting" ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground">Invite Team Member</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={step === "submitting"}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-[#f0eef5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

        {step === "success" ? (
          /* Success state — show password */
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #0fa886, #3b7dd8)" }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Invitation sent!</p>
                <p className="text-xs text-muted mt-0.5">
                  Share this temporary password with{" "}
                  <span className="font-medium text-foreground">{name}</span>. It
                  won&apos;t be shown again.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e85d45]/30 bg-[#e85d45]/5 p-4 space-y-3">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                Temporary Password
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm font-mono text-foreground bg-[#f0eef5] rounded-lg px-3 py-2 select-all break-all">
                  {temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    copied
                      ? "bg-[#0fa886]/10 text-[#0fa886]"
                      : "bg-[#f0eef5] text-muted hover:text-foreground"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#e85d45]">
                Ask the user to change their password after first login.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleDone}
                className="px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="invite-name" className={labelClass}>
                  Full name <span className="text-[#e85d45]">*</span>
                </label>
                <input
                  id="invite-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass}
                  disabled={step === "submitting"}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="invite-email" className={labelClass}>
                  Email <span className="text-[#e85d45]">*</span>
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@hotel.com"
                  className={inputClass}
                  disabled={step === "submitting"}
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="invite-role" className={labelClass}>
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className={inputClass}
                disabled={step === "submitting"}
              >
                <option value="editor">Editor — can create and edit content</option>
                <option value="viewer">Viewer — read-only access</option>
              </select>
            </div>

            {/* Hotel access */}
            {hotels.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass + " mb-0"}>Hotel access</label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-[#7c5cbf] hover:text-[#6349a3] transition-colors"
                    disabled={step === "submitting"}
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="rounded-xl border border-border bg-[#f0eef5]/40 divide-y divide-border max-h-48 overflow-y-auto">
                  {hotels.map((hotel) => {
                    const checked = selectedHotelIds.includes(hotel.id);
                    return (
                      <label
                        key={hotel.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#f0eef5]/60 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleHotel(hotel.id)}
                          disabled={step === "submitting"}
                          className="w-4 h-4 rounded border-border accent-[#7c5cbf]"
                        />
                        <span className="text-sm text-foreground">{hotel.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {selectedHotelIds.length === 0
                    ? "No hotels selected — user will have no hotel access."
                    : `${selectedHotelIds.length} of ${hotels.length} hotel${hotels.length !== 1 ? "s" : ""} selected.`}
                </p>
              </div>
            )}

            {/* Error */}
            {step === "error" && errorMsg && (
              <p className="text-sm text-[#e85d45] bg-[#e85d45]/10 border border-[#e85d45]/20 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={step === "submitting"}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={step === "submitting" || !email.trim() || !name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#e85d45]/20"
                style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
              >
                {step === "submitting" ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                    Inviting...
                  </>
                ) : (
                  "Send Invite"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </Portal>
  );
}
