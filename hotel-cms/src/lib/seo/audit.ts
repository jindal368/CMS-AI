import { prisma } from "@/lib/db";

export interface SeoIssue {
  severity: "critical" | "warning" | "info";
  category: "meta" | "content" | "media" | "schema" | "branding";
  message: string;
  pageId?: string;
  fix: string;
}

export async function runSeoAudit(
  hotelId: string
): Promise<{ score: number; issues: SeoIssue[] }> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      pages: {
        include: { sections: true },
      },
      rooms: true,
      media: true,
      theme: true,
    },
  });

  const issues: SeoIssue[] = [];

  if (!hotel) {
    const score = 0;
    await prisma.seoAudit.upsert({
      where: { hotelId },
      create: { hotelId, score, issues: issues as any, lastAuditAt: new Date() },
      update: { score, issues: issues as any, lastAuditAt: new Date() },
    });
    return { score, issues };
  }

  const pages: any[] = Array.isArray(hotel.pages) ? hotel.pages : [];
  const rooms: any[] = Array.isArray(hotel.rooms) ? hotel.rooms : [];
  const media: any[] = Array.isArray(hotel.media) ? hotel.media : [];

  // ── Critical issues ────────────────────────────────────────────────────────

  for (const page of pages) {
    const metaTags = page.metaTags as any;

    const missingTitle =
      !metaTags || !metaTags.title || String(metaTags.title).trim() === "";
    if (missingTitle) {
      issues.push({
        severity: "critical",
        category: "meta",
        message: `Page '${page.slug}' missing title`,
        pageId: page.id,
        fix: "Add a title in page settings",
      });
    }

    const missingDescription =
      !metaTags ||
      !metaTags.description ||
      String(metaTags.description).trim() === "";
    if (missingDescription) {
      issues.push({
        severity: "critical",
        category: "meta",
        message: `Page '${page.slug}' missing description`,
        pageId: page.id,
        fix: "Add a description in page settings",
      });
    }
  }

  const contactInfo = (hotel.contactInfo as Record<string, any>) ?? {};
  const missingContact =
    !contactInfo.phone ||
    String(contactInfo.phone).trim() === "" ||
    !contactInfo.email ||
    String(contactInfo.email).trim() === "";
  if (missingContact) {
    issues.push({
      severity: "critical",
      category: "schema",
      message: "Missing hotel phone or email",
      fix: "Add phone and email in hotel settings",
    });
  }

  // ── Warning issues ─────────────────────────────────────────────────────────

  // Duplicate page titles
  const titleCounts: Record<string, number> = {};
  for (const page of pages) {
    const metaTags = page.metaTags as any;
    const title =
      metaTags && metaTags.title ? String(metaTags.title).trim() : "";
    if (title) {
      titleCounts[title] = (titleCounts[title] ?? 0) + 1;
    }
  }
  for (const [title, count] of Object.entries(titleCounts)) {
    if (count > 1) {
      issues.push({
        severity: "warning",
        category: "meta",
        message: `Duplicate title: '${title}'`,
        fix: "Make each page title unique",
      });
    }
  }

  // Thin content
  for (const page of pages) {
    const sectionCount = Array.isArray(page.sections) ? page.sections.length : 0;
    if (sectionCount < 2) {
      issues.push({
        severity: "warning",
        category: "content",
        message: `'${page.slug}' has thin content (${sectionCount} sections)`,
        pageId: page.id,
        fix: "Add more sections",
      });
    }
  }

  // Missing alt text
  for (const asset of media) {
    if (!asset.altText || String(asset.altText).trim() === "") {
      issues.push({
        severity: "warning",
        category: "media",
        message: "Image missing alt text",
        fix: "Add alt text in media library",
      });
    }
  }

  // No rooms
  if (rooms.length === 0) {
    issues.push({
      severity: "warning",
      category: "schema",
      message: "No rooms listed",
      fix: "Add rooms to enable Room schema",
    });
  }

  // ── Info issues ────────────────────────────────────────────────────────────

  if (!hotel.theme) {
    issues.push({
      severity: "info",
      category: "branding",
      message: "No theme configured",
      fix: "Configure a theme",
    });
  }

  for (const page of pages) {
    const metaTags = page.metaTags as any;
    const description =
      metaTags && metaTags.description
        ? String(metaTags.description).trim()
        : "";
    if (description.length > 0 && description.length < 50) {
      issues.push({
        severity: "info",
        category: "meta",
        message: `'${page.slug}' meta description too short`,
        pageId: page.id,
        fix: "Expand to 50-160 characters",
      });
    }
  }

  // ── Scoring ────────────────────────────────────────────────────────────────

  const SEVERITY_PENALTY: Record<SeoIssue["severity"], number> = {
    critical: 15,
    warning: 8,
    info: 3,
  };

  const penalty = issues.reduce(
    (sum, issue) => sum + SEVERITY_PENALTY[issue.severity],
    0
  );
  const score = Math.max(0, 100 - penalty);

  await prisma.seoAudit.upsert({
    where: { hotelId },
    create: { hotelId, score, issues: issues as any, lastAuditAt: new Date() },
    update: { score, issues: issues as any, lastAuditAt: new Date() },
  });

  return { score, issues };
}
