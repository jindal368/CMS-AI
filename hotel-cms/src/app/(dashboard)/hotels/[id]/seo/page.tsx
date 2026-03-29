import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runSeoAudit, type SeoIssue } from "@/lib/seo/audit";
import HotelTabs from "@/components/hotel-tabs";
import RunAuditButton from "./RunAuditButton";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeoColor(score: number): string {
  if (score >= 90) return "#0fa886";
  if (score >= 80) return "#3b7dd8";
  if (score >= 65) return "#d49a12";
  if (score >= 50) return "#e85d45";
  return "#dc2626";
}

const SEVERITY_DOT_COLOR: Record<SeoIssue["severity"], string> = {
  critical: "#dc2626",
  warning: "#d49a12",
  info: "#3b7dd8",
};

const SEVERITY_BADGE: Record<
  SeoIssue["severity"],
  { label: string; color: string; bg: string }
> = {
  critical: { label: "Critical", color: "#dc2626", bg: "#dc262615" },
  warning: { label: "Warning", color: "#d49a12", bg: "#d49a1215" },
  info: { label: "Info", color: "#3b7dd8", bg: "#3b7dd815" },
};

function getRelativeAuditTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SeoPage(props: {
  params: Promise<{ id: string }>;
}) {
  await getSessionOrRedirect();

  const { id } = await props.params;

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!hotel) notFound();

  let audit = await prisma.seoAudit.findUnique({ where: { hotelId: id } });
  if (!audit) {
    await runSeoAudit(id);
    audit = await prisma.seoAudit.findUnique({ where: { hotelId: id } });
  }
  if (!audit) notFound();

  const issues = (audit.issues as unknown as SeoIssue[]) ?? [];
  const critical = issues.filter((i) => i.severity === "critical");
  const warning = issues.filter((i) => i.severity === "warning");
  const info = issues.filter((i) => i.severity === "info");

  const score = audit.score;
  const scoreColor = getSeoColor(score);
  const lastAuditAt = audit.lastAuditAt ?? new Date();

  const severityOrder: SeoIssue["severity"][] = ["critical", "warning", "info"];
  const grouped: Record<SeoIssue["severity"], SeoIssue[]> = {
    critical,
    warning,
    info,
  };

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
        <span className="text-[#1a1a2e]">SEO</span>
      </nav>

      {/* Tab panel */}
      <div className="bg-[#ffffff] border border-[#e2dfe8] rounded-xl overflow-hidden">
        <div className="px-5 pt-4">
          <HotelTabs hotelId={id} />
        </div>

        <div className="p-5 space-y-6">
          {/* Score card */}
          <div className="glass-card-static p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span
                className="text-5xl font-bold tabular-nums"
                style={{ color: scoreColor }}
              >
                {score}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[#1a1a2e]">
                  SEO Score
                </p>
                <p className="text-xs text-[#7c7893]">
                  Last audited: {getRelativeAuditTime(lastAuditAt)}
                </p>
              </div>
            </div>
            <RunAuditButton hotelId={id} />
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card-static p-4 text-center space-y-1">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                style={{ background: "#dc262615", color: "#dc2626" }}
              >
                {critical.length}
              </span>
              <p className="text-xs font-medium text-[#7c7893]">Critical</p>
            </div>
            <div className="glass-card-static p-4 text-center space-y-1">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                style={{ background: "#d49a1215", color: "#d49a12" }}
              >
                {warning.length}
              </span>
              <p className="text-xs font-medium text-[#7c7893]">Warning</p>
            </div>
            <div className="glass-card-static p-4 text-center space-y-1">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                style={{ background: "#3b7dd815", color: "#3b7dd8" }}
              >
                {info.length}
              </span>
              <p className="text-xs font-medium text-[#7c7893]">Info</p>
            </div>
          </div>

          {/* Issues grouped by severity */}
          {issues.length === 0 ? (
            <div className="glass-card-static p-8 flex flex-col items-center justify-center gap-3 text-center">
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
              <p className="text-sm font-semibold text-[#1a1a2e]">
                No issues found
              </p>
              <p className="text-xs text-[#7c7893]">
                This property is fully SEO-optimised.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {severityOrder
                .filter((sev) => grouped[sev].length > 0)
                .map((sev) => {
                  const badge = SEVERITY_BADGE[sev];
                  return (
                    <div key={sev}>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: SEVERITY_DOT_COLOR[sev] }}
                        />
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: badge.color }}
                        >
                          {badge.label}
                        </span>
                        <span
                          className="text-xs ml-1"
                          style={{ color: badge.color + "99" }}
                        >
                          {grouped[sev].length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {grouped[sev].map((issue, idx) => (
                          <div
                            key={idx}
                            className="glass-card p-4 flex items-start gap-3"
                          >
                            {/* Severity dot */}
                            <span
                              className="mt-1 w-2 h-2 rounded-full shrink-0"
                              style={{
                                background: SEVERITY_DOT_COLOR[issue.severity],
                              }}
                            />

                            <div className="flex-1 min-w-0 space-y-1">
                              {/* Category tag */}
                              <span
                                className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                  color: badge.color,
                                  background: badge.bg,
                                }}
                              >
                                {issue.category}
                              </span>

                              {/* Message */}
                              <p className="text-sm font-medium text-[#1a1a2e]">
                                {issue.message}
                              </p>

                              {/* Fix suggestion */}
                              <p className="text-xs text-[#7c7893]">
                                {issue.fix}
                              </p>
                            </div>

                            {/* Fix link */}
                            {issue.pageId && (
                              <Link
                                href={`/hotels/${id}/pages/${issue.pageId}`}
                                className="shrink-0 text-xs font-medium transition-colors hover:opacity-80"
                                style={{ color: badge.color }}
                              >
                                Fix →
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
