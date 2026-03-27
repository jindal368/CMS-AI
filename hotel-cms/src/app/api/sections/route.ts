import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SectionCreateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, SectionCreateSchema);
    if (error) return error;

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
