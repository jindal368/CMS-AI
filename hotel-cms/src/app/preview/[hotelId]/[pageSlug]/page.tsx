import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PageRenderer from "@/components/renderer/PageRenderer";
import type { SectionData } from "@/components/renderer/RenderSection";
import type { ThemeData } from "@/lib/schemas";
import { generateHotelSchema, generateRoomSchemas } from "@/lib/seo/structured-data";
import { resolvePropsLinks, resolveSmartLink, HotelLinkData } from "@/lib/smart-links";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ hotelId: string; pageSlug: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { hotelId, pageSlug } = await params;

  // The home page is stored with slug "/" but "/" cannot appear in a URL segment.
  // We accept "home" as an alias for "/".
  const resolvedSlug = pageSlug === "home" ? "/" : pageSlug;

  // Fetch hotel with theme and org brand overrides
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { theme: true, org: true },
  });

  if (!hotel) notFound();

  const hotelLinkData: HotelLinkData = {
    id: hotel.id,
    links: (hotel.links as Record<string, string>) || {},
    contactInfo: (hotel.contactInfo as Record<string, any>) || {},
  };

  // Fetch the page by slug + hotelId
  const page = await prisma.page.findFirst({
    where: { hotelId, slug: resolvedSlug },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!page) notFound();

  // Fetch available locales for language switcher
  const localeRows = await prisma.page.findMany({
    where: { hotelId },
    select: { locale: true },
    distinct: ["locale"],
  });
  const locales = localeRows.map((r: { locale: string | null }) => r.locale).filter(Boolean) as string[];
  const currentLocale = hotel.defaultLocale ?? "";

  // Fetch hotel rooms and media for section data enrichment
  const [rooms, mediaAssets] = await Promise.all([
    prisma.room.findMany({
      where: { hotelId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.mediaAsset.findMany({
      where: { hotelId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Map rooms to the shape components expect
  const roomsData = rooms.map((r: (typeof rooms)[number]) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    pricing: r.pricing as { basePrice: number; currency: string } | null,
    amenities: r.amenities as string[],
    images: r.images as string[],
    maxGuests: r.maxGuests,
  }));

  // Map media assets to the shape gallery components expect
  const imagesData = mediaAssets.map((m: (typeof mediaAssets)[number]) => ({
    id: m.id,
    url: m.url,
    altText: m.altText,
    tags: m.tags as string[],
  }));

  // Enrich section props with live data where applicable
  const sections: SectionData[] = page.sections.map((section: (typeof page.sections)[number]) => {
    const baseProps = (section.props as Record<string, unknown>) ?? {};
    let enrichedProps: Record<string, unknown> = { ...baseProps };

    switch (section.componentVariant) {
      case "rooms_grid":
      case "rooms_showcase":
        if (!enrichedProps.rooms) {
          enrichedProps = { ...enrichedProps, rooms: roomsData };
        }
        break;

      case "gallery_masonry":
      case "gallery_filmstrip":
        if (!enrichedProps.images) {
          enrichedProps = { ...enrichedProps, images: imagesData };
        }
        break;

      case "map_immersive":
        if (!enrichedProps.hotelName) {
          enrichedProps = {
            ...enrichedProps,
            hotelName: hotel.name,
            address: (hotel.contactInfo as Record<string, string> | null)?.address,
            coordinates: (hotel.contactInfo as Record<string, unknown> | null)?.coordinates,
          };
        }
        break;

      case "footer_rich":
        if (!enrichedProps.hotel) {
          enrichedProps = {
            ...enrichedProps,
            hotel: {
              name: hotel.name,
              contactInfo: hotel.contactInfo,
            },
          };
        }
        break;
    }

    // Resolve smart link tokens in all props
    const resolvedProps = resolvePropsLinks(enrichedProps, hotelLinkData);

    // Inject component-specific resolved links
    switch (section.componentVariant) {
      case "booking_sticky":
        resolvedProps.phoneLink = resolveSmartLink("{{phone}}", hotelLinkData);
        break;
      case "footer_rich":
        resolvedProps.instagramUrl = resolveSmartLink("{{instagram}}", hotelLinkData);
        resolvedProps.facebookUrl = resolveSmartLink("{{facebook}}", hotelLinkData);
        resolvedProps.twitterUrl = resolveSmartLink("{{twitter}}", hotelLinkData);
        break;
      case "rooms_grid":
      case "rooms_showcase":
        resolvedProps.ctaLink = resolveSmartLink("{{booking}}", hotelLinkData);
        break;
    }

    return {
      id: section.id,
      componentVariant: section.componentVariant,
      props: resolvedProps,
      sortOrder: section.sortOrder,
      isVisible: section.isVisible,
      customCss: section.customCss ?? null,
      customHtml: section.customHtml ?? null,
      customMode: section.customMode ?? false,
    };
  });

  // Parse theme data
  let themeData = hotel.theme
    ? ({
        colorTokens: hotel.theme.colorTokens,
        typography: hotel.theme.typography,
        spacing: hotel.theme.spacing,
        baseTemplate: hotel.theme.baseTemplate,
      } as unknown as ThemeData)
    : null;

  // Apply org brand theme override if present
  const orgBrandTheme = (hotel as any).org?.brandTheme as Record<string, any> | null;
  if (orgBrandTheme && orgBrandTheme.colorTokens) {
    themeData = {
      colorTokens: orgBrandTheme.colorTokens,
      typography: orgBrandTheme.typography || themeData?.colorTokens,
      spacing: orgBrandTheme.spacing || themeData?.spacing,
      baseTemplate: orgBrandTheme.baseTemplate || themeData?.baseTemplate,
    } as any;
  }

  // Inject org locked sections (pinned top/bottom across all pages)
  const orgLockedSections = ((hotel as any).org?.lockedSections || []) as Array<{
    id: string; label: string; position: string; componentVariant: string;
    props: Record<string, unknown>; customHtml?: string; customMode?: boolean;
  }>;

  const topLocked = orgLockedSections.filter(s => s.position === "top").map(s => ({
    id: s.id, componentVariant: s.componentVariant, props: resolvePropsLinks(s.props || {}, hotelLinkData),
    sortOrder: -1000, isVisible: true, customCss: null,
    customHtml: s.customHtml || null, customMode: s.customMode || false,
  }));

  const bottomLocked = orgLockedSections.filter(s => s.position === "bottom").map(s => ({
    id: s.id, componentVariant: s.componentVariant, props: resolvePropsLinks(s.props || {}, hotelLinkData),
    sortOrder: 9999, isVisible: true, customCss: null,
    customHtml: s.customHtml || null, customMode: s.customMode || false,
  }));

  const allSections = [...topLocked, ...sections, ...bottomLocked];

  const metaTags = page.metaTags as Record<string, string> | null;
  const pageTitle = metaTags?.title ?? `${hotel.name} — Preview`;

  return (
    <>
      {/* Preview banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-stone-900 text-xs text-center py-2 font-medium tracking-wide">
        Preview Mode — {hotel.name} · {page.slug} ·{" "}
        <span className="capitalize">{page.pageType}</span>
      </div>

      {/* Language switcher */}
      {locales.length > 1 && (
        <div className="fixed top-10 right-4 z-40 flex gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-gray-200 text-xs">
          {locales.map((l) => {
            const resolvedSlugForLink = pageSlug === "/" ? "home" : pageSlug;
            const isActive = l === currentLocale;
            return (
              <a
                key={l}
                href={`/preview/${hotelId}/lang/${l}/${resolvedSlugForLink}`}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${isActive ? "bg-[#e85d45] text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {l.toUpperCase()}
              </a>
            );
          })}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateHotelSchema(hotel),
            ...generateRoomSchemas(rooms),
          ]),
        }}
      />

      <div className="pt-8">
        <PageRenderer
          sections={allSections}
          theme={themeData}
          hotelName={hotel.name}
        />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: PreviewPageProps) {
  const { hotelId, pageSlug } = await params;
  const resolvedSlug = pageSlug === "home" ? "/" : pageSlug;

  const page = await prisma.page.findFirst({
    where: { hotelId, slug: resolvedSlug },
    include: { hotel: true },
  });

  if (!page) return { title: "Preview" };

  const metaTags = page.metaTags as Record<string, string> | null;

  return {
    title: metaTags?.title ?? `${page.hotel.name} — ${page.slug}`,
    description: metaTags?.description ?? "",
    robots: { index: false, follow: false },
  };
}
