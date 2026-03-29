export interface MenuHighlight {
  dish: string;
  price: string;
  description: string;
}

export interface DiningShowcaseProps {
  restaurantName?: string;
  description?: string;
  cuisine?: string;
  hours?: string;
  chefName?: string;
  chefTitle?: string;
  menuHighlights?: MenuHighlight[];
  image?: string;
  reservationLink?: string;
}

const placeholderHighlights: MenuHighlight[] = [
  {
    dish: "Pan-Seared Sea Bass",
    price: "$42",
    description: "Wild-caught sea bass with saffron beurre blanc and seasonal vegetables",
  },
  {
    dish: "Wagyu Beef Tenderloin",
    price: "$68",
    description: "A5 grade wagyu with truffle jus, roasted shallots, and pommes dauphinoise",
  },
  {
    dish: "Lobster Bisque",
    price: "$24",
    description: "Rich and velvety bisque with cognac cream and a hint of tarragon",
  },
];

export default function DiningShowcase({
  restaurantName = "The Restaurant",
  description = "Experience exceptional cuisine crafted with locally sourced ingredients and time-honoured techniques.",
  cuisine = "International",
  hours = "7:00 AM – 11:00 PM",
  chefName = "",
  chefTitle = "",
  menuHighlights = [],
  image = "",
  reservationLink = "#",
}: DiningShowcaseProps) {
  const highlights = menuHighlights.length ? menuHighlights : placeholderHighlights;

  return (
    <section style={{ backgroundColor: "#1a1a2e" }} className="py-20 px-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Split header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left — info */}
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
              Fine Dining
            </span>
            <h2
              className="text-5xl font-light mt-4 mb-4 tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {restaurantName}
            </h2>
            <span
              className="inline-block text-xs tracking-widest uppercase px-3 py-1 rounded-full border mb-5"
              style={{ borderColor: "#c9a96e", color: "#c9a96e" }}
            >
              {cuisine}
            </span>
            <p className="text-stone-300 leading-relaxed mb-6 font-light text-lg">
              {description}
            </p>
            <p className="flex items-center gap-2 text-stone-400 text-sm mb-6">
              <span>🕐</span>
              <span>{hours}</span>
            </p>
            {chefName && (
              <div className="border-l-2 pl-4" style={{ borderColor: "#c9a96e" }}>
                <p className="font-semibold text-white">{chefName}</p>
                {chefTitle && (
                  <p className="text-stone-400 text-sm mt-0.5">{chefTitle}</p>
                )}
              </div>
            )}
          </div>

          {/* Right — image */}
          <div className="relative h-80 lg:h-96 rounded-lg overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={restaurantName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-stone-800 flex items-center justify-center rounded-lg">
                <div className="text-center text-stone-500">
                  <div className="text-5xl mb-3">🍽</div>
                  <p className="text-sm tracking-widest uppercase">Restaurant Image</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signature Dishes */}
        <div className="border-t border-stone-700 pt-14">
          <div className="text-center mb-10">
            <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
              Curated Selection
            </span>
            <h3
              className="text-3xl font-light mt-3 tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Signature Dishes
            </h3>
            <div className="w-12 h-px mx-auto mt-4" style={{ backgroundColor: "#c9a96e" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {highlights.map((item, i) => (
              <div
                key={i}
                className="border border-stone-700 rounded-lg p-6 hover:border-stone-500 transition-colors duration-300"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-white text-base leading-snug pr-2">
                    {item.dish}
                  </h4>
                  <span
                    className="font-semibold text-sm shrink-0"
                    style={{ color: "#c9a96e" }}
                  >
                    {item.price}
                  </span>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed font-light">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href={reservationLink}
              className="inline-block px-10 py-4 rounded-lg font-semibold tracking-wide text-sm transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: "#c9a96e", color: "#1a1a2e" }}
            >
              Reserve a Table
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
