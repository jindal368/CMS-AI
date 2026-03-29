export interface Action {
  id: string;
  hotelId: string;
  hotelName: string;
  priority: "critical" | "warning" | "info";
  message: string;
  link: string;
}

const PRIORITY_ORDER: Record<Action["priority"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const STALE_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function generateActions(hotels: any[]): Action[] {
  const actions: Action[] = [];

  for (const hotel of hotels) {
    const hotelId: string = hotel.id;
    const hotelName: string = hotel.name;
    const pages: any[] = hotel.pages ?? [];
    const rooms: any[] = hotel.rooms ?? [];
    const media: any[] = hotel.media ?? [];
    const versions: any[] = hotel.versions ?? [];
    const context: any = hotel.context ?? null;

    // ─── Critical ────────────────────────────────────────────

    if (pages.length === 0) {
      actions.push({
        id: `${hotelId}-no-pages`,
        hotelId,
        hotelName,
        priority: "critical",
        message: `${hotelName} has no pages`,
        link: `/hotels/${hotelId}`,
      });
    } else {
      const allEmpty = pages.every(
        (page) => (page.sections ?? []).length === 0
      );
      if (allEmpty) {
        const firstPage = pages[0];
        actions.push({
          id: `${hotelId}-empty-pages`,
          hotelId,
          hotelName,
          priority: "critical",
          message: `${hotelName} has empty pages`,
          link: `/hotels/${hotelId}/pages/${firstPage.id}`,
        });
      }
    }

    // ─── Warning ─────────────────────────────────────────────

    if (!hotel.theme) {
      actions.push({
        id: `${hotelId}-no-theme`,
        hotelId,
        hotelName,
        priority: "warning",
        message: `${hotelName} needs a theme`,
        link: `/hotels/${hotelId}/theme`,
      });
    }

    if (rooms.length === 0) {
      actions.push({
        id: `${hotelId}-no-rooms`,
        hotelId,
        hotelName,
        priority: "warning",
        message: `${hotelName} has no rooms`,
        link: `/hotels/${hotelId}/rooms`,
      });
    }

    if (media.length === 0) {
      actions.push({
        id: `${hotelId}-no-media`,
        hotelId,
        hotelName,
        priority: "warning",
        message: `${hotelName} has no media`,
        link: `/hotels/${hotelId}/media`,
      });
    }

    const draftCount = versions.filter(
      (v: any) => v.status === "draft"
    ).length;
    if (draftCount > 0) {
      actions.push({
        id: `${hotelId}-drafts-pending`,
        hotelId,
        hotelName,
        priority: "warning",
        message: `${hotelName} has ${draftCount} drafts pending`,
        link: `/hotels/${hotelId}/versions`,
      });
    }

    // Content stale: find the most recent section updatedAt across all pages→sections
    const allSections: any[] = pages.flatMap((page: any) => page.sections ?? []);
    if (allSections.length > 0) {
      const latestMs = Math.max(
        ...allSections.map((s: any) => new Date(s.updatedAt).getTime())
      );
      const now = Date.now();
      const daysSince = Math.floor((now - latestMs) / MS_PER_DAY);
      if (daysSince > STALE_DAYS) {
        actions.push({
          id: `${hotelId}-content-stale`,
          hotelId,
          hotelName,
          priority: "warning",
          message: `${hotelName} not updated in ${daysSince} days`,
          link: `/hotels/${hotelId}`,
        });
      }
    }

    // ─── Info ─────────────────────────────────────────────────

    const brandVoice: string = context?.brandVoice ?? "";
    if (!context || brandVoice.trim() === "") {
      actions.push({
        id: `${hotelId}-no-brand-voice`,
        hotelId,
        hotelName,
        priority: "info",
        message: `${hotelName} has no brand voice`,
        link: `/hotels/${hotelId}/theme`,
      });
    }

    if (pages.length > 0 && pages.length < 3) {
      actions.push({
        id: `${hotelId}-few-pages`,
        hotelId,
        hotelName,
        priority: "info",
        message: `${hotelName} could use more pages`,
        link: `/hotels/${hotelId}`,
      });
    }
  }

  // Sort: critical → warning → info, then alphabetical by hotelName within each tier
  actions.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.hotelName.localeCompare(b.hotelName);
  });

  return actions;
}
