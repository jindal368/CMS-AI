import Link from "next/link";
import { prisma } from "@/lib/db";
import HotelActions, { HotelDeleteButton } from "@/components/cms/HotelActions";

export const dynamic = 'force-dynamic';

async function getHotels() {
  return prisma.hotel.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { pages: true, rooms: true, media: true },
      },
    },
  });
}

const categoryColors: Record<string, { text: string; bg: string; dot: string }> = {
  luxury: { text: "text-[#d49a12]", bg: "bg-[#d49a12]/10", dot: "bg-[#d49a12]" },
  boutique: { text: "text-[#7c5cbf]", bg: "bg-[#7c5cbf]/10", dot: "bg-[#7c5cbf]" },
  business: { text: "text-[#3b7dd8]", bg: "bg-[#3b7dd8]/10", dot: "bg-[#3b7dd8]" },
  resort: { text: "text-[#0fa886]", bg: "bg-[#0fa886]/10", dot: "bg-[#0fa886]" },
  budget: { text: "text-[#7c7893]", bg: "bg-[#7c7893]/10", dot: "bg-[#7c7893]" },
};

const gradientPairs = [
  { c1: "#e85d45", c2: "#d49a12" },
  { c1: "#3b7dd8", c2: "#7c5cbf" },
  { c1: "#0fa886", c2: "#d49a12" },
];

export default async function HotelsPage() {
  const hotels = await getHotels();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Hotels</h2>
          <p className="text-sm text-[#7c7893] mt-0.5">
            {hotels.length} {hotels.length === 1 ? "property" : "properties"} registered
          </p>
        </div>
        <HotelActions />
      </div>

      {/* Hotels grid */}
      {hotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card-static rounded-xl text-center">
          <div className="w-16 h-16 rounded-full bg-[#f0eef5] flex items-center justify-center mb-4">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-8 h-8 text-[#7c7893]"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[#1a1a2e] mb-1">
            No hotels yet
          </h3>
          <p className="text-sm text-[#7c7893] mb-4">
            Create your first hotel property to get started
          </p>
          <HotelActions />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {hotels.map((hotel, index) => {
            const colors = categoryColors[hotel.category] ?? categoryColors.budget;
            const contactInfo = hotel.contactInfo as Record<string, string>;
            const grad = gradientPairs[index % gradientPairs.length];
            return (
              <Link
                key={hotel.id}
                href={`/hotels/${hotel.id}`}
                className="group relative block glass-card rounded-xl p-5"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-base font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${grad.c1}, ${grad.c2})`,
                        boxShadow: `0 2px 8px ${grad.c1}4d`,
                      }}
                    >
                      {hotel.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#1a1a2e] group-hover:text-white transition-colors line-clamp-1">
                        {hotel.name}
                      </h3>
                      {contactInfo?.address && (
                        <p className="text-xs text-[#7c7893] line-clamp-1 mt-0.5">
                          {contactInfo.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${colors.text} ${colors.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {hotel.category}
                    </span>
                    <HotelDeleteButton hotelId={hotel.id} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#e2dfe8]">
                  <div className="text-center">
                    <p className="text-base font-bold text-[#1a1a2e] tabular-nums">
                      {hotel._count.pages}
                    </p>
                    <p className="text-xs text-[#7c7893]">Pages</p>
                  </div>
                  <div className="text-center border-x border-[#e2dfe8]">
                    <p className="text-base font-bold text-[#1a1a2e] tabular-nums">
                      {hotel._count.rooms}
                    </p>
                    <p className="text-xs text-[#7c7893]">Rooms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-[#1a1a2e] tabular-nums">
                      {hotel._count.media}
                    </p>
                    <p className="text-xs text-[#7c7893]">Media</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
