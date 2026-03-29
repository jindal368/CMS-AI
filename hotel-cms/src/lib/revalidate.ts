import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function revalidateHotelPages(hotelId: string): Promise<void> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { org: true, pages: { select: { slug: true, locale: true } } },
  });
  if (!hotel?.org || !hotel.hotelSlug) return;

  const orgSlug = hotel.org.slug;
  const hotelSlug = hotel.hotelSlug;

  try {
    // Revalidate property directory
    revalidatePath(`/site/${orgSlug}`);

    // Revalidate hotel homepage
    revalidatePath(`/site/${orgSlug}/${hotelSlug}`);

    // Revalidate each page
    for (const page of hotel.pages) {
      const pageSlug = page.slug === "/" ? "" : `/${page.slug}`;
      revalidatePath(`/site/${orgSlug}/${hotelSlug}${pageSlug}`);
      if (page.locale && page.locale !== "en") {
        revalidatePath(`/site/${orgSlug}/${hotelSlug}/${page.locale}${pageSlug}`);
      }
    }
  } catch {
    // revalidatePath can fail in dev — ignore silently
  }
}
