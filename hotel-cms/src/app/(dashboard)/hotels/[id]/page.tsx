import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import HotelTabs from "@/components/hotel-tabs";
import PageActions from "@/components/cms/PageActions";
import EditHotelForm from "@/components/cms/EditHotelForm";
import DeleteHotelButton from "@/components/cms/DeleteHotelButton";

export const dynamic = 'force-dynamic';

async function getHotel(id: string) {
  return prisma.hotel.findUnique({
    where: { id },
    include: {
      pages: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { sections: true } } },
      },
      _count: { select: { rooms: true, media: true, versions: true } },
    },
  });
}


export default async function HotelPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const hotel = await getHotel(id);

  if (!hotel) notFound();

  // Serialize Prisma model for client components (Dates converted to ISO strings upstream)
  const serializedHotel = {
    id: hotel.id,
    name: hotel.name,
    category: hotel.category,
    contactInfo: (hotel.contactInfo ?? {}) as {
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      country?: string;
    },
    seoConfig: (hotel.seoConfig ?? {}) as {
      title?: string;
      description?: string;
    },
  };

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
        <span className="text-[#1a1a2e]">{hotel.name}</span>
      </nav>

      {/* Hotel header card */}
      <div className="glass-card-static rounded-xl p-6">
        {/* Hotel identity row */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-base font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #e85d45, #d49a12)",
              boxShadow: "0 2px 8px #e85d454d",
            }}
          >
            {hotel.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a2e] leading-tight">{hotel.name}</h2>
            <p className="text-xs text-[#7c7893] capitalize">{hotel.category}</p>
          </div>
        </div>

        {/* Quick stats + delete row */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div className="flex gap-4">
            {[
              { label: "Pages", value: hotel.pages.length },
              { label: "Rooms", value: hotel._count.rooms },
              { label: "Media", value: hotel._count.media },
              { label: "Versions", value: hotel._count.versions },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold text-[#1a1a2e]/80 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-[#7c7893]/70">{stat.label}</p>
              </div>
            ))}
          </div>
          <DeleteHotelButton hotelId={hotel.id} hotelName={hotel.name} />
        </div>

        {/* Edit / view form */}
        <EditHotelForm hotel={serializedHotel} />
      </div>

      {/* Tab navigation */}
      <div className="glass-card-static rounded-xl overflow-hidden">
        <div className="px-5 pt-4">
          <HotelTabs hotelId={id} />
        </div>

        {/* Pages tab content */}
        <div className="p-5">
          <PageActions
            hotelId={id}
            pages={hotel.pages.map((page) => ({
              id: page.id,
              hotelId: page.hotelId,
              slug: page.slug,
              locale: page.locale,
              pageType: page.pageType,
              sortOrder: page.sortOrder,
              metaTags: page.metaTags as Record<string, string> | null,
              createdAt: page.createdAt.toISOString(),
              updatedAt: page.updatedAt.toISOString(),
              _count: { sections: page._count.sections },
            }))}
          />
        </div>
      </div>
    </div>
  );
}
