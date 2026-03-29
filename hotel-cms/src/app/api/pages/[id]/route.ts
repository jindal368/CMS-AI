import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { PageUpdateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { id } = await params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!page) {
      return errorResponse("Page not found", 404);
    }

    // Verify hotel access
    const hotelAuth = await requireHotelAccess(request, page.hotelId);
    if (hotelAuth.response) return hotelAuth.response;

    return successResponse(page);
  } catch (err) {
    console.error("[GET /api/pages/[id]]", err);
    return errorResponse("Failed to fetch page");
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

    const existing = await prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Page not found", 404);
    }

    // Verify hotel access
    const hotelAuth = await requireHotelAccess(request, existing.hotelId);
    if (hotelAuth.response) return hotelAuth.response;

    const { data, error } = await parseBody(request, PageUpdateSchema);
    if (error) return error;

    const updated = await prisma.page.update({
      where: { id },
      data,
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[PUT /api/pages/[id]]", err);
    return errorResponse("Failed to update page");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    // Require at least editor role for deletion
    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const existing = await prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Page not found", 404);
    }

    // Verify hotel access
    const hotelAuth = await requireHotelAccess(request, existing.hotelId);
    if (hotelAuth.response) return hotelAuth.response;

    await prisma.page.delete({ where: { id } });

    return successResponse({ message: "Page deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/pages/[id]]", err);
    return errorResponse("Failed to delete page");
  }
}
