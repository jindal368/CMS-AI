import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { MediaAssetCreateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

const MediaAssetUpdateSchema = MediaAssetCreateSchema.partial().omit({
  hotelId: true,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { id } = await params;

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return errorResponse("Media asset not found", 404);

    return successResponse(asset);
  } catch (err) {
    console.error("[GET /api/media/[id]]", err);
    return errorResponse("Failed to fetch media asset", 500);
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
    const { data, error } = await parseBody(request, MediaAssetUpdateSchema);
    if (error) return error;

    const existing = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) return errorResponse("Media asset not found", 404);

    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(data.url !== undefined && { url: data.url }),
        ...(data.altText !== undefined && { altText: data.altText }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.variants !== undefined && { variants: data.variants }),
        ...(data.mimeType !== undefined && { mimeType: data.mimeType }),
        ...(data.fileSize !== undefined && { fileSize: data.fileSize }),
      },
    });

    return successResponse(asset);
  } catch (err) {
    console.error("[PUT /api/media/[id]]", err);
    return errorResponse("Failed to update media asset", 500);
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

    const existing = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) return errorResponse("Media asset not found", 404);

    await prisma.mediaAsset.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/media/[id]]", err);
    return errorResponse("Failed to delete media asset", 500);
  }
}
