export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  link: string;
}

export interface BlogPreviewProps {
  title?: string;
  subtitle?: string;
  posts?: BlogPost[];
  columns?: number;
}

const defaultPosts: BlogPost[] = [
  {
    title: "10 Hidden Gems Near Our Hotel",
    excerpt:
      "Discover the secret spots that only locals know about, from tucked-away cafes to serene gardens.",
    date: "2026-03-15",
    category: "Travel Guide",
    image: "",
    link: "",
  },
  {
    title: "A Culinary Journey Through Local Flavors",
    excerpt:
      "Our chef shares the inspiration behind our signature dishes and the local ingredients that make them special.",
    date: "2026-03-10",
    category: "Dining",
    image: "",
    link: "",
  },
  {
    title: "Wellness Retreat: Mind, Body & Soul",
    excerpt:
      "Experience our new holistic wellness program designed to rejuvenate every aspect of your being.",
    date: "2026-03-05",
    category: "Wellness",
    image: "",
    link: "",
  },
];

const imagePlaceholders = [
  "from-amber-200 via-orange-200 to-rose-200",
  "from-sky-200 via-cyan-200 to-teal-200",
  "from-violet-200 via-purple-200 to-pink-200",
];

const categoryColors: Record<string, string> = {
  "Travel Guide": "#e85d45",
  Dining: "#a8956a",
  Wellness: "#5d9ea8",
  Culture: "#8a6aad",
  Events: "#5da870",
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function BlogPreview({
  title = "Latest Stories",
  subtitle,
  posts = [],
  columns = 3,
}: BlogPreviewProps) {
  const items = posts.length ? posts : defaultPosts;
  const colClass =
    columns === 4
      ? "lg:grid-cols-4"
      : columns === 2
      ? "lg:grid-cols-2"
      : "lg:grid-cols-3";

  return (
    <section className="py-24 px-6 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-stone-400 font-medium block mb-3">
              Journal
            </span>
            <h2 className="text-4xl font-light text-stone-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-stone-500 mt-2 text-base font-light max-w-md">
                {subtitle}
              </p>
            )}
          </div>
          <div className="w-12 h-px bg-stone-300 md:mb-2 self-start md:self-auto" />
        </div>

        {/* Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${colClass} gap-8`}>
          {items.map((post, i) => {
            const catColor =
              categoryColors[post.category] || "#a8956a";

            return (
              <article
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col"
              >
                {/* Image area */}
                <a
                  href={post.link || "#"}
                  className="block relative aspect-video overflow-hidden flex-shrink-0"
                >
                  {post.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${
                        imagePlaceholders[i % imagePlaceholders.length]
                      } flex items-center justify-center`}
                    >
                      <span className="text-3xl opacity-40">✍️</span>
                    </div>
                  )}
                </a>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Category badge */}
                  <span
                    className="inline-block self-start px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-3"
                    style={{
                      backgroundColor: `${catColor}18`,
                      color: catColor,
                    }}
                  >
                    {post.category}
                  </span>

                  {/* Title */}
                  <a href={post.link || "#"} className="block flex-1">
                    <h3 className="font-semibold text-stone-900 text-lg leading-snug mb-2 line-clamp-2 group-hover:text-stone-700 transition-colors duration-200">
                      {post.title}
                    </h3>
                  </a>

                  {/* Excerpt */}
                  <p className="text-sm text-stone-500 leading-relaxed font-light line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100">
                    <time
                      dateTime={post.date}
                      className="text-xs text-stone-400 font-light"
                    >
                      {formatDate(post.date)}
                    </time>
                    <a
                      href={post.link || "#"}
                      className="text-xs font-semibold tracking-wide transition-colors duration-200 flex items-center gap-1"
                      style={{ color: "#a8956a" }}
                    >
                      Read More
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
