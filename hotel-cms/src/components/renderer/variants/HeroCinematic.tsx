import Link from "next/link";

export interface HeroCinematicProps {
  media?: string;
  headline?: string;
  subtext?: string;
  cta?: string;
  ctaLink?: string;
  overlayOpacity?: number;
  overlayGradient?: string;
}

export default function HeroCinematic({
  media = "",
  headline = "Welcome",
  subtext = "",
  cta = "Book Now",
  ctaLink = "#booking",
  overlayOpacity = 0.4,
  overlayGradient = "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
}: HeroCinematicProps) {
  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Background media */}
      {media ? (
        <img
          src={media}
          alt={headline}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-950" />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: overlayGradient, opacity: overlayOpacity + 0.2 }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-24 px-6 text-center text-white">
        {headline && (
          <h1 className="text-5xl md:text-7xl font-light tracking-wider mb-4 drop-shadow-lg leading-tight">
            {headline}
          </h1>
        )}
        {subtext && (
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-8 font-light tracking-wide">
            {subtext}
          </p>
        )}
        {cta && ctaLink && (
          <Link
            href={ctaLink}
            className="inline-block px-10 py-4 border border-white text-white text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-stone-900 transition-all duration-300 font-medium"
          >
            {cta}
          </Link>
        )}
      </div>
    </section>
  );
}
