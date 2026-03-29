import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionOrRedirect } from "@/lib/auth";
import CampaignsPageClient from "./CampaignsPageClient";

export const dynamic = "force-dynamic";

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const statusBadge: Record<string, { label: string; text: string; bg: string; dot: string }> = {
  draft: {
    label: "Draft",
    text: "text-[#7c5cbf]",
    bg: "bg-[#7c5cbf]/10",
    dot: "bg-[#7c5cbf]",
  },
  active: {
    label: "Active",
    text: "text-[#0fa886]",
    bg: "bg-[#0fa886]/10",
    dot: "bg-[#0fa886]",
  },
  ended: {
    label: "Ended",
    text: "text-[#7c7893]",
    bg: "bg-[#7c7893]/10",
    dot: "bg-[#7c7893]",
  },
};

export default async function CampaignsPage() {
  const { user } = await getSessionOrRedirect();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const [campaigns, hotels] = await Promise.all([
    prisma.campaign.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.hotel.findMany({
      where: { orgId: user.orgId },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedCampaigns = campaigns.map((c) => ({
    id: c.id,
    title: c.title,
    brief: c.brief,
    status: c.status as string,
    targetHotels: c.targetHotels as string[],
    createdSections: c.createdSections as Array<{ hotelId: string; sectionId: string; pageId: string; locale: string }>,
    createdByName: c.createdBy.name,
    createdAt: c.createdAt.toISOString(),
  }));

  const serializedHotels = hotels.map((h) => ({
    id: h.id,
    name: h.name,
    category: h.category as string,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Campaigns</h2>
          <p className="text-sm text-[#7c7893] mt-0.5">
            {serializedCampaigns.length}{" "}
            {serializedCampaigns.length === 1 ? "campaign" : "campaigns"}
          </p>
        </div>
        <CampaignsPageClient hotels={serializedHotels} />
      </div>

      {/* Campaign list */}
      {serializedCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card-static rounded-xl text-center">
          <div className="w-16 h-16 rounded-full bg-[#f0eef5] flex items-center justify-center mb-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-[#7c7893]">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6a1 1 0 00.804.98l10 2A1 1 0 0018 13V3zM4 7.5A1.5 1.5 0 002.5 9v2A1.5 1.5 0 004 12.5h1V7.5H4z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[#1a1a2e] mb-1">No campaigns yet</h3>
          <p className="text-sm text-[#7c7893] mb-4 max-w-sm">
            Create your first promotional campaign to syndicate content across all properties.
          </p>
          <CampaignsPageClient hotels={serializedHotels} showButtonOnly />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {serializedCampaigns.map((campaign) => {
            const badge = statusBadge[campaign.status] ?? statusBadge.ended;
            const briefTruncated =
              campaign.brief.length > 100
                ? campaign.brief.slice(0, 100) + "…"
                : campaign.brief;
            const targetLabel =
              campaign.targetHotels.length === 0
                ? "All hotels"
                : `${campaign.targetHotels.length} hotel${campaign.targetHotels.length === 1 ? "" : "s"}`;
            const deployedCount = campaign.createdSections.length;

            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="group block glass-card rounded-xl p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: title + brief */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <h3 className="text-sm font-semibold text-[#1a1a2e] group-hover:text-white transition-colors">
                        {campaign.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${badge.text} ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#7c7893] leading-relaxed line-clamp-2">
                      {briefTruncated}
                    </p>
                  </div>

                  {/* Right: meta stats */}
                  <div className="flex items-center gap-5 shrink-0 text-right">
                    <div>
                      <p className="text-sm font-bold text-[#1a1a2e] tabular-nums">{targetLabel}</p>
                      <p className="text-xs text-[#7c7893]">targeted</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1a1a2e] tabular-nums">{deployedCount}</p>
                      <p className="text-xs text-[#7c7893]">deployed</p>
                    </div>
                  </div>
                </div>

                {/* Footer row */}
                <div className="mt-3 pt-3 border-t border-[#e2dfe8] flex items-center justify-between text-xs text-[#7c7893]">
                  <span>Created by {campaign.createdByName}</span>
                  <span>{relativeDate(campaign.createdAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
