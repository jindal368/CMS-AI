export interface RoomPlan {
  name: string;
  price: string;
  currency: string;
  period: string;
  features: string[];
  highlighted: boolean;
  ctaText: string;
  ctaLink: string;
}

export interface PricingTableProps {
  title?: string;
  subtitle?: string;
  rooms?: RoomPlan[];
}

const defaultRooms: RoomPlan[] = [
  {
    name: "Standard",
    price: "150",
    currency: "USD",
    period: "night",
    features: ["Free Wi-Fi", "City View", "Breakfast", "24/7 Room Service"],
    highlighted: false,
    ctaText: "Book Now",
    ctaLink: "{{booking}}",
  },
  {
    name: "Deluxe",
    price: "280",
    currency: "USD",
    period: "night",
    features: [
      "Free Wi-Fi",
      "Ocean View",
      "Breakfast & Dinner",
      "Spa Access",
      "Airport Transfer",
    ],
    highlighted: true,
    ctaText: "Book Now",
    ctaLink: "{{booking}}",
  },
  {
    name: "Suite",
    price: "520",
    currency: "USD",
    period: "night",
    features: [
      "Free Wi-Fi",
      "Panoramic View",
      "All Meals",
      "Spa Access",
      "Airport Transfer",
      "Butler Service",
      "Private Terrace",
    ],
    highlighted: false,
    ctaText: "Book Now",
    ctaLink: "{{booking}}",
  },
];

export default function PricingTable({
  title = "Compare Our Rooms",
  subtitle,
  rooms = [],
}: PricingTableProps) {
  const plans = rooms.length ? rooms : defaultRooms;

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Accommodations
          </span>
          <h2 className="text-4xl font-light text-stone-900 mt-3 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-stone-500 mt-4 text-lg font-light max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
          <div className="w-12 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((room, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
                room.highlighted
                  ? "shadow-2xl ring-2 ring-amber-400 scale-[1.03]"
                  : "shadow-md hover:shadow-xl border border-stone-100"
              }`}
              style={{
                backgroundColor: room.highlighted ? "#1a1a2e" : "#ffffff",
              }}
            >
              {/* Popular badge */}
              {room.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <span
                    className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
                    style={{ backgroundColor: "#c9a96e", color: "#1a1a2e" }}
                  >
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 flex flex-col flex-1 pt-10">
                {/* Room name */}
                <h3
                  className="text-sm font-semibold tracking-[0.2em] uppercase mb-2"
                  style={{ color: room.highlighted ? "#c9a96e" : "#a8956a" }}
                >
                  {room.name}
                </h3>

                {/* Price */}
                <div className="flex items-end gap-2 mb-1">
                  <span
                    className="text-xs font-medium self-start pt-3"
                    style={{ color: room.highlighted ? "#c4b49a" : "#78716c" }}
                  >
                    {room.currency}
                  </span>
                  <span
                    className="text-6xl font-bold leading-none tracking-tight"
                    style={{ color: room.highlighted ? "#ffffff" : "#1a1a2e" }}
                  >
                    {room.price}
                  </span>
                </div>
                <p
                  className="text-xs mb-8"
                  style={{ color: room.highlighted ? "#a0a0b8" : "#a8a29e" }}
                >
                  per {room.period}
                </p>

                {/* Divider */}
                <div
                  className="w-full h-px mb-8"
                  style={{
                    backgroundColor: room.highlighted ? "#2d2d4e" : "#f5f5f0",
                  }}
                />

                {/* Features */}
                <ul className="flex flex-col gap-3 flex-1 mb-8">
                  {room.features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          backgroundColor: room.highlighted
                            ? "rgba(201,169,110,0.15)"
                            : "rgba(168,149,106,0.1)",
                          color: room.highlighted ? "#c9a96e" : "#a8956a",
                        }}
                      >
                        ✓
                      </span>
                      <span
                        className="text-sm"
                        style={{
                          color: room.highlighted ? "#d4d4e8" : "#57534e",
                        }}
                      >
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={room.ctaLink}
                  className="block text-center py-3.5 px-6 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
                  style={
                    room.highlighted
                      ? { backgroundColor: "#c9a96e", color: "#1a1a2e" }
                      : {
                          backgroundColor: "#1a1a2e",
                          color: "#ffffff",
                        }
                  }
                >
                  {room.ctaText}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
