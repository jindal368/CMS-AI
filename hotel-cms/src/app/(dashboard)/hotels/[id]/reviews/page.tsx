import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReviewsManager from "@/components/cms/ReviewsManager";

export const dynamic = "force-dynamic";

export default async function ReviewsPage(props: {
  params: Promise<{ id: string }>;
}) {
  await getSessionOrRedirect();

  const { id } = await props.params;

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!hotel) notFound();

  const reviews = await prisma.review.findMany({
    where: { hotelId: id },
    orderBy: { createdAt: "desc" },
  });

  // Inline stats queries
  const [totalCount, respondedCount] = await Promise.all([
    prisma.review.count({ where: { hotelId: id } }),
    prisma.review.count({ where: { hotelId: id, status: "responded" } }),
  ]);

  const avgRatingResult = await prisma.review.aggregate({
    where: { hotelId: id },
    _avg: { rating: true },
  });

  const pendingCount = await prisma.review.count({
    where: { hotelId: id, status: "pending" },
  });

  const avgRating = avgRatingResult._avg.rating ?? 0;
  const responseRate =
    totalCount > 0 ? Math.round((respondedCount / totalCount) * 100) : 0;

  // Serialize dates
  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    hotelId: r.hotelId,
    guestName: r.guestName,
    reviewText: r.reviewText,
    rating: r.rating,
    source: r.source,
    reviewDate: r.reviewDate ? r.reviewDate.toISOString() : null,
    sentiment: r.sentiment,
    aiResponse: r.aiResponse,
    finalResponse: r.finalResponse,
    status: r.status,
    respondedAt: r.respondedAt ? r.respondedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#7c7893]">
        <Link href="/hotels" className="hover:text-[#1a1a2e] transition-colors">
          Hotels
        </Link>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <Link
          href={`/hotels/${id}`}
          className="hover:text-[#1a1a2e] transition-colors"
        >
          {hotel.name}
        </Link>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[#1a1a2e]">Reviews</span>
      </nav>

      <ReviewsManager
        hotelId={id}
        reviews={serializedReviews}
        stats={{
          total: totalCount,
          avgRating: Math.round(avgRating * 10) / 10,
          responseRate,
          pending: pendingCount,
        }}
        hotelName={hotel.name}
      />
    </div>
  );
}
