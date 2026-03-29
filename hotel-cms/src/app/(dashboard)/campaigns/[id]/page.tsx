import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionOrRedirect } from "@/lib/auth";
import CampaignActions from "./CampaignActions";

export const dynamic = "force-dynamic";

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

const localeLabels: Record<string, string> = {
  en: "EN",
  fr: "FR",
  de: "DE",
  es: "ES",
  it: "IT",
  ja: "JA",
  zh: "ZH",
  ar: "AR",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function CampaignDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { user } = await getSessionOrRedirect();

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });

  if (!campaign || campaign.orgId !== user.orgId) {
    notFound();
  }

  const createdSections = campaign.createdSections as Array<{
    hotelId: string;
    sectionId: string;
    pageId: string;
    locale: string;
  }>;

  // Fetch hotel names for deployed sections
  const hotelIds = [...new Set(createdSections.map((s) => s.hotelId))];
  const hotels =
    hotelIds.length > 0
      ? await prisma.hotel.findMany({
          where: { id: { in: hotelIds } },
          select: { id: true, name: true },
        })
      : [];

  const hotelNameById: Record<string, string> = {};
  for (const h of hotels) {
    hotelNameById[h.id] = h.name;
  }

  const badge = statusBadge[campaign.status as string] ?? statusBadge.ended;

  const serializedCampaign = {
    id: campaign.id,
    title: campaign.title,
    brief: campaign.brief,
    status: campaign.status as string,
    createdByName: campaign.createdBy.name,
    createdAt: campaign.createdAt.toISOString(),
    createdSections,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#7c7893]">
        <Link href="/campaigns" className="hover:text-[#1a1a2e] transition-colors">
          Campaigns
        </Link>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[#1a1a2e] truncate max-w-xs">{campaign.title}</span>
      </nav>

      {/* Header card */}
      <div className="glass-card-static rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h1 className="text-xl font-bold text-[#1a1a2e]">{campaign.title}</h1>
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${badge.text} ${badge.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-[#7c7893] leading-relaxed">{campaign.brief}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#e2dfe8]">
          <p className="text-xs text-[#7c7893]">
            Created by{" "}
            <span className="font-medium text-[#1a1a2e]">{campaign.createdBy.name}</span>{" "}
            on {formatDate(campaign.createdAt.toISOString())}
          </p>
        </div>
      </div>

      {/* Actions area */}
      <CampaignActions
        campaign={serializedCampaign}
        hotelNameById={hotelNameById}
        localeLabels={localeLabels}
      />
    </div>
  );
}
