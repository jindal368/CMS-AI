export interface ReviewData {
  id: string;
  author: string;
  rating: number;
  text: string;
  source?: string;
  date?: string;
  avatar?: string;
}

export interface ReviewsWallProps {
  maxReviews?: number;
  showRating?: boolean;
  showSource?: boolean;
  layout?: "grid" | "carousel" | "stack";
  reviews?: ReviewData[];
}

const placeholderReviews: ReviewData[] = [
  {
    id: "1",
    author: "Sophie M.",
    rating: 5,
    text: "An unparalleled experience. Every detail was thoughtfully curated — from the moment we arrived to the last morning. The staff anticipate your needs before you even realise them.",
    source: "TripAdvisor",
    date: "March 2025",
  },
  {
    id: "2",
    author: "James K.",
    rating: 5,
    text: "The suite was breathtaking. Woke up to the most stunning view I've ever seen from a hotel room. The spa is world-class. We will absolutely return.",
    source: "Google",
    date: "February 2025",
  },
  {
    id: "3",
    author: "Elena V.",
    rating: 5,
    text: "A sanctuary in the city. The concierge arranged everything perfectly for our anniversary. Dinner at the rooftop restaurant was the highlight of our entire trip.",
    source: "Booking.com",
    date: "January 2025",
  },
  {
    id: "4",
    author: "David L.",
    rating: 4,
    text: "Impeccable service and gorgeous design throughout. The breakfast selection is extraordinary. A true five-star experience in every sense.",
    source: "TripAdvisor",
    date: "December 2024",
  },
  {
    id: "5",
    author: "Mei-Lin C.",
    rating: 5,
    text: "We celebrated our honeymoon here and couldn't have chosen better. The rose petals, champagne, and private terrace made it magical. Truly memorable.",
    source: "Google",
    date: "November 2024",
  },
  {
    id: "6",
    author: "Robert A.",
    rating: 5,
    text: "Having stayed at many luxury hotels worldwide, this stands among the very finest. The attention to detail and genuine warmth of the staff set it apart.",
    source: "Expedia",
    date: "October 2024",
  },
];

function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "text-amber-400" : "text-stone-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function aggregateRating(reviews: ReviewData[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

export default function ReviewsWall({
  maxReviews = 6,
  showRating = true,
  showSource = true,
  layout = "grid",
  reviews = [],
}: ReviewsWallProps) {
  const source = reviews.length ? reviews : placeholderReviews;
  const display = source.slice(0, maxReviews);
  const avg = aggregateRating(display);

  const gridClass =
    layout === "stack"
      ? "grid-cols-1 max-w-2xl mx-auto"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-20 px-6 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium">
            Guest Reviews
          </span>
          <h2 className="text-4xl font-light text-stone-900 mt-3 tracking-tight">
            What Our Guests Say
          </h2>
          {showRating && display.length > 0 && (
            <div className="flex flex-col items-center mt-5 gap-2">
              <div className="flex items-center gap-3">
                <Stars count={Math.round(avg)} />
                <span className="text-2xl font-light text-stone-700">
                  {avg.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-stone-400 tracking-wide">
                Based on {display.length} reviews
              </p>
            </div>
          )}
          <div className="w-12 h-px bg-stone-300 mx-auto mt-5" />
        </div>

        {/* Review cards */}
        <div className={`grid ${gridClass} gap-6`}>
          {display.map((review) => (
            <article
              key={review.id}
              className="bg-white border border-stone-100 p-7 flex flex-col gap-4 hover:shadow-sm transition-shadow duration-300"
            >
              {showRating && (
                <Stars count={review.rating} />
              )}
              <blockquote className="text-stone-600 text-sm leading-relaxed font-light italic flex-1">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                <div>
                  <p className="text-stone-800 font-medium text-sm">{review.author}</p>
                  {review.date && (
                    <p className="text-stone-400 text-xs mt-0.5">{review.date}</p>
                  )}
                </div>
                {showSource && review.source && (
                  <span className="text-xs text-stone-400 tracking-wide border border-stone-100 px-2 py-1">
                    {review.source}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
