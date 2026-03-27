import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import HotelTabs from "@/components/hotel-tabs";
import MediaActions, { type SerializedMediaAsset } from "@/components/cms/MediaActions";

export const dynamic = 'force-dynamic';

async function getMedia(hotelId: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, name: true },
  });
  if (!hotel) return null;

  const media = await prisma.mediaAsset.findMany({
    where: { hotelId },
    orderBy: { createdAt: "desc" },
  });

  return { hotel, media };
}

export default async function MediaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const data = await getMedia(id);
  if (!data) notFound();
  const { hotel, media } = data;

  // Serialize: convert Dates to strings and parse JSON fields into plain objects
  const serializedMedia: SerializedMediaAsset[] = media.map((asset) => ({
    id: asset.id,
    url: asset.url,
    altText: asset.altText,
    tags: Array.isArray(asset.tags) ? (asset.tags as string[]) : [],
    variants:
      asset.variants && typeof asset.variants === "object" && !Array.isArray(asset.variants)
        ? (asset.variants as Record<string, string>)
        : {},
    fileSize: asset.fileSize,
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
        <span className="text-[#1a1a2e]">Media</span>
      </nav>

      {/* Tab panel */}
      <div className="bg-[#ffffff] border border-[#e2dfe8] rounded-xl overflow-hidden">
        <div className="px-5 pt-4">
          <HotelTabs hotelId={id} />
        </div>

        <div className="p-5">
          <MediaActions hotelId={id} media={serializedMedia} />
        </div>
      </div>
    </div>
  );
}
