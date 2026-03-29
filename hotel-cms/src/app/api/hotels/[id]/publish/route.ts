import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireHotelAccess, requireRole } from "@/lib/auth";
import { revalidateHotelPages } from "@/lib/revalidate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const hotelAuth = await requireHotelAccess(request, id);
    if (hotelAuth.response) return hotelAuth.response;

    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: { pages: { select: { id: true } } },
    });

    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    if (hotel.pages.length === 0) {
      return errorResponse("Hotel must have at least one page to publish", 400);
    }

    const hotelSlug =
      hotel.hotelSlug ||
      hotel.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const updated = await prisma.hotel.update({
      where: { id },
      data: {
        publishedAt: new Date(),
        hotelSlug,
      },
    });

    await revalidateHotelPages(id);

    return successResponse({
      published: true,
      hotelSlug: updated.hotelSlug,
      url: `/${updated.hotelSlug}/`,
    });
  } catch (err) {
    console.error("[POST /api/hotels/[id]/publish]", err);
    return errorResponse("Failed to publish hotel", 500);
  }
}
