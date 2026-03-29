import Link from "next/link";

export interface RoomData {
  id: string;
  name: string;
  description?: string;
  pricing?: { basePrice: number; currency: string };
  amenities?: string[];
  images?: string[];
  maxGuests?: number;
}

export interface RoomsGridProps {
  columns?: number;
  showPrice?: boolean;
  showAmenities?: boolean;
  cta?: string;
  ctaLink?: string;
  rooms?: RoomData[];
}

const colMap: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const amenityIcons: Record<string, string> = {
  wifi: "⚡",
  pool: "🏊",
  gym: "🏋",
  spa: "🧖",
  parking: "🅿",
  breakfast: "🍳",
  "air conditioning": "❄",
  balcony: "🌿",
  "ocean view": "🌊",
  "city view": "🏙",
  "king bed": "🛏",
  bathtub: "🛁",
  minibar: "🍾",
};

export default function RoomsGrid({
  columns = 3,
  showPrice = true,
  showAmenities = true,
  cta = "View Room",
  ctaLink = "#",
  rooms = [],
}: RoomsGridProps) {
  const gridCols = colMap[columns] ?? colMap[3];

  const placeholderRooms: RoomData[] = rooms.length
    ? rooms
    : [
        {
          id: "1",
          name: "Deluxe King Room",
          description: "Spacious room with panoramic city views and premium amenities.",
          pricing: { basePrice: 320, currency: "USD" },
          amenities: ["wifi", "king bed", "city view", "minibar"],
          images: [],
          maxGuests: 2,
        },
        {
          id: "2",
          name: "Superior Suite",
          description: "Elegant suite featuring a separate living area and private terrace.",
          pricing: { basePrice: 580, currency: "USD" },
          amenities: ["wifi", "balcony", "bathtub", "breakfast"],
          images: [],
          maxGuests: 3,
        },
        {
          id: "3",
          name: "Penthouse Suite",
          description: "The ultimate luxury experience with 360° views and butler service.",
          pricing: { basePrice: 1200, currency: "USD" },
          amenities: ["wifi", "pool", "spa", "ocean view"],
          images: [],
          maxGuests: 4,
        },
      ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Accommodations
          </span>
          <h2 className="text-4xl font-light text-stone-900 mt-3 tracking-tight">
            Our Rooms &amp; Suites
          </h2>
          <div className="w-12 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
          {placeholderRooms.map((room) => (
            <article
              key={room.id}
              className="group bg-white border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-[4/3] bg-stone-100">
                {room.images?.[0] ? (
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                    <span className="text-stone-400 text-4xl">🏨</span>
                  </div>
                )}
                {showPrice && room.pricing && (
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-stone-800">
                    From {room.pricing.currency} {room.pricing.basePrice.toLocaleString()}
                    <span className="text-stone-400 font-normal">/night</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-stone-900 mb-2">{room.name}</h3>
                {room.description && (
                  <p className="text-sm text-stone-500 leading-relaxed mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}

                {showAmenities && room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {room.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 px-2 py-1 rounded-sm border border-stone-100"
                      >
                        {amenityIcons[amenity.toLowerCase()] && (
                          <span>{amenityIcons[amenity.toLowerCase()]}</span>
                        )}
                        <span className="capitalize">{amenity}</span>
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  href={ctaLink || "#"}
                  className="inline-block text-xs tracking-[0.15em] uppercase text-stone-800 border-b border-stone-300 pb-0.5 hover:border-stone-800 transition-colors duration-200 font-medium"
                >
                  {cta} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
