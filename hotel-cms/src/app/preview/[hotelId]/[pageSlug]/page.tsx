import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PageRenderer from "@/components/renderer/PageRenderer";
import type { SectionData } from "@/components/renderer/RenderSection";
import type { ThemeData } from "@/lib/schemas";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ hotelId: string; pageSlug: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { hotelId, pageSlug } = await params;

  // The home page is stored with slug "/" but "/" cannot appear in a URL segment.
  // We accept "home" as an alias for "/".
  const resolvedSlug = pageSlug === "home" ? "/" : pageSlug;

  // Fetch hotel with theme
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { theme: true },
  });

  if (!hotel) notFound();

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

    return {
      id: section.id,
      componentVariant: section.componentVariant,
      props: enrichedProps,
      sortOrder: section.sortOrder,
      isVisible: section.isVisible,
      customCss: section.customCss ?? null,
      customHtml: section.customHtml ?? null,
      customMode: section.customMode ?? false,
    };
  });

  // Parse theme data
  const themeData = hotel.theme
    ? ({
        colorTokens: hotel.theme.colorTokens,
        typography: hotel.theme.typography,
        spacing: hotel.theme.spacing,
        baseTemplate: hotel.theme.baseTemplate,
      } as unknown as ThemeData)
    : null;

  const metaTags = page.metaTags as Record<string, string> | null;
  const pageTitle = metaTags?.title ?? `${hotel.name} — Preview`;

  return (
    <>
      {/* Preview banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-stone-900 text-xs text-center py-2 font-medium tracking-wide">
        Preview Mode — {hotel.name} · {page.slug} ·{" "}
        <span className="capitalize">{page.pageType}</span>
      </div>

      <div className="pt-8">
        <PageRenderer
          sections={sections}
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
