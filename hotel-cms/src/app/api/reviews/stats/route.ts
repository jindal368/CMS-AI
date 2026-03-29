import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const hotelId = request.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return errorResponse("hotelId is required", 400);
    }

    const access = await requireHotelAccess(request, hotelId);
    if (access.response) return access.response;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      avgRatingAgg,
      responded,
      pending,
      bySource,
      bySentiment,
      thisMonthTotal,
      thisMonthResponded,
      thisMonthPending,
    ] = await Promise.all([
      prisma.review.count({ where: { hotelId } }),
      prisma.review.aggregate({ where: { hotelId }, _avg: { rating: true } }),
      prisma.review.count({ where: { hotelId, status: "responded" } }),
      prisma.review.count({ where: { hotelId, status: "pending" } }),
      prisma.review.groupBy({
        by: ["source"],
        where: { hotelId },
        _count: true,
      }),
      prisma.review.groupBy({
        by: ["sentiment"],
        where: { hotelId },
        _count: true,
      }),
      prisma.review.count({
        where: { hotelId, createdAt: { gte: monthStart } },
      }),
      prisma.review.count({
        where: { hotelId, status: "responded", createdAt: { gte: monthStart } },
      }),
      prisma.review.count({
        where: { hotelId, status: "pending", createdAt: { gte: monthStart } },
      }),
    ]);

    const responseRate = Math.round((responded / total) * 100) || 0;
    const thisMonthResponseRate =
      Math.round((thisMonthResponded / thisMonthTotal) * 100) || 0;

    return successResponse({
      total,
      avgRating: avgRatingAgg._avg.rating,
      responded,
      pending,
      responseRate,
      bySource,
      bySentiment,
      thisMonth: {
        total: thisMonthTotal,
        responded: thisMonthResponded,
        pending: thisMonthPending,
        responseRate: thisMonthResponseRate,
      },
    });
  } catch (err) {
    console.error("[GET /api/reviews/stats]", err);
    return errorResponse("Failed to fetch review stats", 500);
  }
}
