export interface Amenity {
  name: string;
  icon: string;
  description: string;
}

export interface AmenitiesGridProps {
  title?: string;
  subtitle?: string;
  amenities?: Amenity[];
  columns?: number;
}

const defaultAmenities: Amenity[] = [
  { name: "Swimming Pool", icon: "🏊", description: "Outdoor pool with sun loungers and poolside service" },
  { name: "Fitness Center", icon: "💪", description: "24/7 fully equipped gym with modern equipment" },
  { name: "Free Wi-Fi", icon: "📶", description: "High-speed internet access throughout the property" },
  { name: "Spa & Wellness", icon: "🧖", description: "Full-service spa with massages and treatments" },
  { name: "Restaurant", icon: "🍽", description: "On-site fine dining with international cuisine" },
  { name: "Concierge", icon: "🛎", description: "24-hour concierge service for all your needs" },
];

export default function AmenitiesGrid({
  title = "Hotel Amenities",
  subtitle = "Everything you need for a comfortable stay",
  amenities = [],
  columns = 3,
}: AmenitiesGridProps) {
  const items = amenities.length ? amenities : defaultAmenities;

  const colClass =
    columns === 4
      ? "lg:grid-cols-4"
      : columns === 2
      ? "lg:grid-cols-2"
      : "lg:grid-cols-3";

  return (
    <section className="py-20 px-6 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Facilities
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

        {/* Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${colClass} gap-6`}>
          {items.map((amenity, i) => (
            <div
              key={i}
              className="bg-white border border-stone-100 rounded-xl p-7 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300 group"
            >
              <span className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200 inline-block">
                {amenity.icon}
              </span>
              <h3 className="font-semibold text-stone-900 text-base mb-2">
                {amenity.name}
              </h3>
              <p className="text-sm text-stone-500 font-light leading-relaxed">
                {amenity.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
