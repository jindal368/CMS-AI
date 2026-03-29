import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: {
        scans: {
          orderBy: { scannedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!competitor) {
      return errorResponse("Competitor not found", 404);
    }

    const access = await requireHotelAccess(request, competitor.hotelId);
    if (access.response) return access.response;

    return successResponse(competitor);
  } catch (err) {
    console.error("[GET /api/competitors/[id]]", err);
    return errorResponse("Failed to fetch competitor", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const competitor = await prisma.competitor.findUnique({
      where: { id },
    });

    if (!competitor) {
      return errorResponse("Competitor not found", 404);
    }

    const access = await requireHotelAccess(request, competitor.hotelId);
    if (access.response) return access.response;

    await prisma.competitor.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/competitors/[id]]", err);
    return errorResponse("Failed to delete competitor", 500);
  }
}
