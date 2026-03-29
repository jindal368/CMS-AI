export interface VideoSectionProps {
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  posterImage?: string;
  layout?: "full" | "split";
  description?: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function VideoEmbed({
  videoUrl,
  posterImage,
  className = "",
}: {
  videoUrl: string;
  posterImage?: string;
  className?: string;
}) {
  const ytId = extractYouTubeId(videoUrl);
  const vimeoId = !ytId ? extractVimeoId(videoUrl) : null;
  const isMp4 =
    !ytId && !vimeoId && (videoUrl.endsWith(".mp4") || videoUrl.includes(".mp4?"));

  if (ytId) {
    return (
      <div className={`relative w-full aspect-video ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title="Hotel video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded-xl"
          style={{ border: "none" }}
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className={`relative w-full aspect-video ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Hotel video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded-xl"
          style={{ border: "none" }}
        />
      </div>
    );
  }

  if (isMp4 && videoUrl) {
    return (
      <div className={`relative w-full aspect-video ${className}`}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={videoUrl}
          poster={posterImage}
          controls
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
        />
      </div>
    );
  }

  // Placeholder
  return (
    <div
      className={`relative w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center ${className}`}
      style={{ backgroundColor: "#0d0d1a" }}
    >
      {posterImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterImage}
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        />
      )}
      {/* Play button */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            backgroundColor: "rgba(201,169,110,0.9)",
            border: "3px solid rgba(255,255,255,0.3)",
          }}
        >
          <svg
            className="w-8 h-8 ml-1"
            fill="white"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-white/60 text-sm tracking-widest uppercase font-light">
          Watch the film
        </span>
      </div>
    </div>
  );
}

export default function VideoSection({
  title,
  subtitle,
  videoUrl = "",
  posterImage,
  layout = "full",
  description,
}: VideoSectionProps) {
  if (layout === "split") {
    return (
      <section
        className="py-24 px-6"
        style={{ backgroundColor: "#0d0d1a" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text side */}
            <div>
              {subtitle && (
                <span
                  className="text-xs tracking-[0.3em] uppercase font-medium block mb-4"
                  style={{ color: "#c9a96e" }}
                >
                  {subtitle}
                </span>
              )}
              {title && (
                <h2
                  className="text-4xl md:text-5xl font-light text-white mb-6 leading-tight tracking-tight"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {title}
                </h2>
              )}
              <div
                className="w-12 h-px mb-6"
                style={{ backgroundColor: "#c9a96e" }}
              />
              {description && (
                <p className="text-stone-400 text-base leading-relaxed font-light">
                  {description}
                </p>
              )}
            </div>

            {/* Video side */}
            <VideoEmbed
              videoUrl={videoUrl}
              posterImage={posterImage}
              className="shadow-2xl"
            />
          </div>
        </div>
      </section>
    );
  }

  // Full layout
  return (
    <section
      className="py-24 px-6"
      style={{ backgroundColor: "#0d0d1a" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {subtitle && (
              <span
                className="text-xs tracking-[0.3em] uppercase font-medium block mb-3"
                style={{ color: "#c9a96e" }}
              >
                {subtitle}
              </span>
            )}
            {title && (
              <h2
                className="text-4xl font-light text-white tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {title}
              </h2>
            )}
          </div>
        )}

        <VideoEmbed
          videoUrl={videoUrl}
          posterImage={posterImage}
          className="shadow-2xl"
        />

        {description && (
          <p className="text-stone-400 text-base leading-relaxed font-light text-center mt-8 max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
