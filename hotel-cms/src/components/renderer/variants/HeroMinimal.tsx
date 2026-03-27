import Link from "next/link";

export interface HeroMinimalProps {
  headline?: string;
  cta?: string;
  ctaLink?: string;
  bgColor?: string;
}

export default function HeroMinimal({
  headline = "Welcome",
  cta = "Book Now",
  ctaLink = "#booking",
  bgColor = "",
}: HeroMinimalProps) {
  return (
    <section
      className="flex flex-col items-center justify-center min-h-[480px] px-6 py-24 text-center"
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <div
        className={
          !bgColor
            ? "flex flex-col items-center justify-center min-h-[480px] w-full bg-stone-900 px-6 py-24"
            : "flex flex-col items-center"
        }
        style={bgColor ? undefined : undefined}
      >
        <span className="text-xs tracking-[0.4em] uppercase text-stone-400 mb-8 font-medium block">
          Est. Excellence
        </span>
        <h1
          className="text-5xl md:text-7xl font-light tracking-widest mb-10 leading-tight"
          style={{ color: bgColor ? "#1c1917" : "#f5f5f4" }}
        >
          {headline}
        </h1>
        <div
          className="w-16 h-px mb-10"
          style={{ backgroundColor: bgColor ? "#78716c" : "#78716c" }}
        />
        {cta && ctaLink && (
          <Link
            href={ctaLink}
            className="inline-block px-12 py-4 text-sm tracking-[0.25em] uppercase font-medium transition-all duration-300"
            style={
              bgColor
                ? {
                    backgroundColor: "#1c1917",
                    color: "#fafaf9",
                  }
                : {
                    backgroundColor: "#fafaf9",
                    color: "#1c1917",
                  }
            }
          >
            {cta}
          </Link>
        )}
      </div>
    </section>
  );
}
