export interface CtaBannerProps {
  headline?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
}

export default function CtaBanner({
  headline = "Book Direct & Save",
  description = "Get 15% off when you book directly on our website",
  ctaText = "Book Now",
  ctaLink = "#",
  bgColor = "#1a1a2e",
  textColor = "#ffffff",
  alignment = "center",
}: CtaBannerProps) {
  const alignClass =
    alignment === "left"
      ? "text-left items-start"
      : alignment === "right"
      ? "text-right items-end"
      : "text-center items-center";

  return (
    <section
      className="py-16 px-6"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className={`max-w-5xl mx-auto flex flex-col gap-6 ${alignClass}`}>
        <h2
          className="text-3xl font-bold tracking-tight"
          style={{ color: textColor }}
        >
          {headline}
        </h2>
        {description && (
          <p
            className="text-lg max-w-2xl"
            style={{ color: textColor, opacity: 0.8 }}
          >
            {description}
          </p>
        )}
        <a
          href={ctaLink}
          className="inline-block px-8 py-3 rounded-lg font-semibold text-sm tracking-wide transition-opacity duration-200 hover:opacity-90"
          style={{
            backgroundColor: textColor,
            color: bgColor,
          }}
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
}
