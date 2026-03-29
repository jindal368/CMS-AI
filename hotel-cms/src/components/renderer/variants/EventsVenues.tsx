export interface Venue {
  name: string;
  capacity: number;
  area: string;
  features: string[];
  image: string;
}

export interface EventsVenuesProps {
  title?: string;
  subtitle?: string;
  venues?: Venue[];
  inquiryLink?: string;
}

const defaultVenues: Venue[] = [
  {
    name: "The Grand Ballroom",
    capacity: 300,
    area: "450 sq.m",
    features: ["Stage & Podium", "AV System", "Catering", "Natural Light", "Breakout Rooms"],
    image: "",
  },
  {
    name: "Executive Boardroom",
    capacity: 20,
    area: "80 sq.m",
    features: ["Video Conferencing", "Projector", "Whiteboard", "High-Speed Wi-Fi", "Catering"],
    image: "",
  },
  {
    name: "Garden Pavilion",
    capacity: 150,
    area: "300 sq.m",
    features: ["Outdoor Setting", "Sound System", "Catering", "Lighting Rig", "Parking"],
    image: "",
  },
];

export default function EventsVenues({
  title = "Events & Meetings",
  subtitle = "Versatile spaces designed to elevate every occasion — from intimate boardrooms to grand celebrations.",
  venues = [],
  inquiryLink = "{{email}}",
}: EventsVenuesProps) {
  const items = venues.length ? venues : defaultVenues;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-slate-400 font-medium">
            Corporate & Social Events
          </span>
          <h2
            className="text-5xl font-light text-slate-900 mt-3 tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-slate-500 font-light mt-4 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="w-12 h-0.5 bg-slate-800 mt-6" />
        </div>

        {/* Venue cards */}
        <div className="flex flex-col gap-8">
          {items.map((venue, i) => (
            <div
              key={i}
              className="grid grid-cols-1 lg:grid-cols-5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Image — 2 of 5 cols */}
              <div className="lg:col-span-2 h-56 lg:h-auto bg-slate-100 flex items-center justify-center relative">
                {venue.image ? (
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full bg-slate-100">
                    <div className="text-5xl mb-2">🏛</div>
                    <p className="text-xs text-slate-400 tracking-widest uppercase">Venue Photo</p>
                  </div>
                )}
              </div>

              {/* Details — 3 of 5 cols */}
              <div className="lg:col-span-3 p-8 flex flex-col justify-between bg-white">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                    {venue.name}
                  </h3>

                  {/* Capacity + Area badges */}
                  <div className="flex flex-wrap gap-3 mb-5">
                    <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      <span>👥</span>
                      Up to {venue.capacity} guests
                    </span>
                    <span className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full">
                      <span>📐</span>
                      {venue.area}
                    </span>
                  </div>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2">
                    {venue.features.map((f, j) => (
                      <span
                        key={j}
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ backgroundColor: "#f0f4ff", color: "#3b5bdb" }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-7">
                  <a
                    href={inquiryLink}
                    className="inline-block px-7 py-3 rounded-lg text-sm font-semibold tracking-wide border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors duration-200"
                  >
                    Inquire About {venue.name}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
