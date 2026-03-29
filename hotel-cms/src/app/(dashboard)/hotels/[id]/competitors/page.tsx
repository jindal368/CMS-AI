import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/db";
import CompetitorsManager from "@/components/cms/CompetitorsManager";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage(props: {
  params: Promise<{ id: string }>;
}) {
  await getSessionOrRedirect();

  const { id } = await props.params;

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!hotel) notFound();

  const competitors = await prisma.competitor.findMany({
    where: { hotelId: id },
    include: {
      scans: {
        orderBy: { scannedAt: "desc" },
        take: 1,
      },
    },
  });

  // Serialize: convert all Date objects to ISO strings
  const serializedCompetitors = competitors.map((c) => ({
    id: c.id,
    hotelId: c.hotelId,
    name: c.name,
    url: c.url,
    lastScanAt: c.lastScanAt ? c.lastScanAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    latestScan: c.scans[0]
      ? {
          id: c.scans[0].id,
          changes: c.scans[0].changes as unknown[],
          insights: c.scans[0].insights as unknown[],
          scannedAt: c.scans[0].scannedAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#7c7893]">
        <Link href="/hotels" className="hover:text-[#1a1a2e] transition-colors">
          Hotels
        </Link>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <Link
          href={`/hotels/${id}`}
          className="hover:text-[#1a1a2e] transition-colors"
        >
          {hotel.name}
        </Link>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[#1a1a2e]">Competitors</span>
      </nav>

      <CompetitorsManager
        hotelId={id}
        competitors={serializedCompetitors}
        hotelName={hotel.name}
      />
    </div>
  );
}
