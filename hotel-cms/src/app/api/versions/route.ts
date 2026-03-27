import { NextRequest } from "next/server";
import { getVersionTimeline } from "@/lib/versioning";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return errorResponse("Missing required query parameter: hotelId", 400);
    }

    const timeline = await getVersionTimeline(hotelId);

    return successResponse(timeline);
  } catch (err) {
    console.error("[GET /api/versions]", err);
    return errorResponse("Failed to fetch version timeline", 500);
  }
}
