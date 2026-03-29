"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandThemeEditor from "@/components/cms/BrandThemeEditor";
import LockedSectionManager from "@/components/cms/LockedSectionManager";

interface LockedSection {
  id: string;
  label: string;
  position: "top" | "bottom";
  variant: string;
  props: Record<string, unknown>;
}

interface BrandPageClientProps {
  brandTheme: object | null;
  lockedSections: LockedSection[];
  customDomain: string | null;
}

export default function BrandPageClient({
  brandTheme,
  lockedSections,
  customDomain,
}: BrandPageClientProps) {
  const router = useRouter();
  const [domain, setDomain] = useState(customDomain ?? "");
  const [savingDomain, setSavingDomain] = useState(false);
  const [domainSaved, setDomainSaved] = useState(false);

  async function handleSaveDomain() {
    setSavingDomain(true);
    setDomainSaved(false);
    try {
      const res = await fetch("/api/brand/domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: domain.trim() || null }),
      });
      if (res.ok) {
        setDomainSaved(true);
        router.refresh();
      }
    } finally {
      setSavingDomain(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="animate-in">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Brand Governance</h2>
        <p className="text-sm text-muted mt-0.5">
          Manage organization-wide theme and locked page sections.
        </p>
      </div>

      {/* Organization Theme */}
      <div className="glass-card-static rounded-xl p-6 animate-in animate-in-delay-1">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-foreground">Organization Theme</h3>
          <p className="text-xs text-muted mt-0.5">
            Apply a consistent visual identity across all hotel websites.
          </p>
        </div>
        <BrandThemeEditor
          brandTheme={brandTheme}
          onSave={() => router.refresh()}
        />
      </div>

      {/* Locked Sections */}
      <div className="glass-card-static rounded-xl p-6 animate-in animate-in-delay-2">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-foreground">Locked Sections</h3>
          <p className="text-xs text-muted mt-0.5">
            Define sections that are pinned to the top or bottom of every hotel page.
          </p>
        </div>
        <LockedSectionManager
          lockedSections={lockedSections}
          onUpdate={() => router.refresh()}
        />
      </div>

      {/* Custom Domain */}
      <div className="glass-card-static rounded-xl p-6 animate-in animate-in-delay-3">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-foreground">Custom Domain</h3>
          <p className="text-xs text-muted mt-0.5">
            Connect your domain to serve hotel websites publicly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setDomainSaved(false);
            }}
            placeholder="yourdomain.com"
            className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none transition-colors"
            style={{
              borderColor: "rgba(124,120,147,0.25)",
              background: "rgba(255,255,255,0.6)",
              color: "var(--foreground)",
            }}
          />
          <button
            onClick={handleSaveDomain}
            disabled={savingDomain}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 text-white shrink-0"
            style={{ background: "#0fa886" }}
          >
            {savingDomain && (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="60"
                  strokeDashoffset="20"
                />
              </svg>
            )}
            Save Domain
          </button>
        </div>
        {domainSaved && (
          <p className="text-xs mt-2" style={{ color: "#0fa886" }}>
            Domain saved successfully.
          </p>
        )}
      </div>
    </div>
  );
}
