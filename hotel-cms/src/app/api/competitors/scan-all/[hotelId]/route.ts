import { type NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";
import { scanAllCompetitors } from "@/lib/competitors/scan";

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;

    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const access = await requireHotelAccess(request, hotelId);
    if (access.response) return access.response;

    const result = await scanAllCompetitors(hotelId);

    return successResponse(result);
  } catch (err) {
    console.error("[POST /api/competitors/scan-all/[hotelId]]", err);
    return errorResponse("Failed to scan all competitors", 500);
  }
}
