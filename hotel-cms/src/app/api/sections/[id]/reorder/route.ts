import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";

const ReorderSchema = z.object({
  sortOrder: z.number().int(),
});

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
    const { data, error } = await parseBody(request, ReorderSchema);
    if (error) return error;

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) return errorResponse("Section not found", 404);

    // Resolve hotelId through section→page→hotel chain
    const page = await prisma.page.findUnique({
      where: { id: existing.pageId },
      select: { hotelId: true },
    });

    if (page) {
      const hotelAuth = await requireHotelAccess(request, page.hotelId);
      if (hotelAuth.response) return hotelAuth.response;
    }

    const section = await prisma.section.update({
      where: { id },
      data: { sortOrder: data.sortOrder },
    });

    return successResponse(section);
  } catch (err) {
    console.error("[PUT /api/sections/[id]/reorder]", err);
    return errorResponse("Failed to reorder section", 500);
  }
}
