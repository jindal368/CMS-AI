import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";
import { scanCompetitor } from "@/lib/competitors/scan";

export const maxDuration = 120;

export async function POST(
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

    const result = await scanCompetitor(id, competitor.hotelId);

    return successResponse(result);
  } catch (err) {
    console.error("[POST /api/competitors/[id]/scan]", err);
    return errorResponse("Failed to scan competitor", 500);
  }
}
