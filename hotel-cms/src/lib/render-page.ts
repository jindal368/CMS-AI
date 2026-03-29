import { prisma } from "@/lib/db";
import { resolvePropsLinks, resolveSmartLink, HotelLinkData } from "@/lib/smart-links";
import { generateHotelSchema, generateRoomSchemas } from "@/lib/seo/structured-data";
import type { ThemeData } from "@/lib/schemas";

export interface PageRenderData {
  hotel: any;
  page: any;
  sections: any[]; // enriched, smart-link-resolved, with locked sections injected
  themeData: any;
  rooms: any[];
  media: any[];
  hotelLinkData: HotelLinkData;
  structuredData: any[];
  locales: string[];
}

export async function getHotelPageData(
  hotelId: string,
  pageSlug: string,
  locale?: string
): Promise<PageRenderData | null> {
  // The home page is stored with slug "/" but "/" cannot appear in a URL segment.
  // We accept "home" as an alias for "/".
  const resolvedSlug = pageSlug === "home" ? "/" : pageSlug;

  // 1. Fetch hotel with: theme, org (for brandTheme + lockedSections), rooms, media (take 20)
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { theme: true, org: true },
  });

  if (!hotel) return null;

  const [rooms, mediaAssets] = await Promise.all([
    prisma.room.findMany({
      where: { hotelId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.mediaAsset.findMany({
      where: { hotelId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // 2. Fetch page by hotelId + slug + locale. If locale provided and page not found, fallback to "en"
  let page = await prisma.page.findFirst({
    where: {
      hotelId,
      slug: resolvedSlug,
      ...(locale ? { locale } : {}),
    },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!page && locale) {
    // Fallback to "en"
    page = await prisma.page.findFirst({
      where: { hotelId, slug: resolvedSlug, locale: "en" },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  if (!page) return null;

  // 3. Fetch sections is already included in page above (orderBy sortOrder)

  // 4. Build hotelLinkData from hotel.links + contactInfo
  const hotelLinkData: HotelLinkData = {
    id: hotel.id,
    links: (hotel.links as Record<string, string>) || {},
    contactInfo: (hotel.contactInfo as Record<string, any>) || {},
  };

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

  // 5. Enrich section props per component type
  const sections = page.sections.map((section: (typeof page.sections)[number]) => {
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

    // 6. Resolve smart links on all enriched props
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

  // 7. Apply org brand theme override if org.brandTheme exists
  let themeData = hotel.theme
    ? ({
        colorTokens: hotel.theme.colorTokens,
        typography: hotel.theme.typography,
        spacing: hotel.theme.spacing,
        baseTemplate: hotel.theme.baseTemplate,
      } as unknown as ThemeData)
    : null;

  const orgBrandTheme = (hotel as any).org?.brandTheme as Record<string, any> | null;
  if (orgBrandTheme && orgBrandTheme.colorTokens) {
    themeData = {
      colorTokens: orgBrandTheme.colorTokens,
      typography: orgBrandTheme.typography || themeData?.colorTokens,
      spacing: orgBrandTheme.spacing || themeData?.spacing,
      baseTemplate: orgBrandTheme.baseTemplate || themeData?.baseTemplate,
    } as any;
  }

  // 8. Inject org locked sections (top at sortOrder -1000, bottom at 9999), resolve their smart links too
  const orgLockedSections = ((hotel as any).org?.lockedSections || []) as Array<{
    id: string;
    label: string;
    position: string;
    componentVariant: string;
    props: Record<string, unknown>;
    customHtml?: string;
    customMode?: boolean;
  }>;

  const topLocked = orgLockedSections
    .filter((s) => s.position === "top")
    .map((s) => ({
      id: s.id,
      componentVariant: s.componentVariant,
      props: resolvePropsLinks(s.props || {}, hotelLinkData),
      sortOrder: -1000,
      isVisible: true,
      customCss: null,
      customHtml: s.customHtml || null,
      customMode: s.customMode || false,
    }));

  const bottomLocked = orgLockedSections
    .filter((s) => s.position === "bottom")
    .map((s) => ({
      id: s.id,
      componentVariant: s.componentVariant,
      props: resolvePropsLinks(s.props || {}, hotelLinkData),
      sortOrder: 9999,
      isVisible: true,
      customCss: null,
      customHtml: s.customHtml || null,
      customMode: s.customMode || false,
    }));

  // 9. Combine: allSections = [...topLocked, ...sections, ...bottomLocked]
  const allSections = [...topLocked, ...sections, ...bottomLocked];

  // 10. Generate structured data
  const structuredData = [generateHotelSchema(hotel), ...generateRoomSchemas(rooms)];

  // 11. Query distinct locales for this hotel
  const localeRows = await prisma.page.findMany({
    where: { hotelId },
    select: { locale: true },
    distinct: ["locale"],
  });
  const locales = localeRows
    .map((r: { locale: string | null }) => r.locale)
    .filter(Boolean) as string[];

  // 12. Return all data
  return {
    hotel,
    page,
    sections: allSections,
    themeData,
    rooms,
    media: mediaAssets,
    hotelLinkData,
    structuredData,
    locales,
  };
}
