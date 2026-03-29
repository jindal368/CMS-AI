export interface Attraction {
  name: string;
  category: string;
  distance: string;
  description: string;
  link: string;
}

export interface NearbyAttractionsProps {
  title?: string;
  subtitle?: string;
  attractions?: Attraction[];
  showMap?: boolean;
}

const defaultAttractions: Attraction[] = [
  {
    name: "White Town Heritage Walk",
    category: "culture",
    distance: "0.5 km",
    description: "French colonial architecture and colorful streets.",
    link: "",
  },
  {
    name: "Promenade Beach",
    category: "beach",
    distance: "1.2 km",
    description: "Scenic waterfront perfect for morning walks.",
    link: "",
  },
  {
    name: "Auroville",
    category: "nature",
    distance: "12 km",
    description: "Universal township and Matrimandir.",
    link: "",
  },
];

const CATEGORY_EMOJI: Record<string, string> = {
  beach: "🏖",
  monument: "🏛",
  culture: "🏛",
  restaurant: "🍽",
  dining: "🍽",
  shopping: "🛍",
  nature: "🌿",
  park: "🌿",
  museum: "🎨",
  art: "🎨",
  nightlife: "🎶",
  sport: "⚽",
  spa: "🧖",
  default: "📍",
};

function getCategoryEmoji(category: string): string {
  const key = category.toLowerCase();
  return CATEGORY_EMOJI[key] ?? CATEGORY_EMOJI.default;
}

function getCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export default function NearbyAttractions({
  title = "Explore the Area",
  subtitle = "Discover what makes our neighbourhood so special.",
  attractions = [],
  showMap = false,
}: NearbyAttractionsProps) {
  const items = attractions.length ? attractions : defaultAttractions;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Location
          </span>
          <h2
            className="text-5xl font-light text-stone-900 mt-3 tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-stone-500 font-light mt-4 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="w-12 h-px bg-stone-300 mt-5" />
        </div>

        {/* Attractions grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((a, i) => (
            <div
              key={i}
              className="group rounded-2xl p-6 border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-300 flex flex-col"
              style={{ backgroundColor: "#fafaf9" }}
            >
              {/* Top row: emoji + category label + distance */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: "#f0ece8" }}
                  >
                    {getCategoryEmoji(a.category)}
                  </div>
                  <span
                    className="text-xs font-medium tracking-wide uppercase"
                    style={{ color: "#9c7b5e" }}
                  >
                    {getCategoryLabel(a.category)}
                  </span>
                </div>
                {/* Distance badge */}
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#eef2f7", color: "#3b5bdb" }}
                >
                  {a.distance}
                </span>
              </div>

              {/* Name */}
              <h3 className="font-semibold text-stone-900 text-base mb-2 leading-snug">
                {a.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-stone-500 font-light leading-relaxed flex-1">
                {a.description}
              </p>

              {/* Learn More link */}
              {a.link && (
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200"
                  style={{ color: "#3b5bdb" }}
                >
                  Learn More
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Map placeholder — only rendered if showMap is true */}
        {showMap && (
          <div
            className="mt-10 h-64 rounded-2xl flex items-center justify-center border border-stone-200"
            style={{ backgroundColor: "#f5f5f0" }}
          >
            <div className="text-center text-stone-400">
              <div className="text-4xl mb-2">🗺</div>
              <p className="text-sm tracking-widest uppercase font-medium">Interactive Map</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
