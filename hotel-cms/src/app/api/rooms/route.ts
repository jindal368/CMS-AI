import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { RoomCreateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    // Require at least editor role
    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const { data, error } = await parseBody(request, RoomCreateSchema);
    if (error) return error;

    // Verify hotel access
    const hotelAuth = await requireHotelAccess(request, data.hotelId);
    if (hotelAuth.response) return hotelAuth.response;

    const room = await prisma.room.create({
      data: {
        hotelId: data.hotelId,
        name: data.name,
        description: data.description,
        pricing: data.pricing,
        amenities: data.amenities,
        maxGuests: data.maxGuests,
        images: data.images,
        sortOrder: data.sortOrder,
      },
    });

    return successResponse(room, 201);
  } catch (err) {
    console.error("[POST /api/rooms]", err);
    return errorResponse("Failed to create room");
  }
}
