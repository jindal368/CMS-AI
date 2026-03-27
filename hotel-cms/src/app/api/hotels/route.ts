import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { HotelCreateSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: { createdAt: "desc" },
    });
    return successResponse(hotels);
  } catch (err) {
    console.error("[GET /api/hotels]", err);
    return errorResponse("Failed to fetch hotels", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, HotelCreateSchema);
    if (error) return error;

    const hotel = await prisma.hotel.create({
      data: {
        name: data.name,
        category: data.category,
        contactInfo: data.contactInfo,
        seoConfig: data.seoConfig ?? {},
        defaultLocale: data.defaultLocale,
      },
    });

    return successResponse(hotel, 201);
  } catch (err) {
    console.error("[POST /api/hotels]", err);
    return errorResponse("Failed to create hotel", 500);
  }
}
