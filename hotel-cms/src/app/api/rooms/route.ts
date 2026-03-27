import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { RoomCreateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, RoomCreateSchema);
    if (error) return error;

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
