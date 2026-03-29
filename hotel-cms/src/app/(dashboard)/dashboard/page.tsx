import Link from "next/link";
import { getSessionOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeHotelHealth, computeAverageGrade } from "@/lib/health-score";
import { generateActions, Action } from "@/lib/action-queue";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  { from: "#e85d45", to: "#d49a12" },
  { from: "#3b7dd8", to: "#7c5cbf" },
  { from: "#0fa886", to: "#d49a12" },
];

const CATEGORY_COLORS: Record<string, string> = {
  luxury: "text-[#d49a12] bg-[#d49a12]/10",
  boutique: "text-[#7c5cbf] bg-[#7c5cbf]/10",
  business: "text-[#3b7dd8] bg-[#3b7dd8]/10",
  resort: "text-[#0fa886] bg-[#0fa886]/10",
  budget: "text-muted bg-[#7c7893]/10",
};

const PRIORITY_COLORS: Record<Action["priority"], string> = {
  critical: "#dc2626",
  warning: "#d49a12",
  info: "#3b7dd8",
};

const PRIORITY_LABELS: Record<Action["priority"], string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

function getSeoColor(score: number): string {
  if (score >= 90) return "#0fa886";
  if (score >= 80) return "#3b7dd8";
  if (score >= 65) return "#d49a12";
  if (score >= 50) return "#e85d45";
  return "#dc2626";
}

