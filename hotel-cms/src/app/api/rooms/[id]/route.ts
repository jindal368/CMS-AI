import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { RoomUpdateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { createVersion } from "@/lib/versioning";
import { requireAuth, requireHotelAccess } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { id } = await params;

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return errorResponse("Room not found", 404);
    }

    // Verify hotel access via room.hotelId
    const hotelAuth = await requireHotelAccess(request, room.hotelId);
    if (hotelAuth.response) return hotelAuth.response;

    return successResponse(room);
  } catch (err) {
    console.error("[GET /api/rooms/[id]]", err);
    return errorResponse("Failed to fetch room");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    // Require at least editor role
    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const existing = await prisma.room.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Room not found", 404);
    }

    // Verify hotel access via room.hotelId
    const hotelAuth = await requireHotelAccess(request, existing.hotelId);
    if (hotelAuth.response) return hotelAuth.response;

    const { data, error } = await parseBody(request, RoomUpdateSchema);
    if (error) return error;

    const updated = await prisma.room.update({
      where: { id },
      data,
    });

    // Snapshot a version whenever pricing changes
    const pricingChanged =
      data.pricing !== undefined &&
      JSON.stringify(existing.pricing) !== JSON.stringify(data.pricing);

    if (pricingChanged) {
      await createVersion({
        hotelId: existing.hotelId,
        before: { roomId: id, pricing: existing.pricing as Record<string, unknown> },
        after: { roomId: id, pricing: updated.pricing as Record<string, unknown> },
        description: `Room "${existing.name}" pricing updated`,
      });
    }

    return successResponse(updated);
  } catch (err) {
    console.error("[PUT /api/rooms/[id]]", err);
    return errorResponse("Failed to update room");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    // Require at least editor role
    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const existing = await prisma.room.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Room not found", 404);
    }

    // Verify hotel access via room.hotelId
    const hotelAuth = await requireHotelAccess(request, existing.hotelId);
    if (hotelAuth.response) return hotelAuth.response;

    await prisma.room.delete({ where: { id } });

    return successResponse({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/rooms/[id]]", err);
    return errorResponse("Failed to delete room");
  }
}
