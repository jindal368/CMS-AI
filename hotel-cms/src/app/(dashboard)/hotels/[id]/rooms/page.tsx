import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import HotelTabs from "@/components/hotel-tabs";
import RoomActions from "@/components/cms/RoomActions";

export const dynamic = 'force-dynamic';

interface RoomPricing {
  basePrice: number;
  currency: string;
}

async function getRooms(hotelId: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, name: true },
  });
  if (!hotel) return null;

  const rooms = await prisma.room.findMany({
    where: { hotelId },
    orderBy: { sortOrder: "asc" },
  });

  return { hotel, rooms };
}

function parsePricing(raw: unknown): RoomPricing | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  // Support both snake_case (legacy) and camelCase
  const basePrice = Number(p.basePrice ?? p.base_price ?? 0);
  const currency = String(p.currency ?? "");
  if (!currency) return null;
  return { basePrice, currency };
}

export default async function RoomsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const data = await getRooms(id);
  if (!data) notFound();
  const { hotel, rooms } = data;

  const serializedRooms = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    description: room.description ?? null,
    pricing: parsePricing(room.pricing),
    amenities: Array.isArray(room.amenities) ? (room.amenities as string[]) : [],
    maxGuests: room.maxGuests,
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
        <span className="text-[#1a1a2e]">Rooms</span>
      </nav>

      {/* Tab panel */}
      <div className="bg-[#ffffff] border border-[#e2dfe8] rounded-xl overflow-hidden">
        <div className="px-5 pt-4">
          <HotelTabs hotelId={id} />
        </div>

        <div className="p-5">
          <RoomActions hotelId={id} rooms={serializedRooms} />
        </div>
      </div>
    </div>
  );
}
