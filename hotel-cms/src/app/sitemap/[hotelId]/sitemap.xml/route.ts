import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { hotelId } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true },
  });

  if (!hotel) {
    return new Response("Hotel not found", { status: 404 });
  }

  const pages = await prisma.page.findMany({
    where: { hotelId },
    orderBy: { sortOrder: "asc" },
    include: { sections: { select: { updatedAt: true } } },
  });

  const urls = pages.map((page) => {
    const sectionDates = page.sections.map((s) => s.updatedAt.getTime());
    const latestSectionDate =
      sectionDates.length > 0 ? Math.max(...sectionDates) : null;

    const lastmod =
      latestSectionDate !== null
        ? new Date(latestSectionDate).toISOString()
        : page.updatedAt.toISOString();

    const resolvedSlug = page.slug === "/" ? "home" : page.slug;
    const priority = page.slug === "/" ? "1.0" : "0.8";

    return `  <url>
    <loc>http://localhost:3000/preview/${hotelId}/${resolvedSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
