import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireHotelAccess } from "@/lib/auth";
import { generateReviewResponse } from "@/lib/reviews/generate-response";

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        hotel: {
          include: { context: true },
        },
      },
    });

    if (!review) {
      return errorResponse("Review not found", 404);
    }

    const access = await requireHotelAccess(request, review.hotelId);
    if (access.response) return access.response;

    const newResponse = await generateReviewResponse(
      {
        guestName: review.guestName,
        reviewText: review.reviewText,
        rating: review.rating,
        sentiment: review.sentiment,
      },
      {
        name: review.hotel.name,
        category: review.hotel.category,
        brandVoice: review.hotel.context?.brandVoice ?? "",
      }
    );

    await prisma.review.update({
      where: { id },
      data: { aiResponse: newResponse },
    });

    return successResponse({ aiResponse: newResponse });
  } catch (err) {
    console.error("[POST /api/reviews/[id]/regenerate]", err);
    return errorResponse("Failed to regenerate review response", 500);
  }
}
