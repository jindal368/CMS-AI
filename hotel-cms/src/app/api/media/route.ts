import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { MediaAssetCreateSchema } from "@/lib/schemas";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return errorResponse("Missing required query parameter: hotelId", 400);
    }

    const assets = await prisma.mediaAsset.findMany({
      where: { hotelId },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(assets);
  } catch (err) {
    console.error("[GET /api/media]", err);
    return errorResponse("Failed to fetch media assets", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, MediaAssetCreateSchema);
    if (error) return error;

    const asset = await prisma.mediaAsset.create({
      data: {
        hotelId: data.hotelId,
        url: data.url,
        altText: data.altText,
        tags: data.tags,
        variants: data.variants,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
      },
    });

    return successResponse(asset, 201);
  } catch (err) {
    console.error("[POST /api/media]", err);
    return errorResponse("Failed to create media asset", 500);
  }
}
