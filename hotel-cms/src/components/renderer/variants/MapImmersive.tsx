export interface Attraction {
  name: string;
  type: string;
  distance: string;
}

export interface MapImmersiveProps {
  zoom?: number;
  showAttractions?: boolean;
  attractionRadius?: number;
  mapStyle?: "default" | "dark" | "satellite";
  hotelName?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

const defaultAttractions: Attraction[] = [
  { name: "City Museum", type: "Culture", distance: "0.3 km" },
  { name: "Central Park", type: "Nature", distance: "0.5 km" },
  { name: "Historic Cathedral", type: "Landmark", distance: "0.7 km" },
  { name: "Artisan Market", type: "Shopping", distance: "0.9 km" },
  { name: "Michelin Restaurant", type: "Dining", distance: "1.1 km" },
  { name: "Opera House", type: "Culture", distance: "1.4 km" },
];

const typeColors: Record<string, string> = {
  Culture: "bg-violet-100 text-violet-700",
  Nature: "bg-emerald-100 text-emerald-700",
  Landmark: "bg-amber-100 text-amber-700",
  Shopping: "bg-rose-100 text-rose-700",
  Dining: "bg-orange-100 text-orange-700",
};

const mapStyleLabels: Record<string, string> = {
  default: "Street Map",
  dark: "Dark Mode",
  satellite: "Satellite",
};

export default function MapImmersive({
  zoom = 14,
  showAttractions = true,
  attractionRadius = 2,
  mapStyle = "default",
  hotelName = "The Grand Hotel",
  address = "1 Grand Avenue, City Center",
  coordinates,
}: MapImmersiveProps) {
  const mapUrl = coordinates
    ? `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}#map=${zoom}/${coordinates.lat}/${coordinates.lng}`
    : null;

  const bgClass =
    mapStyle === "dark"
      ? "bg-stone-800"
      : mapStyle === "satellite"
        ? "bg-green-900"
        : "bg-stone-200";

  return (
    <section className="py-0 w-full">
      <div className="relative w-full h-[560px] overflow-hidden">
        {/* Map placeholder */}
        <div className={`absolute inset-0 ${bgClass}`}>
          {mapStyle === "default" && (
            <div className="absolute inset-0 opacity-30">
              {/* Grid lines to simulate street map */}
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#78716c" strokeWidth="0.5"/>
                  </pattern>
                  <pattern id="grid2" width="180" height="180" patternUnits="userSpaceOnUse">
                    <rect width="180" height="180" fill="url(#grid)"/>
                    <path d="M 180 0 L 0 0 0 180" fill="none" stroke="#78716c" strokeWidth="1.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid2)" />
              </svg>
              {/* Simulated roads */}
              <svg width="100%" height="100%" className="absolute inset-0">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#a8a29e" strokeWidth="4"/>
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#a8a29e" strokeWidth="4"/>
                <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#d6d3d1" strokeWidth="2"/>
                <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#d6d3d1" strokeWidth="2"/>
                <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#d6d3d1" strokeWidth="2"/>
                <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#d6d3d1" strokeWidth="2"/>
              </svg>
            </div>
          )}
          {mapStyle === "dark" && (
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" className="absolute inset-0">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#57534e" strokeWidth="4"/>
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#57534e" strokeWidth="4"/>
                <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#44403c" strokeWidth="2"/>
                <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#44403c" strokeWidth="2"/>
              </svg>
            </div>
          )}

          {/* Hotel pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative flex flex-col items-center">
              <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center shadow-xl">
                <span className="text-white text-xl">🏨</span>
              </div>
              <div className="w-2 h-2 bg-stone-900 rotate-45 -mt-1" />
              <div className="absolute top-14 whitespace-nowrap bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-lg">
                {hotelName}
              </div>
            </div>
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-900/20" />
        </div>

        {/* Info panel */}
        <div className="absolute top-6 left-6 z-20 bg-white shadow-xl p-6 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-stone-800 font-medium text-sm">{hotelName}</span>
            <span className="text-xs text-stone-400 border border-stone-200 px-1.5 py-0.5">
              {mapStyleLabels[mapStyle]}
            </span>
          </div>
          <p className="text-stone-500 text-xs mb-4 flex items-start gap-1.5">
            <svg className="w-3.5 h-3.5 mt-0.5 flex-none text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {address}
          </p>
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs tracking-[0.15em] uppercase text-stone-800 border-b border-stone-300 pb-0.5 hover:border-stone-600 transition-colors"
            >
              Open in Maps →
            </a>
          )}
        </div>

        {/* Attractions panel */}
        {showAttractions && (
          <div className="absolute bottom-6 left-6 right-6 md:right-auto z-20 bg-white/95 backdrop-blur-sm shadow-xl p-5 md:max-w-sm">
            <p className="text-xs tracking-[0.2em] uppercase text-stone-400 font-medium mb-3">
              Nearby — within {attractionRadius} km
            </p>
            <div className="grid grid-cols-2 gap-2">
              {defaultAttractions.map((a) => (
                <div key={a.name} className="flex items-start gap-2">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-sm font-medium flex-none ${typeColors[a.type] ?? "bg-stone-100 text-stone-600"}`}
                  >
                    {a.type}
                  </span>
                  <div>
                    <p className="text-xs text-stone-700 font-medium leading-tight">{a.name}</p>
                    <p className="text-xs text-stone-400">{a.distance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
