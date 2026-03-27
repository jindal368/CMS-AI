import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

async function getStats() {
  const [totalHotels, totalPages, totalRooms, totalMedia] = await Promise.all([
    prisma.hotel.count(),
    prisma.page.count(),
    prisma.room.count(),
    prisma.mediaAsset.count(),
  ]);
  return { totalHotels, totalPages, totalRooms, totalMedia };
}

async function getRecentHotels() {
  return prisma.hotel.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      category: true,
      createdAt: true,
      _count: { select: { pages: true } },
    },
  });
}

const categoryColors: Record<string, string> = {
  luxury: "text-[#d49a12] bg-[#d49a12]/10",
  boutique: "text-[#7c5cbf] bg-[#7c5cbf]/10",
  business: "text-[#3b7dd8] bg-[#3b7dd8]/10",
  resort: "text-[#0fa886] bg-[#0fa886]/10",
  budget: "text-[#7c7893] bg-[#7c7893]/10",
};

const hotelAvatarGradients = [
  { bg: "linear-gradient(135deg, #e85d45, #d49a12)", shadow: "rgba(232, 93, 69, 0.3)" },
  { bg: "linear-gradient(135deg, #7c5cbf, #3b7dd8)", shadow: "rgba(124, 92, 191, 0.3)" },
  { bg: "linear-gradient(135deg, #0fa886, #3b7dd8)", shadow: "rgba(15, 168, 134, 0.3)" },
  { bg: "linear-gradient(135deg, #d49a12, #e85d45)", shadow: "rgba(212, 154, 18, 0.3)" },
  { bg: "linear-gradient(135deg, #3b7dd8, #7c5cbf)", shadow: "rgba(59, 125, 216, 0.3)" },
];

export default async function DashboardPage() {
  const stats = await getStats();
  const recentHotels = await getRecentHotels();

  const statCards = [
    {
      label: "Total Hotels",
      value: stats.totalHotels,
      accent: "#e85d45",
      gradientFrom: "#e85d45",
      gradientTo: "#e85d4530",
      emoji: "🏨",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      label: "Total Pages",
      value: stats.totalPages,
      accent: "#7c5cbf",
      gradientFrom: "#7c5cbf",
      gradientTo: "#7c5cbf30",
      emoji: "📄",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      label: "Total Rooms",
      value: stats.totalRooms,
      accent: "#0fa886",
      gradientFrom: "#0fa886",
      gradientTo: "#0fa88630",
      emoji: "🛏️",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      label: "Total Media",
      value: stats.totalMedia,
      accent: "#3b7dd8",
      gradientFrom: "#3b7dd8",
      gradientTo: "#3b7dd830",
      emoji: "🖼️",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Overview</h2>
        <p className="text-sm text-[#7c7893] mt-0.5">
          Manage your hotel properties and content
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="glass-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{
                  background: `linear-gradient(135deg, ${card.gradientFrom}30, ${card.gradientTo}10)`,
                  color: card.accent,
                }}
              >
                {card.icon}
              </div>
            </div>
            <div>
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: card.accent, letterSpacing: '-0.5px' }}
              >
                {card.value}
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-[#7c7893] mt-0.5">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1a1a2e]">
              Recent Hotels
            </h3>
            <Link
              href="/hotels"
              className="text-xs text-[#e85d45] hover:text-[#f5866e] transition-colors"
            >
              View all
            </Link>
          </div>

          {recentHotels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-[#f0eef5] flex items-center justify-center mb-3">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-[#7c7893]"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm text-[#7c7893]">No hotels yet</p>
              <p className="text-xs text-[#7c7893]/60 mt-1">
                Create your first hotel to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentHotels.map((hotel, index) => {
                const gradient = hotelAvatarGradients[index % hotelAvatarGradients.length];
                return (
                  <Link
                    key={hotel.id}
                    href={`/hotels/${hotel.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f0eef5]/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{
                          background: gradient.bg,
                          boxShadow: `0 2px 8px ${gradient.shadow}`,
                        }}
                      >
                        {hotel.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a2e]">
                          {hotel.name}
                        </p>
                        <p className="text-xs text-[#7c7893]">
                          {hotel._count.pages}{" "}
                          {hotel._count.pages === 1 ? "page" : "pages"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${categoryColors[hotel.category] ?? "text-[#7c7893] bg-[#7c7893]/10"}`}
                    >
                      {hotel.category}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-[#1a1a2e] mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Link
              href="/hotels"
              className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors group"
              style={{ background: 'linear-gradient(135deg, rgba(232,93,69,0.12), rgba(245,134,110,0.06))' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #e85d45, #f5866e)' }}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#1a1a2e]">
                  Create Hotel
                </p>
                <p className="text-xs text-[#7c7893]">Add a new property</p>
              </div>
            </Link>

            <Link
              href="/components"
              className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors group"
              style={{ background: 'linear-gradient(135deg, rgba(124,92,191,0.12), rgba(99,73,163,0.06))' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c5cbf, #6349a3)' }}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#1a1a2e]">
                  Browse Components
                </p>
                <p className="text-xs text-[#7c7893]">Explore the registry</p>
              </div>
            </Link>

            <Link
              href="/hotels"
              className="flex items-center gap-3 w-full p-3 rounded-lg transition-colors group"
              style={{ background: 'linear-gradient(135deg, rgba(15,168,134,0.12), rgba(11,130,104,0.06))' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #0fa886, #0b8268)' }}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[#1a1a2e]">
                  Manage Content
                </p>
                <p className="text-xs text-[#7c7893]">Edit pages & sections</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
