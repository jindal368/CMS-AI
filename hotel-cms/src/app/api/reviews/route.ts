import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";
import {
  deriveSentiment,
  generateReviewResponse,
} from "@/lib/reviews/generate-response";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { searchParams } = request.nextUrl;
    const hotelId = searchParams.get("hotelId");
    if (!hotelId) {
      return errorResponse("hotelId is required", 400);
    }

    const access = await requireHotelAccess(request, hotelId);
    if (access.response) return access.response;

    const status = searchParams.get("status") ?? undefined;
    const source = searchParams.get("source") ?? undefined;
    const sentiment = searchParams.get("sentiment") ?? undefined;

    const reviews = await prisma.review.findMany({
      where: {
        hotelId,
        ...(status ? { status: status as "pending" | "responded" | "skipped" } : {}),
        ...(source ? { source } : {}),
        ...(sentiment ? { sentiment } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(reviews);
  } catch (err) {
    console.error("[GET /api/reviews]", err);
    return errorResponse("Failed to fetch reviews", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { hotelId, guestName, reviewText, rating, source, reviewDate } =
      body ?? {};

    if (!hotelId || typeof hotelId !== "string" || hotelId.trim() === "") {
      return errorResponse("hotelId is required", 400);
    }
    if (
      !guestName ||
      typeof guestName !== "string" ||
      guestName.trim() === ""
    ) {
      return errorResponse("guestName must be a non-empty string", 400);
    }
    if (
      !reviewText ||
      typeof reviewText !== "string" ||
      reviewText.trim() === ""
    ) {
      return errorResponse("reviewText must be a non-empty string", 400);
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return errorResponse("rating must be a number between 1 and 5", 400);
    }

    const access = await requireHotelAccess(request, hotelId);
    if (access.response) return access.response;

    const sentiment = deriveSentiment(rating);

    const review = await prisma.review.create({
      data: {
        hotelId,
        guestName: guestName.trim(),
        reviewText: reviewText.trim(),
        rating,
        source: source ?? "google",
        sentiment,
        ...(reviewDate ? { reviewDate: new Date(reviewDate) } : {}),
      },
    });

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: { context: true },
    });

    let aiResponse: string | null = null;
    try {
      if (hotel) {
        aiResponse = await generateReviewResponse(
          { guestName: review.guestName, reviewText: review.reviewText, rating: review.rating, sentiment },
          {
            name: hotel.name,
            category: hotel.category,
            brandVoice: hotel.context?.brandVoice ?? "",
          }
        );
        await prisma.review.update({
          where: { id: review.id },
          data: { aiResponse },
        });
      }
    } catch (genErr) {
      console.error("[POST /api/reviews] generateReviewResponse failed", genErr);
    }

    return successResponse({ ...review, aiResponse }, 201);
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return errorResponse("Failed to create review", 500);
  }
}