function getRelativeTime(lastUpdated: string | null): {
  label: string;
  color: string;
} {
  if (!lastUpdated) {
    return { label: "Never updated", color: "var(--muted)" };
  }
  const days = Math.floor(
    (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return { label: "Updated today", color: "#0fa886" };
  if (days <= 7) return { label: `Updated ${days}d ago`, color: "#0fa886" };
  if (days <= 30) return { label: `Updated ${days}d ago`, color: "#d49a12" };
  return { label: `Updated ${days}d ago`, color: "#dc2626" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { user, org } = await getSessionOrRedirect();

  const hotels = await prisma.hotel.findMany({
    where: { orgId: (user as any).orgId },
    include: {
      theme: true,
      pages: { include: { sections: true } },
      rooms: true,
      media: true,
      versions: true,
      context: true,
      seoAudit: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Compute health for each hotel
  const hotelHealthPairs = hotels.map((hotel) => ({
    hotel,
    health: computeHotelHealth(hotel),
  }));

  // Sort worst-first (ascending score)
  hotelHealthPairs.sort((a, b) => a.health.score - b.health.score);

  // Compute average grade across all hotels
  const avgGradeResult = computeAverageGrade(
    hotelHealthPairs.map((p) => p.health)
  );

  // Generate action queue
  const actions = generateActions(hotels);

  // Group actions by priority
  const criticalActions = actions.filter((a) => a.priority === "critical");
  const warningActions = actions.filter((a) => a.priority === "warning");
  const infoActions = actions.filter((a) => a.priority === "info");

  const orgName =
    (org as any)?.name ?? (user as any)?.orgId ?? "Your Organization";

  // ─── Empty state ──────────────────────────────────────────────────────────

  if (hotels.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="glass-card-static p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Organization
            </p>
            <p className="text-base font-semibold text-foreground mt-0.5">
              {orgName}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center glass-card p-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-7 h-7 text-white"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-foreground">
            No properties yet.
          </p>
          <p className="text-sm text-muted mt-1">
            Create your first hotel to get started.
          </p>
          <Link
            href="/hotels"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create a hotel
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main layout ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-[1600px]">
      {/* Org Overview Stats */}
      <div className="grid grid-cols-3 gap-5 animate-in">
        <div className="glass-card-static p-5">
          <p className="text-[11px] font-medium tracking-wide uppercase text-[#86868b]">Organization</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground mt-1">{orgName}</p>
        </div>
        <div className="glass-card-static p-5">
          <p className="text-[11px] font-medium tracking-wide uppercase text-[#86868b]">Properties</p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-semibold tracking-tight text-foreground">{hotelHealthPairs.length}</span>
            <span className="text-sm text-muted">Avg grade: <span className="font-semibold" style={{ color: avgGradeResult.gradeColor }}>{avgGradeResult.grade}</span></span>
          </div>
        </div>
        <div className="glass-card-static p-5">
          <p className="text-[11px] font-medium tracking-wide uppercase text-[#86868b]">Actions Required</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground mt-1">{actions.length}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Property Grid */}
          <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3 animate-in animate-in-delay-1">
            Properties ({hotelHealthPairs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {hotelHealthPairs.map(({ hotel, health }, index) => {
              const gradient =
                AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
              const contactInfo = (hotel.contactInfo as any) ?? {};
              const city: string = contactInfo.city ?? contactInfo.address?.city ?? "";
              const country: string =
                contactInfo.country ?? contactInfo.address?.country ?? "";
              const location = [city, country].filter(Boolean).join(", ");
              const relTime = getRelativeTime(health.lastUpdated);

              return (
                <Link
                  key={hotel.id}
                  href={`/hotels/${hotel.id}`}
                  className={`glass-card p-5 flex flex-col gap-3 no-underline animate-in animate-in-delay-${Math.min(index + 1, 5)}`}
                >
                  {/* Top row: avatar + name + category */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                          boxShadow: `0 2px 8px ${gradient.from}40`,
                        }}
                      >
                        {hotel.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-foreground truncate leading-tight">
                        {hotel.name}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[hotel.category] ?? "text-muted bg-[#7c7893]/10"}`}
                    >
                      {hotel.category}
                    </span>
                  </div>

                  {/* Location */}
                  {location && (
                    <p className="text-xs text-muted -mt-1 truncate">
                      {location}
                    </p>
                  )}

                  {/* Grade + relative time */}
                  <div className="flex items-center justify-between">
                    {/* Grade badge + SEO pill + publish status */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{
                          background: health.gradeColor + "20",
                          color: health.gradeColor,
                        }}
                      >
                        {health.grade}
                      </span>
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: health.gradeColor }}
                      >
                        {health.score}
                      </span>
                      {hotel.seoAudit && (() => {
                        const seoColor = getSeoColor(hotel.seoAudit.score);
                        return (
                          <span
                            style={{ color: seoColor, background: seoColor + "15" }}
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                          >
                            SEO {hotel.seoAudit.score}
                          </span>
                        );
                      })()}
                      {/* Publish status indicator */}
                      {hotel.publishedAt ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "#0fa88615", color: "#0fa886" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: "#0fa886" }}
                          />
                          Live
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "#7c789315", color: "var(--muted)" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: "#7c7893" }}
                          />
                          Draft
                        </span>
                      )}
                    </div>

                    {/* Relative time */}
                    <span
                      className="text-xs font-medium"
                      style={{ color: relTime.color }}
                    >
                      {relTime.label}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div
                    className="flex items-center text-xs text-muted pt-2"
                    style={{ borderTop: "1px solid rgba(124,120,147,0.12)" }}
                  >
                    <span className="flex-1 text-center">
                      <span className="font-semibold text-foreground">
                        {hotel.pages.length}
                      </span>{" "}
                      pages
                    </span>
                    <span
                      className="self-stretch w-px"
                      style={{ background: "rgba(124,120,147,0.12)" }}
                    />
                    <span className="flex-1 text-center">
                      <span className="font-semibold text-foreground">
                        {hotel.rooms.length}
                      </span>{" "}
                      rooms
                    </span>
                    <span
                      className="self-stretch w-px"
                      style={{ background: "rgba(124,120,147,0.12)" }}
                    />
                    <span className="flex-1 text-center">
                      <span className="font-semibold text-foreground">
                        {hotel.media.length}
                      </span>{" "}
                      media
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

        {/* Action Queue */}
        <div className="animate-in animate-in-delay-2">
            <div className="glass-card-static p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Action Queue
                </h2>
                <span
                  className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "#e85d4520", color: "#e85d45" }}
                >
                  {actions.length}
                </span>
              </div>

              {/* Empty state */}
              {actions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "#0fa88620" }}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                      style={{ color: "#0fa886" }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted">
                    All clear! Your properties are in great shape.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {(
                    [
                      { key: "critical" as const, items: criticalActions },
                      { key: "warning" as const, items: warningActions },
                      { key: "info" as const, items: infoActions },
                    ] as const
                  )
                    .filter(({ items }) => items.length > 0)
                    .map(({ key, items }) => (
                      <div key={key}>
                        {/* Priority label */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: PRIORITY_COLORS[key] }}
                          />
                          <span
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: PRIORITY_COLORS[key] }}
                          >
                            {PRIORITY_LABELS[key]}
                          </span>
                          <span
                            className="text-xs ml-auto"
                            style={{ color: PRIORITY_COLORS[key] + "99" }}
                          >
                            {items.length}
                          </span>
                        </div>

                        {/* Action items */}
                        <div className="space-y-2">
                          {items.map((action) => (
                            <Link
                              key={action.id}
                              href={action.link}
                              className="glass-card flex items-start justify-between gap-2 p-3 no-underline"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">
                                  {action.hotelName}
                                </p>
                                <p className="text-xs text-muted mt-0.5 leading-snug">
                                  {action.message}
                                </p>
                              </div>
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-3.5 h-3.5 shrink-0 mt-0.5"
                                style={{ color: PRIORITY_COLORS[key] }}
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
