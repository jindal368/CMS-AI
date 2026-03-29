import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { HotelUpdateSchema } from "@/lib/schemas";
import { createVersion } from "@/lib/versioning";
import { requireHotelAccess, requireRole } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireHotelAccess(request, id);
    if (auth.response) return auth.response;

    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        theme: true,
        pages: {
          orderBy: { sortOrder: "asc" },
        },
        rooms: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    return successResponse(hotel);
  } catch (err) {
    console.error("[GET /api/hotels/[id]]", err);
    return errorResponse("Failed to fetch hotel", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireHotelAccess(request, id);
    if (auth.response) return auth.response;

    // Require at least editor role
    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const existing = await prisma.hotel.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Hotel not found", 404);
    }

    const { data, error } = await parseBody(request, HotelUpdateSchema);
    if (error) return error;

    const before: Record<string, unknown> = {
      name: existing.name,
      category: existing.category,
      contactInfo: existing.contactInfo,
      seoConfig: existing.seoConfig,
      links: existing.links,
      defaultLocale: existing.defaultLocale,
    };

    const updated = await prisma.hotel.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.contactInfo !== undefined && { contactInfo: data.contactInfo }),
        ...(data.seoConfig !== undefined && { seoConfig: data.seoConfig }),
        ...(data.links !== undefined && { links: data.links }),
        ...(data.defaultLocale !== undefined && {
          defaultLocale: data.defaultLocale,
        }),
      },
    });

    const after: Record<string, unknown> = {
      name: updated.name,
      category: updated.category,
      contactInfo: updated.contactInfo,
      seoConfig: updated.seoConfig,
      links: updated.links,
      defaultLocale: updated.defaultLocale,
    };

    await createVersion({
      hotelId: id,
      before,
      after,
      description: "Hotel updated via API",
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[PUT /api/hotels/[id]]", err);
    return errorResponse("Failed to update hotel", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireHotelAccess(request, id);
    if (auth.response) return auth.response;

    // Require admin role for deletion
    if (auth.user.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    const existing = await prisma.hotel.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Hotel not found", 404);
    }

    await prisma.hotel.delete({ where: { id } });

    return successResponse({ deleted: true, id });
  } catch (err) {
    console.error("[DELETE /api/hotels/[id]]", err);
    return errorResponse("Failed to delete hotel", 500);
  }
}
