import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";
import { scanCompetitor } from "@/lib/competitors/scan";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const hotelId = request.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return errorResponse("hotelId is required", 400);
    }

    const access = await requireHotelAccess(request, hotelId);
    if (access.response) return access.response;

    const competitors = await prisma.competitor.findMany({
      where: { hotelId },
      include: {
        scans: {
          orderBy: { scannedAt: "desc" },
          take: 1,
        },
      },
    });

    return successResponse(competitors);
  } catch (err) {
    console.error("[GET /api/competitors]", err);
    return errorResponse("Failed to fetch competitors", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { hotelId, name, url } = body ?? {};

    if (!hotelId || !name || !url) {
      return errorResponse("hotelId, name, and url are required", 400);
    }

    if (
      typeof hotelId !== "string" || hotelId.trim() === "" ||
      typeof name !== "string" || name.trim() === "" ||
      typeof url !== "string" || url.trim() === ""
    ) {
      return errorResponse("hotelId, name, and url must be non-empty strings", 400);
    }

    const access = await requireHotelAccess(request, hotelId);
    if (access.response) return access.response;

    const count = await prisma.competitor.count({ where: { hotelId } });
    if (count >= 5) {
      return errorResponse("Maximum of 5 competitors allowed per hotel", 400);
    }

    const competitor = await prisma.competitor.create({
      data: {
        hotelId,
        name: name.trim(),
        url: url.trim(),
      },
    });

    let scan: { changes: unknown[]; insights: unknown[] } = { changes: [], insights: [] };
    try {
      scan = await scanCompetitor(competitor.id, hotelId);
    } catch (scanErr) {
      console.error("[POST /api/competitors] baseline scan failed", scanErr);
    }

    return successResponse({ competitor, scan }, 201);
  } catch (err) {
    console.error("[POST /api/competitors]", err);
    return errorResponse("Failed to create competitor", 500);
  }
}
