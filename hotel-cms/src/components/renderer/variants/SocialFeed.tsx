export interface SocialPost {
  imageUrl: string;
  caption: string;
  link: string;
}

export interface SocialFeedProps {
  title?: string;
  subtitle?: string;
  platform?: string;
  handle?: string;
  posts?: SocialPost[];
  columns?: number;
}

const defaultPosts: SocialPost[] = [
  { imageUrl: "", caption: "Sunset views from the rooftop terrace 🌅", link: "" },
  { imageUrl: "", caption: "Fresh catch of the day at our restaurant 🐟", link: "" },
  { imageUrl: "", caption: "Morning yoga by the pool 🧘", link: "" },
  { imageUrl: "", caption: "Our signature cocktail — The Meridian Sunset 🍹", link: "" },
  { imageUrl: "", caption: "Heritage architecture meets modern luxury ✨", link: "" },
  { imageUrl: "", caption: "Spa day essentials 🌿", link: "" },
];

const gradients = [
  "from-amber-400 via-orange-400 to-rose-500",
  "from-sky-400 via-cyan-400 to-teal-500",
  "from-violet-500 via-purple-500 to-pink-500",
  "from-emerald-400 via-green-400 to-teal-400",
  "from-orange-400 via-amber-400 to-yellow-400",
  "from-rose-400 via-pink-400 to-fuchsia-500",
];

export default function SocialFeed({
  title = "Follow Our Journey",
  subtitle,
  platform = "instagram",
  handle = "ourhotel",
  posts = [],
  columns = 3,
}: SocialFeedProps) {
  const items = posts.length ? posts : defaultPosts;
  const colClass =
    columns === 4
      ? "grid-cols-4"
      : columns === 2
      ? "grid-cols-2"
      : "grid-cols-3";

  return (
    <section className="py-24 px-6 bg-stone-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: "#c9a96e" }}>
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </span>
          <h2
            className="text-4xl font-light text-white mt-3 tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-stone-400 mt-3 text-base font-light max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Grid */}
        <div className={`grid ${colClass} gap-1`}>
          {items.map((post, i) => (
            <a
              key={i}
              href={post.link || "#"}
              target={post.link ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="relative block aspect-square overflow-hidden group"
            >
              {/* Image or placeholder */}
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${
                    gradients[i % gradients.length]
                  } flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}
                >
                  <span className="text-4xl opacity-60">📷</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100">
                {/* External link icon */}
                <svg
                  className="w-7 h-7 text-white mb-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
                <p className="text-white text-xs text-center leading-snug line-clamp-2 font-light">
                  {post.caption}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Follow link */}
        <div className="text-center mt-10">
          <a
            href={`https://${platform}.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium tracking-wide transition-colors duration-200 hover:opacity-80"
            style={{ color: "#c9a96e" }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Follow us @{handle}
          </a>
        </div>
      </div>
    </section>
  );
}
