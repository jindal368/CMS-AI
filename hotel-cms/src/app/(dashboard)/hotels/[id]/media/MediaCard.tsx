"use client";

interface MediaCardProps {
  thumbUrl: string;
  altText: string | null;
  fileSize: string;
  tags: string[];
}

export default function MediaCard({
  thumbUrl,
  altText,
  fileSize,
  tags,
}: MediaCardProps) {
  return (
    <div className="group relative bg-[#f0eef5] border border-[#e2dfe8] rounded-xl overflow-hidden hover:border-[#d4d0de] transition-colors cursor-pointer">
      {/* Thumbnail */}
      <div className="aspect-square relative bg-[#e2dfe8] flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt={altText || "Media asset"}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button className="p-1.5 rounded-lg bg-[#ffffff]/80 text-[#1a1a2e] hover:bg-[#ffffff] transition-colors">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button className="p-1.5 rounded-lg bg-[#e85d45]/80 text-white hover:bg-[#e85d45] transition-colors">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        {altText && (
          <p className="text-xs text-[#1a1a2e] line-clamp-1 mb-1">{altText}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#7c7893]">{fileSize}</span>
          {tags.length > 0 && (
            <span className="text-xs text-[#7c7893] bg-[#e2dfe8] px-1.5 py-0.5 rounded capitalize">
              {tags[0]}
              {tags.length > 1 && ` +${tags.length - 1}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
