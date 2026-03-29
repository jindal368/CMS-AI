import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { PageCreateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    if (!hotelId) {
      return errorResponse("Missing required query parameter: hotelId", 400);
    }

    // Verify the hotel belongs to the user's org before returning pages
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { orgId: true },
    });

    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    if (hotel.orgId && hotel.orgId !== auth.user.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const pages = await prisma.page.findMany({
      where: { hotelId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { sections: true } },
      },
    });

    const result = pages.map((page) => ({
      id: page.id,
      hotelId: page.hotelId,
      slug: page.slug,
      locale: page.locale,
      pageType: page.pageType,
      sortOrder: page.sortOrder,
      metaTags: page.metaTags,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      sectionCount: page._count.sections,
    }));

    return successResponse(result);
  } catch (err) {
    console.error("[GET /api/pages]", err);
    return errorResponse("Failed to fetch pages");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    // Require at least editor role
    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const { data, error } = await parseBody(request, PageCreateSchema);
    if (error) return error;

    const page = await prisma.page.create({
      data: {
        hotelId: data.hotelId,
        slug: data.slug,
        locale: data.locale,
        pageType: data.pageType,
        sortOrder: data.sortOrder,
        metaTags: data.metaTags,
      },
    });

    return successResponse(page, 201);
  } catch (err) {
    console.error("[POST /api/pages]", err);
    return errorResponse("Failed to create page");
  }
}
