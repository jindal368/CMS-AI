import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { RoomUpdateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { createVersion } from "@/lib/versioning";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return errorResponse("Room not found", 404);
    }

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
    const { id } = await params;

    const existing = await prisma.room.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Room not found", 404);
    }

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.room.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Room not found", 404);
    }

    await prisma.room.delete({ where: { id } });

    return successResponse({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/rooms/[id]]", err);
    return errorResponse("Failed to delete room");
  }
}
