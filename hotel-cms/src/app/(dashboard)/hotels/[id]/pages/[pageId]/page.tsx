import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PageBuilder from "@/components/cms/PageBuilder";

export const dynamic = 'force-dynamic';

async function getPageWithSections(pageId: string) {
  return prisma.page.findUnique({
    where: { id: pageId },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
      },
      hotel: {
        select: {
          id: true,
          name: true,
          category: true,
          org: {
            select: { lockedSections: true },
          },
        },
      },
    },
  });
}

export default async function PageBuilderPage(props: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const { id, pageId } = await props.params;
  const page = await getPageWithSections(pageId);

  if (!page || page.hotelId !== id) notFound();

  // Parse locked sections from org
  type LockedSection = { id: string; label: string; position: string; componentVariant: string };
  let lockedSections: LockedSection[] | undefined;
  if (page.hotel.org) {
    try {
      const raw = page.hotel.org.lockedSections;
      if (Array.isArray(raw)) {
        lockedSections = raw as LockedSection[];
      }
    } catch {
      // ignore parse errors
    }
  }

  // Serialize for client component
  const pageData = {
    id: page.id,
    slug: page.slug,
    pageType: page.pageType,
    locale: page.locale,
    hotelId: page.hotelId,
    hotel: { id: page.hotel.id, name: page.hotel.name, category: page.hotel.category },
    sections: page.sections.map((s: { id: string; sortOrder: number; isVisible: boolean; componentVariant: string; props: unknown; pageId: string; createdAt: Date; updatedAt: Date }) => ({
      id: s.id,
      sortOrder: s.sortOrder,
      isVisible: s.isVisible,
      componentVariant: s.componentVariant,
      props: s.props as Record<string, unknown>,
      pageId: s.pageId,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    metaTags: page.metaTags as Record<string, unknown>,
  };

  return <PageBuilder page={pageData} hotelId={id} lockedSections={lockedSections} />;
}
