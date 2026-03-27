import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import HotelTabs from "@/components/hotel-tabs";
import VersionActions from "@/components/cms/VersionActions";

export const dynamic = 'force-dynamic';

async function getVersions(hotelId: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, name: true },
  });
  if (!hotel) return null;

  const versions = await prisma.schemaVersion.findMany({
    where: { hotelId },
    orderBy: { versionNum: "desc" },
    take: 20,
  });

  return { hotel, versions };
}

export default async function VersionsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const data = await getVersions(id);
  if (!data) notFound();
  const { hotel, versions } = data;

  const serializedVersions = versions.map((v) => ({
    id: v.id,
    versionNum: v.versionNum,
    modelTier: v.modelTier,
    modelUsed: v.modelUsed,
    description: v.description ?? "",
    status: v.status,
    createdAt: v.createdAt.toISOString(),
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
        <span className="text-[#1a1a2e]">Versions</span>
      </nav>

      {/* Tab panel */}
      <div className="bg-[#ffffff] border border-[#e2dfe8] rounded-xl overflow-hidden">
        <div className="px-5 pt-4">
          <HotelTabs hotelId={id} />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-[#1a1a2e]">
              Version History{" "}
              <span className="text-[#7c7893] font-normal">
                ({versions.length})
              </span>
            </h3>
          </div>

          <VersionActions hotelId={id} versions={serializedVersions} />
        </div>
      </div>
    </div>
  );
}
