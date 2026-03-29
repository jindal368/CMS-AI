# Multi-Property Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic stats dashboard with a fleet management command center showing hotel health grades and a prioritized action queue.

**Architecture:** Two new utility modules (health-score, action-queue) compute data from existing Prisma models. Dashboard page is rewritten as a server component that fetches all hotels in the org with relations, computes health + actions, and renders a two-column layout (property grid + action sidebar).

**Tech Stack:** Prisma queries with include, Next.js server components, Tailwind CSS with glassmorphism utilities.

---

### Task 1: Health score computation utility

**Files:**
- Create: `src/lib/health-score.ts`

- [ ] **Step 1: Create health-score module**

Create `src/lib/health-score.ts`. Export these types and function:

```typescript
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
  lastUpdated: string | null; // ISO string
}
```

`computeHotelHealth(hotel)` accepts a hotel object with these included relations: `theme`, `pages` (with `sections` and `_count`), `rooms`, `media`, `versions`, `context`. All fetched via Prisma include in the dashboard page.

Scoring logic:
- `hasTheme`: 15 if `hotel.theme` exists and `hotel.theme.colorTokens` is truthy, else 0
- `hasPages`: 20 if hotel has >= 3 pages AND at least 3 of those pages have >= 1 section, else 0
- `hasRooms`: 15 if hotel has >= 1 room, else 0
- `hasMedia`: 10 if hotel has >= 1 media asset, else 0
- `contentFresh`: Find the most recent `updatedAt` across all sections. If within 7 days → 20, within 30 days → 10, older → 0. If no sections, 0.
- `noPendingDrafts`: 10 if no version has status "draft", else 0
- `hasContext`: 10 if hotel.context exists and brandVoice is non-empty string, else 0

Sum all for score. Map to grade:
- 90-100 → "A", color "#0fa886"
- 80-89 → "B", color "#3b7dd8"
- 65-79 → "C", color "#d49a12"
- 50-64 → "D", color "#e85d45"
- 0-49 → "F", color "#dc2626"

`lastUpdated`: the most recent updatedAt from sections, as ISO string. Null if no sections.

Also export a helper: `computeAverageGrade(results: HealthResult[]): { grade: string, gradeColor: string, avgScore: number }` — averages all scores and maps to grade.

- [ ] **Step 2: Verify build**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Action queue generation utility

**Files:**
- Create: `src/lib/action-queue.ts`

- [ ] **Step 1: Create action-queue module**

Create `src/lib/action-queue.ts`. Export:

```typescript
export interface Action {
  id: string;
  hotelId: string;
  hotelName: string;
  priority: "critical" | "warning" | "info";
  message: string;
  link: string;
}

export function generateActions(hotels: HotelWithRelations[]): Action[]
```

The function iterates each hotel and checks these conditions (use `crypto.randomUUID()` or `hotelId + "-" + rule` for stable IDs):

**Critical:**
- No pages at all → `{ priority: "critical", message: "{name} has no pages", link: "/hotels/{id}" }`
- Has pages but ALL pages have 0 sections → `{ priority: "critical", message: "{name} has empty pages", link: "/hotels/{id}/pages/{firstPageId}" }` — use the first page's ID

**Warning:**
- No theme → `{ message: "{name} needs a theme", link: "/hotels/{id}/theme" }`
- No rooms → `{ message: "{name} has no rooms", link: "/hotels/{id}/rooms" }`
- No media → `{ message: "{name} has no media", link: "/hotels/{id}/media" }`
- Has any SchemaVersion with status "draft" → count them → `{ message: "{name} has {N} drafts pending", link: "/hotels/{id}/versions" }`
- Content stale: most recent section updatedAt > 30 days ago → compute days → `{ message: "{name} not updated in {N} days", link: "/hotels/{id}" }`

**Info:**
- No HotelContext or empty brandVoice → `{ message: "{name} has no brand voice", link: "/hotels/{id}/theme" }`
- Less than 3 pages → `{ message: "{name} could use more pages", link: "/hotels/{id}" }`

Sort: critical first, then warning, then info. Within same priority, sort by hotel name alphabetically.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: Rewrite dashboard page

**Files:**
- Rewrite: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite the dashboard page**

Read the existing file first. Then rewrite it completely.

This is a server component with `export const dynamic = "force-dynamic"`. It:

1. Calls `getSessionOrRedirect()` from `@/lib/auth` to get `{ user, org }`
2. Fetches all hotels in the org from Prisma:
```typescript
const hotels = await prisma.hotel.findMany({
  where: { orgId: user.orgId },
  include: {
    theme: true,
    pages: { include: { sections: true } },
    rooms: true,
    media: true,
    versions: { where: { status: "draft" } },
    context: true,
  },
  orderBy: { createdAt: "asc" },
});
```
3. Computes health for each hotel: `hotels.map(h => ({ hotel: h, health: computeHotelHealth(h) }))`
4. Sorts by score ascending (worst first)
5. Computes average grade: `computeAverageGrade(healthResults)`
6. Generates actions: `generateActions(hotels)`
7. Counts actions by priority

Renders two-column layout:

**Top bar:**
- Org name (from session), property count, average grade badge, action count badge
- Glassmorphism styling (glass-card-static)

**Left column (flex-1 or w-[70%]):**
- "Properties" heading with count
- Grid of hotel cards (grid-cols-1 lg:grid-cols-2 gap-4)
- Each card (glass-card class):
  - Top row: gradient avatar (first letter, hotel index cycles gradient pairs), hotel name (font-semibold), category badge
  - Location: city, country in muted text
  - Grade badge: large letter (text-2xl font-bold) with colored background (gradeColor at 15% opacity, text in gradeColor). Score number small next to it.
  - Last updated: relative time. Color-coded: green text if <7d, amber if 7-30d, red if >30d. Use `new Date(lastUpdated)` to compute.
  - Stats row: pages/rooms/media counts with icons, separated by borders
  - Whole card is a Link to `/hotels/[id]`

**Right column (w-80 shrink-0, sticky top-6):**
- "Action Queue" heading with total count badge (coral background)
- If no actions: "All clear!" message with teal checkmark
- Else: sections for each priority that has items:
  - Priority header: colored dot + "Critical" / "Warning" / "Info" label
  - Each action: small card with hotel name (bold), message, arrow link icon. Click → navigates to action.link.
  - Priority colors: critical = #dc2626, warning = #d49a12, info = #3b7dd8

**Responsive:** On mobile (below lg), action queue moves below the property grid (flex-col instead of flex-row).

Use the relative time helper inline: compute days difference, show "today", "yesterday", "N days ago", "N weeks ago", "N months ago".

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
