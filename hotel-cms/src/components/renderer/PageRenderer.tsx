import RenderSection, { type SectionData } from "./RenderSection";
import type { ThemeData } from "@/lib/schemas";

export interface PageRendererProps {
  sections: SectionData[];
  theme?: ThemeData | null;
  hotelName?: string;
}

/**
 * PageRenderer — renders all visible sections of a page in sort order,
 * applying theme CSS variables to the root wrapper for consistent styling.
 */
export default function PageRenderer({ sections, theme, hotelName }: PageRendererProps) {
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  // Build CSS custom properties from theme tokens
  const themeVars: React.CSSProperties = theme
    ? ({
        "--color-primary": theme.colorTokens.primary,
        "--color-secondary": theme.colorTokens.secondary,
        "--color-accent": theme.colorTokens.accent,
        "--color-bg": theme.colorTokens.bg,
        "--color-text": theme.colorTokens.text,
        "--font-heading": theme.typography.headingFont,
        "--font-body": theme.typography.bodyFont,
        fontFamily: `var(--font-body), sans-serif`,
      } as React.CSSProperties)
    : {};

  // Typography scale class
  const scaleClass =
    theme?.typography.scale === "small"
      ? "text-sm"
      : theme?.typography.scale === "large"
        ? "text-lg"
        : "text-base";

  // Spacing class
  const spacingClass =
    theme?.spacing === "compact"
      ? "space-y-0"
      : theme?.spacing === "spacious"
        ? "space-y-4"
        : "space-y-0";

  return (
    <div
      className={`min-h-screen ${scaleClass} ${spacingClass}`}
      style={themeVars}
      data-hotel={hotelName}
      data-template={theme?.baseTemplate}
    >
      {sorted.map((section) => (
        <section
          key={section.id}
          id={`section-${section.id}`}
          data-variant={section.componentVariant}
        >
          <RenderSection section={section} />
        </section>
      ))}

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-400">
          <p className="text-xl font-light">No sections configured</p>
          <p className="text-sm mt-2">Add sections in the page builder to see them here.</p>
        </div>
      )}
    </div>
  );
}
