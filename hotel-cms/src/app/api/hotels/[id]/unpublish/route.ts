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

    const hotel = await prisma.hotel.findUnique({ where: { id } });

    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    await revalidateHotelPages(id);

    await prisma.hotel.update({
      where: { id },
      data: { publishedAt: null },
    });

    return successResponse({ published: false });
  } catch (err) {
    console.error("[POST /api/hotels/[id]/unpublish]", err);
    return errorResponse("Failed to unpublish hotel", 500);
  }
}
