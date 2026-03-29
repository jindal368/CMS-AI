export interface Treatment {
  name: string;
  duration: string;
  price: string;
  description: string;
}

export interface SpaWellnessProps {
  title?: string;
  subtitle?: string;
  treatments?: Treatment[];
  image?: string;
  bookingLink?: string;
}

const defaultTreatments: Treatment[] = [
  {
    name: "Signature Aromatherapy Massage",
    duration: "60 min",
    price: "$120",
    description: "A deeply relaxing full-body massage using essential oils tailored to your needs.",
  },
  {
    name: "Himalayan Salt Stone Therapy",
    duration: "90 min",
    price: "$180",
    description: "Warm salt stones melt away tension while mineralising and detoxifying the skin.",
  },
  {
    name: "Ayurvedic Shirodhara",
    duration: "75 min",
    price: "$150",
    description: "Warm herbal oil poured in a continuous stream over the forehead — profound calm.",
  },
  {
    name: "Deep Tissue Renewal",
    duration: "60 min",
    price: "$130",
    description: "Targeted pressure releases chronic muscle tension and improves circulation.",
  },
];

export default function SpaWellness({
  title = "Spa & Wellness",
  subtitle = "A sanctuary of calm where every treatment is a journey inward.",
  treatments = [],
  image = "",
  bookingLink = "{{booking}}",
}: SpaWellnessProps) {
  const items = treatments.length ? treatments : defaultTreatments;

  return (
    <section style={{ backgroundColor: "#f5f0eb" }} className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          {/* Left — image */}
          <div className="relative h-[520px] rounded-2xl overflow-hidden shadow-lg">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#e8ddd4" }}
              >
                <div className="text-center">
                  <div className="text-8xl mb-4">🌿</div>
                  <p
                    className="text-xs tracking-[0.3em] uppercase font-medium"
                    style={{ color: "#8a7060" }}
                  >
                    Spa & Wellness
                  </p>
                </div>
              </div>
            )}
            {/* Soft overlay label */}
            <div
              className="absolute bottom-6 left-6 px-4 py-2 rounded-full text-xs tracking-widest uppercase font-medium"
              style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#6b5344" }}
            >
              Holistic Wellness
            </div>
          </div>

          {/* Right — content */}
          <div className="flex flex-col justify-start pt-2">
            <span
              className="text-xs tracking-[0.3em] uppercase font-medium mb-4"
              style={{ color: "#8a7060" }}
            >
              Rejuvenate
            </span>
            <h2
              className="text-5xl font-light tracking-tight mb-4"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                color: "#2d2018",
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="text-lg font-light leading-relaxed mb-8"
                style={{ color: "#6b5344" }}
              >
                {subtitle}
              </p>
            )}

            {/* Divider */}
            <div className="w-12 h-px mb-8" style={{ backgroundColor: "#c4a882" }} />

            {/* Treatment list */}
            <div className="flex flex-col gap-4">
              {items.map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 transition-shadow duration-300 hover:shadow-md"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid #e2d5c8" }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <h3
                      className="font-semibold text-base leading-snug"
                      style={{ color: "#2d2018" }}
                    >
                      {t.name}
                    </h3>
                    <span
                      className="font-semibold text-sm shrink-0 ml-3"
                      style={{ color: "#9c6f47" }}
                    >
                      {t.price}
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "#a08878" }}>
                    {t.duration}
                  </p>
                  <p className="text-sm font-light leading-relaxed" style={{ color: "#5c4535" }}>
                    {t.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <a
                href={bookingLink}
                className="inline-block px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-opacity duration-200 hover:opacity-90"
                style={{ backgroundColor: "#7c5c3e", color: "#fff5ee" }}
              >
                Book a Treatment
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
