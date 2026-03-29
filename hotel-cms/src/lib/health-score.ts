export interface HealthBreakdown {
  hasTheme: number;        // 0 or 15
  hasPages: number;        // 0 or 20
  hasRooms: number;        // 0 or 15
  hasMedia: number;        // 0 or 10
  contentFresh: number;    // 0, 10, or 20
  noPendingDrafts: number; // 0 or 10
  hasContext: number;       // 0 or 10
}

export interface HealthResult {
  score: number;
  grade: string;
  gradeColor: string;
  breakdown: HealthBreakdown;
  lastUpdated: string | null;
}

function scoreToGrade(score: number): { grade: string; gradeColor: string } {
  if (score >= 90) return { grade: "A", gradeColor: "#0fa886" };
  if (score >= 80) return { grade: "B", gradeColor: "#3b7dd8" };
  if (score >= 65) return { grade: "C", gradeColor: "#d49a12" };
  if (score >= 50) return { grade: "D", gradeColor: "#e85d45" };
  return { grade: "F", gradeColor: "#dc2626" };
}

export function computeHotelHealth(hotel: any): HealthResult {
  const now = Date.now();
  const MS_7_DAYS = 7 * 24 * 60 * 60 * 1000;
  const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

  // hasTheme
  const hasTheme: number =
    hotel.theme && hotel.theme.colorTokens ? 15 : 0;

  // hasPages: >= 3 pages AND at least 3 of them have >= 1 section
  const pages: any[] = Array.isArray(hotel.pages) ? hotel.pages : [];
  const pagesWithSections = pages.filter(
    (p) => Array.isArray(p.sections) && p.sections.length >= 1
  );
  const hasPages: number =
    pages.length >= 3 && pagesWithSections.length >= 3 ? 20 : 0;

  // hasRooms
  const rooms: any[] = Array.isArray(hotel.rooms) ? hotel.rooms : [];
  const hasRooms: number = rooms.length >= 1 ? 15 : 0;

  // hasMedia
  const media: any[] = Array.isArray(hotel.media) ? hotel.media : [];
  const hasMedia: number = media.length >= 1 ? 10 : 0;

  // contentFresh + lastUpdated: most recent section updatedAt across all pages
  const allSections: any[] = pages.flatMap((p) =>
    Array.isArray(p.sections) ? p.sections : []
  );

  let latestSectionDate: Date | null = null;
  for (const section of allSections) {
    if (section.updatedAt) {
      const d = new Date(section.updatedAt);
      if (!latestSectionDate || d > latestSectionDate) {
        latestSectionDate = d;
      }
    }
  }

  let contentFresh: number = 0;
  if (latestSectionDate !== null) {
    const age = now - latestSectionDate.getTime();
    if (age <= MS_7_DAYS) {
      contentFresh = 20;
    } else if (age <= MS_30_DAYS) {
      contentFresh = 10;
    } else {
      contentFresh = 0;
    }
  }

  // noPendingDrafts
  const versions: any[] = Array.isArray(hotel.versions) ? hotel.versions : [];
  const hasDraft = versions.some((v) => v.status === "draft");
  const noPendingDrafts: number = hasDraft ? 0 : 10;

  // hasContext
  const hasContext: number =
    hotel.context &&
    typeof hotel.context.brandVoice === "string" &&
    hotel.context.brandVoice.trim().length > 0
      ? 10
      : 0;

  const breakdown: HealthBreakdown = {
    hasTheme,
    hasPages,
    hasRooms,
    hasMedia,
    contentFresh,
    noPendingDrafts,
    hasContext,
  };

  const score =
    hasTheme +
    hasPages +
    hasRooms +
    hasMedia +
    contentFresh +
    noPendingDrafts +
    hasContext;

  const { grade, gradeColor } = scoreToGrade(score);

  const lastUpdated = latestSectionDate ? latestSectionDate.toISOString() : null;

  return { score, grade, gradeColor, breakdown, lastUpdated };
}

export function computeAverageGrade(
  results: HealthResult[]
): { grade: string; gradeColor: string; avgScore: number } {
  if (results.length === 0) {
    const { grade, gradeColor } = scoreToGrade(0);
    return { grade, gradeColor, avgScore: 0 };
  }

  const total = results.reduce((sum, r) => sum + r.score, 0);
  const avgScore = Math.round(total / results.length);
  const { grade, gradeColor } = scoreToGrade(avgScore);
  return { grade, gradeColor, avgScore };
}
