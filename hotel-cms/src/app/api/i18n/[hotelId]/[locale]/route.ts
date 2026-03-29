import { type NextRequest } from "next/server";
import { requireHotelAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string; locale: string }> }
) {
  try {
    const { hotelId, locale } = await params;

    const auth = await requireHotelAccess(request, hotelId);
    if (auth.response) return auth.response;

    if (auth.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { defaultLocale: true, enabledLocales: true },
    });

    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    if (locale === hotel.defaultLocale) {
      return errorResponse("Cannot delete default locale", 400);
    }

    await prisma.page.deleteMany({ where: { hotelId, locale } });

    const enabledLocales = (hotel.enabledLocales as string[]) ?? [];
    const updatedLocales = enabledLocales.filter((l) => l !== locale);

    await prisma.hotel.update({
      where: { id: hotelId },
      data: { enabledLocales: updatedLocales },
    });

    return successResponse({ deleted: true, locale });
  } catch (err) {
    console.error("[DELETE /api/i18n/[hotelId]/[locale]]", err);
    return errorResponse("Failed to delete locale", 500);
  }
}
