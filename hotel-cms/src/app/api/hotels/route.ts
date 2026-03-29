import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { HotelCreateSchema } from "@/lib/schemas";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const hotels = await prisma.hotel.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Filter to hotels belonging to the user's org (or org-less hotels)
    let filtered = hotels.filter(
      (hotel) => hotel.orgId === auth.user.orgId || hotel.orgId === null
    );

    // For non-admins, further filter by hotelAccess list if non-empty
    if (auth.user.role !== "admin") {
      const access = (auth.user.hotelAccess as string[]) || [];
      if (access.length > 0) {
        filtered = filtered.filter((hotel) => access.includes(hotel.id));
      }
    }

    return successResponse(filtered);
  } catch (err) {
    console.error("[GET /api/hotels]", err);
    return errorResponse("Failed to fetch hotels", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const { data, error } = await parseBody(request, HotelCreateSchema);
    if (error) return error;

    const hotel = await prisma.hotel.create({
      data: {
        name: data.name,
        category: data.category,
        contactInfo: data.contactInfo,
        seoConfig: data.seoConfig ?? {},
        defaultLocale: data.defaultLocale,
        orgId: auth.user.orgId,
      },
    });

    return successResponse(hotel, 201);
  } catch (err) {
    console.error("[POST /api/hotels]", err);
    return errorResponse("Failed to create hotel", 500);
  }
}
