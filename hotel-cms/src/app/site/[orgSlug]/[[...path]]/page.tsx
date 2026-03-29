import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getHotelPageData } from "@/lib/render-page";
import PageRenderer from "@/components/renderer/PageRenderer";
import ScrollAnimator from "@/components/site/ScrollAnimator";

// For development: force-dynamic. For production ISR, swap to:
// export const revalidate = 3600;
export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────

interface SitePageProps {
  params: Promise<{ orgSlug: string; path?: string[] }>;
}

// ─── Helpers ─────────────────────────────────────────────

function isLocaleCode(segment: string): boolean {
  return segment.length === 2 && /^[a-z]{2}$/.test(segment);
}

// ─── Property Directory ──────────────────────────────────

interface HotelCardProps {
  hotel: {
    id: string;
    name: string;
    category: string;
    hotelSlug: string | null;
    contactInfo: unknown;
    pages: { id: string }[];
    rooms: { id: string }[];
    media: { url: string; altText: string | null }[];
  };
  orgSlug: string;
  accentColor: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  luxury: "#b8860b",
  boutique: "#7c5cbf",
  resort: "#1a7a5e",
  business: "#2563eb",
  budget: "#64748b",
};

function HotelCard({ hotel, orgSlug, accentColor }: HotelCardProps) {
  const contact = (hotel.contactInfo as Record<string, string>) ?? {};
  const location = [contact.city, contact.country].filter(Boolean).join(", ");
  const categoryColor = CATEGORY_COLORS[hotel.category] ?? accentColor;
  const slug = hotel.hotelSlug ?? hotel.id;

  return (
    <Link
      href={`/site/${orgSlug}/${slug}/`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "var(--card)",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        className="hotel-card"
      >
        {/* Card image */}
        {hotel.media[0]?.url ? (
          <div style={{ height: "180px", overflow: "hidden", flexShrink: 0 }}>
            <img
              src={hotel.media[0].url}
              alt={hotel.media[0].altText ?? hotel.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ) : (
          <div
            style={{
              height: "120px",
              background: `linear-gradient(135deg, ${categoryColor}22 0%, ${categoryColor}44 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "2.5rem", opacity: 0.5 }}>
              {hotel.category === "luxury"
                ? "★"
                : hotel.category === "resort"
                  ? "🏖"
                  : hotel.category === "boutique"
                    ? "✦"
                    : hotel.category === "business"
                      ? "◆"
                      : "⬡"}
            </span>
          </div>
        )}

        {/* Card body */}
        <div style={{ padding: "20px 24px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Category badge */}
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: categoryColor,
              background: `${categoryColor}18`,
              marginBottom: "10px",
              alignSelf: "flex-start",
            }}
          >
            {hotel.category}
          </span>

          {/* Name */}
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1.25,
            }}
          >
            {hotel.name}
          </h3>

          {/* Location */}
          {location && (
            <p
              style={{
                margin: "0 0 14px",
                fontSize: "0.85rem",
                color: "#6b7280",
              }}
            >
              {location}
            </p>
          )}

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              fontSize: "0.78rem",
              color: "#9ca3af",
              marginTop: "auto",
              paddingTop: "12px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <span>{hotel.pages.length} page{hotel.pages.length !== 1 ? "s" : ""}</span>
            <span>{hotel.rooms.length} room{hotel.rooms.length !== 1 ? "s" : ""}</span>
          </div>

          {/* CTA */}
          <div
            style={{
              marginTop: "16px",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: accentColor,
            }}
          >
            Explore &rarr;
          </div>
        </div>
      </div>
    </Link>
  );
}

function PropertyDirectory({
  org,
  hotels,
}: {
  org: { name: string; brandTheme: unknown };
  hotels: HotelCardProps["hotel"][];
  orgSlug: string;
}) {
  const brandTheme = (org.brandTheme as Record<string, any>) ?? null;
  const accentColor = brandTheme?.colorTokens?.accent ?? "#e85d45";
  const primaryColor = brandTheme?.colorTokens?.primary ?? "#1a1a2e";

  return (
    <>
      <style>{`
        .hotel-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 16px 40px rgba(0,0,0,0.1) !important;
        }
        .hotel-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .hotel-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1200px) {
          .hotel-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* Dark hero header */}
        <header
          style={{
            background: primaryColor,
            padding: "64px 24px 72px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 16px",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: accentColor,
              opacity: 0.9,
            }}
          >
            Property Collection
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {org.name}
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: "1.05rem",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 400,
            }}
          >
            Explore Our Hotels
          </p>
        </header>

        {/* Card grid */}
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px 80px" }}>
          {hotels.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 24px",
                color: "#9ca3af",
                fontSize: "1rem",
              }}
            >
              No properties are currently published.
            </div>
          ) : (
            <>
              <p
                style={{
                  margin: "0 0 32px",
                  fontSize: "0.875rem",
                  color: "#6b7280",
                }}
              >
                {hotels.length} propert{hotels.length !== 1 ? "ies" : "y"} available
              </p>
              <div className="hotel-grid">
                {hotels.map((hotel, i) => (
                  <div key={hotel.id} className={`animate-on-scroll stagger-${Math.min(i + 1, 5)}`}>
                    <HotelCard
                      hotel={hotel}
                      orgSlug={(org as any).slug}
                      accentColor={accentColor}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

// ─── Page Component ──────────────────────────────────────

export default async function SitePage({ params }: SitePageProps) {
  const { orgSlug, path } = await params;

  // 1. Fetch org by slug
  const org = await prisma.organization.findFirst({ where: { slug: orgSlug } });
  if (!org) notFound();

  const segments = path ?? [];

  // ── No path: property directory ──
  if (segments.length === 0) {
    const hotels = await prisma.hotel.findMany({
      where: { orgId: org.id, publishedAt: { not: null } },
      include: {
        media: { take: 1 },
        rooms: { select: { id: true } },
        pages: { select: { id: true } },
        theme: true,
      },
      orderBy: { name: "asc" },
    });

    return (
      <ScrollAnimator>
        <PropertyDirectory
          org={{ name: org.name, brandTheme: org.brandTheme, slug: orgSlug } as any}
          hotels={hotels as any}
          orgSlug={orgSlug}
        />
      </ScrollAnimator>
    );
  }

  // ── All hotel paths: look up hotel first ──
  const hotelSlug = segments[0];
  const hotel = await prisma.hotel.findFirst({
    where: { orgId: org.id, hotelSlug, publishedAt: { not: null } },
  });
  if (!hotel) notFound();

  // Determine pageSlug and locale based on path depth
  let pageSlug = "/";
  let locale: string | undefined;

  if (segments.length === 1) {
    // /palais-de-mahe → homepage, no locale
    pageSlug = "/";
  } else if (segments.length === 2) {
    if (isLocaleCode(segments[1])) {
      // /palais-de-mahe/fr → homepage in locale "fr"
      locale = segments[1];
      pageSlug = "/";
    } else {
      // /palais-de-mahe/rooms → page "rooms", no locale
      pageSlug = segments[1];
    }
  } else if (segments.length >= 3) {
    // /palais-de-mahe/fr/rooms → locale "fr", page "rooms"
    locale = segments[1];
    pageSlug = segments[2];
  }

  const data = await getHotelPageData(hotel.id, pageSlug, locale);
  if (!data) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data.structuredData),
        }}
      />
      <ScrollAnimator>
        <PageRenderer
          sections={data.sections}
          theme={data.themeData}
          hotelName={data.hotel.name}
        />
      </ScrollAnimator>
    </>
  );
}

// ─── Metadata ────────────────────────────────────────────

export async function generateMetadata({ params }: SitePageProps) {
  const { orgSlug, path } = await params;

  const org = await prisma.organization.findFirst({ where: { slug: orgSlug } });
  if (!org) return { title: "Not Found" };

  const segments = path ?? [];

  // Property directory
  if (segments.length === 0) {
    return {
      title: `${org.name} — Our Properties`,
      description: `Explore all hotels and properties by ${org.name}.`,
    };
  }

  // Hotel path: look up hotel
  const hotelSlug = segments[0];
  const hotel = await prisma.hotel.findFirst({
    where: { orgId: org.id, hotelSlug, publishedAt: { not: null } },
  });
  if (!hotel) return { title: org.name };

  let pageSlug = "/";
  let locale: string | undefined;

  if (segments.length === 1) {
    pageSlug = "/";
  } else if (segments.length === 2) {
    if (isLocaleCode(segments[1])) {
      locale = segments[1];
      pageSlug = "/";
    } else {
      pageSlug = segments[1];
    }
  } else if (segments.length >= 3) {
    locale = segments[1];
    pageSlug = segments[2];
  }

  const data = await getHotelPageData(hotel.id, pageSlug, locale);
  if (!data) return { title: hotel.name };

  const metaTags = (data.page?.metaTags as Record<string, string> | null) ?? null;

  return {
    title: metaTags?.title ?? `${data.hotel.name}${pageSlug !== "/" ? ` — ${pageSlug}` : ""}`,
    description: metaTags?.description ?? (data.hotel.seoConfig as Record<string, string> | null)?.description ?? "",
    openGraph: {
      title: metaTags?.title ?? data.hotel.name,
      description: metaTags?.description ?? "",
      type: "website",
    },
  };
}
