import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SectionCreateSchema } from "@/lib/schemas";
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

    const { data, error } = await parseBody(request, SectionCreateSchema);
    if (error) return error;

    // Resolve hotelId through section→page→hotel chain
    const page = await prisma.page.findUnique({
      where: { id: data.pageId },
      select: { hotelId: true },
    });

    if (!page) {
      return errorResponse("Page not found", 404);
    }

    const hotelAuth = await requireHotelAccess(request, page.hotelId);
    if (hotelAuth.response) return hotelAuth.response;

    const section = await prisma.section.create({
      data: {
        pageId: data.pageId,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
        componentVariant: data.componentVariant,
        props: data.props as any,
      },
    });

    return successResponse(section, 201);
  } catch (err) {
    console.error("[POST /api/sections]", err);
    return errorResponse("Failed to create section", 500);
  }
}
