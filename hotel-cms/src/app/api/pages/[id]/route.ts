import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { PageUpdateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;

    const existing = await prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Page not found", 404);
    }

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Page not found", 404);
    }

    await prisma.page.delete({ where: { id } });

    return successResponse({ message: "Page deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/pages/[id]]", err);
    return errorResponse("Failed to delete page");
  }
}
