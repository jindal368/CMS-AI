import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { ThemeSchema } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hotel = await prisma.hotel.findUnique({ where: { id } });
    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    const theme = await prisma.theme.findUnique({ where: { hotelId: id } });
    if (!theme) {
      return errorResponse("Theme not found", 404);
    }

    return successResponse(theme);
  } catch (err) {
    console.error("[GET /api/hotels/[id]/theme]", err);
    return errorResponse("Failed to fetch theme", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hotel = await prisma.hotel.findUnique({ where: { id } });
    if (!hotel) {
      return errorResponse("Hotel not found", 404);
    }

    const { data, error } = await parseBody(request, ThemeSchema);
    if (error) return error;

    const theme = await prisma.theme.upsert({
      where: { hotelId: id },
      create: {
        hotelId: id,
        colorTokens: data.colorTokens,
        typography: data.typography,
        spacing: data.spacing,
        baseTemplate: data.baseTemplate,
      },
      update: {
        colorTokens: data.colorTokens,
        typography: data.typography,
        spacing: data.spacing,
        baseTemplate: data.baseTemplate,
      },
    });

    return successResponse(theme);
  } catch (err) {
    console.error("[PUT /api/hotels/[id]/theme]", err);
    return errorResponse("Failed to upsert theme", 500);
  }
}
