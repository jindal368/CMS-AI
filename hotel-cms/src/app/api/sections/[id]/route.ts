import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SectionUpdateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";

const ConflictResolutionSchema = z
  .enum(["keep", "discard", "reapply"])
  .optional();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { id } = await params;

    const section = await prisma.section.findUnique({ where: { id } });
    if (!section) return errorResponse("Section not found", 404);

    // Resolve hotelId through section→page→hotel chain
    const page = await prisma.page.findUnique({
      where: { id: section.pageId },
      select: { hotelId: true },
    });

    if (page) {
      const hotelAuth = await requireHotelAccess(request, page.hotelId);
      if (hotelAuth.response) return hotelAuth.response;
    }

    return successResponse(section);
  } catch (err) {
    console.error("[GET /api/sections/[id]]", err);
    return errorResponse("Failed to fetch section", 500);
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

    // Parse the raw body once so we can extract both the validated fields and
    // the optional conflictResolution field that lives outside SectionUpdateSchema.
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const parsed = SectionUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Extract conflictResolution separately — it is not part of SectionUpdateSchema.
    const conflictResolutionRaw = (raw as Record<string, unknown>)
      ?.conflictResolution;
    const conflictResolutionParsed =
      ConflictResolutionSchema.safeParse(conflictResolutionRaw);
    const conflictResolution = conflictResolutionParsed.success
      ? conflictResolutionParsed.data
      : undefined;

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

    // Detect conflict: section has custom overrides AND this update is structural.
    const hasOverrides = !!(existing.customCss || existing.customHtml);
    const isStructuralChange =
      data.componentVariant !== undefined || data.props !== undefined;

    if (hasOverrides && isStructuralChange && !conflictResolution) {
      // Return 409 with enough context for the client to show ConflictModal.
      return Response.json(
        {
          conflict: true,
          overrideType: existing.customHtml ? "custom" : "enhanced",
          sectionId: id,
        },
        { status: 409 }
      );
    }

    // Build the override-clearing patch for discard / reapply resolutions.
    const clearOverrides =
      conflictResolution === "discard" || conflictResolution === "reapply"
        ? { customCss: null, customHtml: null, customMode: false }
        : {};

    const section = await prisma.section.update({
      where: { id },
      data: {
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
        ...(data.componentVariant !== undefined && {
          componentVariant: data.componentVariant,
        }),
        ...(data.props !== undefined && { props: data.props as any }),
        ...clearOverrides,
      },
    });

    // For reapply, signal the client that AI re-styling should be triggered.
    if (conflictResolution === "reapply") {
      return successResponse({ ...section, reapplyIntent: true });
    }

    return successResponse(section);
  } catch (err) {
    console.error("[PUT /api/sections/[id]]", err);
    return errorResponse("Failed to update section", 500);
  }
}

export async function DELETE(
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

    await prisma.section.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/sections/[id]]", err);
    return errorResponse("Failed to delete section", 500);
  }
}
