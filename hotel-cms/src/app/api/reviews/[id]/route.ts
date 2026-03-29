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

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return errorResponse("Review not found", 404);
    }

    const access = await requireHotelAccess(request, review.hotelId);
    if (access.response) return access.response;

    return successResponse(review);
  } catch (err) {
    console.error("[GET /api/reviews/[id]]", err);
    return errorResponse("Failed to fetch review", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return errorResponse("Review not found", 404);
    }

    const access = await requireHotelAccess(request, review.hotelId);
    if (access.response) return access.response;

    const body = await request.json();
    const { finalResponse, status } = body ?? {};

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(finalResponse !== undefined ? { finalResponse } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(status === "responded" ? { respondedAt: new Date() } : {}),
      },
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[PUT /api/reviews/[id]]", err);
    return errorResponse("Failed to update review", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return errorResponse("Review not found", 404);
    }

    const access = await requireHotelAccess(request, review.hotelId);
    if (access.response) return access.response;

    await prisma.review.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/reviews/[id]]", err);
    return errorResponse("Failed to delete review", 500);
  }
}
