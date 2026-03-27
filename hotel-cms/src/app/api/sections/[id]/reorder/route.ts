import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";

const ReorderSchema = z.object({
  sortOrder: z.number().int(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await parseBody(request, ReorderSchema);
    if (error) return error;

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) return errorResponse("Section not found", 404);

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
