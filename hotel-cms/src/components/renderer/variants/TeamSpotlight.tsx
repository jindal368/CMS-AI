export interface TeamMember {
  name: string;
  title: string;
  bio: string;
  image: string;
}

export interface TeamSpotlightProps {
  title?: string;
  subtitle?: string;
  members?: TeamMember[];
}

const defaultMembers: TeamMember[] = [
  {
    name: "Sarah Johnson",
    title: "General Manager",
    bio: "With 15 years in hospitality, Sarah brings warmth and expertise to every guest experience.",
    image: "",
  },
  {
    name: "Chef Marco",
    title: "Executive Chef",
    bio: "Award-winning chef crafting unforgettable culinary journeys with local ingredients.",
    image: "",
  },
  {
    name: "Priya Patel",
    title: "Spa Director",
    bio: "Certified wellness expert dedicated to creating transformative relaxation experiences.",
    image: "",
  },
];

export default function TeamSpotlight({
  title = "Meet Our Team",
  subtitle = "The passionate people behind every exceptional stay.",
  members = [],
}: TeamSpotlightProps) {
  const items = members.length ? members : defaultMembers;

  return (
    <section className="py-20 px-6" style={{ backgroundColor: "#fdfaf7" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="text-xs tracking-[0.3em] uppercase font-medium"
            style={{ color: "#9c7b5e" }}
          >
            Our People
          </span>
          <h2
            className="text-5xl font-light mt-3 tracking-tight"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "#1c1610",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-lg font-light mt-4 max-w-xl mx-auto leading-relaxed"
              style={{ color: "#7a5c44" }}
            >
              {subtitle}
            </p>
          )}
          <div className="w-12 h-px mx-auto mt-5" style={{ backgroundColor: "#c4a882" }} />
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((member, i) => (
            <div
              key={i}
              className="group flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-300 hover:shadow-xl"
              style={{
                backgroundColor: "#fff",
                border: "1px solid #ede3da",
              }}
            >
              {/* Circular photo / placeholder */}
              <div className="relative mb-5">
                <div
                  className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: "#ede3da" }}
                >
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl select-none">👤</span>
                  )}
                </div>
                {/* Decorative ring on hover */}
                <div
                  className="absolute inset-0 rounded-full border-2 scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ borderColor: "#c4a882" }}
                />
              </div>

              {/* Name */}
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: "#1c1610" }}
              >
                {member.name}
              </h3>

              {/* Title */}
              <p
                className="text-sm font-medium tracking-wide mb-3"
                style={{ color: "#9c7b5e" }}
              >
                {member.title}
              </p>

              {/* Thin divider */}
              <div className="w-8 h-px mb-3" style={{ backgroundColor: "#e2d5c8" }} />

              {/* Bio */}
              <p
                className="text-sm font-light leading-relaxed"
                style={{ color: "#6b5040" }}
              >
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
