import Link from "next/link";

export interface HeroEditorialProps {
  headline?: string;
  subtext?: string;
  image?: string;
  cta?: string;
  ctaLink?: string;
  ratio?: "40/60" | "50/50" | "60/40";
}

const ratioMap: Record<string, { text: string; image: string }> = {
  "40/60": { text: "w-2/5", image: "w-3/5" },
  "50/50": { text: "w-1/2", image: "w-1/2" },
  "60/40": { text: "w-3/5", image: "w-2/5" },
};

export default function HeroEditorial({
  headline = "Your Story Begins Here",
  subtext = "",
  image = "",
  cta = "Explore",
  ctaLink = "#rooms",
  ratio = "50/50",
}: HeroEditorialProps) {
  const { text: textWidth, image: imageWidth } = ratioMap[ratio] ?? ratioMap["50/50"];

  return (
    <section className="flex flex-col md:flex-row min-h-[600px] h-[80vh]">
      {/* Text column */}
      <div
        className={`flex flex-col justify-center px-10 md:px-16 lg:px-24 py-16 bg-stone-50 ${textWidth} w-full md:w-auto`}
      >
        <span className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-6 font-medium">
          Welcome
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-stone-900 leading-tight mb-6 tracking-tight">
          {headline}
        </h1>
        {subtext && (
          <p className="text-stone-500 text-base md:text-lg leading-relaxed mb-10 max-w-md font-light">
            {subtext}
          </p>
        )}
        {cta && ctaLink && (
          <Link
            href={ctaLink}
            className="self-start inline-flex items-center gap-3 text-sm tracking-[0.15em] uppercase text-stone-800 border-b border-stone-800 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors duration-300 font-medium"
          >
            {cta}
            <span className="text-base">→</span>
          </Link>
        )}
      </div>

      {/* Image column */}
      <div className={`relative overflow-hidden ${imageWidth} w-full md:w-auto flex-1`}>
        {image ? (
          <img
            src={image}
            alt={headline}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-400" />
        )}
      </div>
    </section>
  );
}
