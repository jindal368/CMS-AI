"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreatedSection {
  hotelId: string;
  sectionId: string;
  pageId: string;
  locale: string;
}

interface CampaignActionsProps {
  campaign: {
    id: string;
    title: string;
    status: string;
    createdSections: CreatedSection[];
  };
  hotelNameById: Record<string, string>;
  localeLabels: Record<string, string>;
}

export default function CampaignActions({
  campaign,
  hotelNameById,
  localeLabels,
}: CampaignActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLaunch() {
    setLoading(true);
    setResultMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/launch`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to launch campaign");
      }
      const { deployed, failed } = body.data ?? body;
      setResultMsg(
        `Deployed to ${deployed} hotel${deployed === 1 ? "" : "s"}.${failed > 0 ? ` ${failed} failed.` : ""}`
      );
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    const confirmed = window.confirm(
      "Are you sure you want to end this campaign? All campaign sections will be removed from hotel pages."
    );
    if (!confirmed) return;

    setLoading(true);
    setResultMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/end`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to end campaign");
      }
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  if (campaign.status === "draft") {
    return (
      <div className="glass-card-static rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#1a1a2e] mb-1">Ready to deploy</h2>
          <p className="text-xs text-[#7c7893]">
            Launching will generate AI-powered promotional sections and inject them into your
            target hotel homepages.
          </p>
        </div>

        {resultMsg && (
          <p className="text-sm text-[#0fa886] bg-[#0fa886]/10 border border-[#0fa886]/20 rounded-lg px-3 py-2">
            {resultMsg}
          </p>
        )}
        {errorMsg && (
          <p className="text-sm text-[#e85d45] bg-[#e85d45]/10 border border-[#e85d45]/20 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        <button
          type="button"
          onClick={handleLaunch}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-opacity shadow-lg shadow-[#e85d45]/30 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
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
              Deploying...
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Launch Campaign
            </>
          )}
        </button>
      </div>
    );
  }

  if (campaign.status === "active") {
    return (
      <div className="glass-card-static rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/30">
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Deployed sections</h2>
          <p className="text-xs text-[#7c7893] mt-0.5">
            {campaign.createdSections.length} section
            {campaign.createdSections.length === 1 ? "" : "s"} injected across hotel pages
          </p>
        </div>

        {campaign.createdSections.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2dfe8]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[#7c7893]">Hotel</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[#7c7893]">Locale</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[#7c7893]">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaign.createdSections.map((section) => (
                <tr
                  key={section.sectionId}
                  className="border-b border-[#f0eef5] last:border-0"
                >
                  <td className="px-5 py-3 text-[#1a1a2e] font-medium">
                    {hotelNameById[section.hotelId] ?? section.hotelId}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#0fa886]/10 text-[#0fa886]">
                      {localeLabels[section.locale] ?? section.locale.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#0fa886]">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Live
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-6 text-sm text-[#7c7893]">No sections deployed yet.</p>
        )}

        <div className="px-5 py-4 border-t border-[#e2dfe8] flex items-center gap-4">
          {errorMsg && (
            <p className="text-sm text-[#e85d45] bg-[#e85d45]/10 border border-[#e85d45]/20 rounded-lg px-3 py-1.5 flex-1">
              {errorMsg}
            </p>
          )}
          <button
            type="button"
            onClick={handleEnd}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#e85d45] text-[#e85d45] hover:bg-[#e85d45]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
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
                Ending...
              </>
            ) : (
              "End Campaign"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ended
  return (
    <div className="glass-card-static rounded-xl p-6">
      <p className="text-sm text-[#7c7893] italic">Campaign ended.</p>
    </div>
  );
}
