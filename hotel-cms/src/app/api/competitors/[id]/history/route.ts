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
    });

    if (!competitor) {
      return errorResponse("Competitor not found", 404);
    }

    const access = await requireHotelAccess(request, competitor.hotelId);
    if (access.response) return access.response;

    const scans = await prisma.competitorScan.findMany({
      where: { competitorId: id },
      orderBy: { scannedAt: "desc" },
      take: 10,
    });

    return successResponse(scans);
  } catch (err) {
    console.error("[GET /api/competitors/[id]/history]", err);
    return errorResponse("Failed to fetch scan history", 500);
  }
}
