# Multi-Property Dashboard — Design Spec

**Goal:** Replace the basic stats dashboard with a fleet management command center showing property health scores and a prioritized action queue.

**Target user:** Hotel chain managers overseeing 5-50 properties who need to know which sites need attention at a glance.

**Decisions:**
- Two-column layout: property grid (70%) + action queue sidebar (30%)
- Health score: weighted checklist (0-100), displayed as letter grade (A/B/C/D/F)
- Action queue: prioritized by critical/warning/info, links directly to fix each issue

---

## 1. Dashboard Layout

Replace `/dashboard` page with two-column command center.

### Top: Org Overview Bar
- Org name + logo
- Total properties count
- Average health grade (computed from all hotel scores)
- Total pending actions badge (count of critical + warning items)

### Left (70%): Property Grid
- Responsive grid: 2 cols desktop, 1 col mobile
- Hotel cards sorted by health score ascending (worst first)
- Each card shows:
  - Hotel name + category badge (luxury/boutique/business/resort/budget)
  - Location (city, country)
  - Health grade: large colored letter badge (A=teal #0fa886, B=blue #3b7dd8, C=amber #d49a12, D=coral #e85d45, F=red #dc2626)
  - Score number small next to grade (e.g., "B 82")
  - Last updated: relative time with color (green <7d, amber 7-30d, red >30d)
  - Stats row: pages count, rooms count, media count
- Click card → navigates to `/hotels/[id]`
- Glass card styling (glass-card class)

### Right (30%): Action Queue Sidebar
- Sticky positioned, scrolls independently
- Header: "Action Queue" + total count badge
- Grouped by priority with colored section headers:
  - Critical (red): must fix immediately
  - Warning (amber): should address soon
  - Info (blue): nice to have
- Each action item: colored dot + hotel name + description + arrow link
- Click action → navigates to the fix page
- Empty state: "All clear! Your properties are in great shape." with teal checkmark

---

## 2. Health Score Computation

**File:** `src/lib/health-score.ts`

```typescript
interface HealthResult {
  score: number;        // 0-100
  grade: string;        // A, B, C, D, F
  gradeColor: string;   // hex color for the grade badge
  breakdown: {
    hasTheme: number;          // 0 or 15
    hasPages: number;          // 0 or 20
    hasRooms: number;          // 0 or 15
    hasMedia: number;          // 0 or 10
    contentFresh: number;      // 0, 10, or 20
    noPendingDrafts: number;   // 0 or 10
    hasContext: number;        // 0 or 10
  };
  lastUpdated: Date | null;    // most recent update across all sections/pages
}

function computeHotelHealth(hotel: HotelWithRelations): HealthResult
```

**Scoring:**
| Check | Points | Condition |
|-------|--------|-----------|
| hasTheme | 15 | Theme record exists with non-empty colorTokens |
| hasPages | 20 | At least 3 pages, each with at least 1 section |
| hasRooms | 15 | At least 1 room with pricing data |
| hasMedia | 10 | At least 1 media asset |
| contentFresh | 20 | Any section updated within 7 days = 20, within 30 days = 10, older = 0 |
| noPendingDrafts | 10 | No SchemaVersion with status "draft" |
| hasContext | 10 | HotelContext exists with non-empty brandVoice |

**Grade mapping:**
- 90-100 = A (#0fa886 teal)
- 80-89 = B (#3b7dd8 blue)
- 65-79 = C (#d49a12 amber)
- 50-64 = D (#e85d45 coral)
- 0-49 = F (#dc2626 red)

**Data fetching:** Single Prisma query per hotel with `include` to get all related data. Called in the dashboard server component for all hotels in the org.

---

## 3. Action Queue Generation

**File:** `src/lib/action-queue.ts`

```typescript
interface Action {
  id: string;
  hotelId: string;
  hotelName: string;
  priority: "critical" | "warning" | "info";
  message: string;
  link: string;
}

function generateActions(hotels: HotelWithRelations[]): Action[]
```

**Rules per hotel:**

| Priority | Condition | Message | Link |
|----------|-----------|---------|------|
| critical | No pages | "{name} has no pages" | /hotels/[id] |
| critical | Pages but all empty (0 sections) | "{name} has empty pages" | /hotels/[id]/pages/[firstPageId] |
| warning | No theme | "{name} needs a theme" | /hotels/[id]/theme |
| warning | No rooms | "{name} has no rooms" | /hotels/[id]/rooms |
| warning | No media | "{name} has no media" | /hotels/[id]/media |
| warning | Has draft versions | "{name} has N drafts pending" | /hotels/[id]/versions |
| warning | Content stale >30 days | "{name} not updated in N days" | /hotels/[id] |
| info | No AI context | "{name} has no brand voice" | /hotels/[id]/theme |
| info | Less than 3 pages | "{name} could use more pages" | /hotels/[id] |

Sorted: critical first, then warning, then info. Within each group, sorted by hotel name.

---

## 4. Files to Create / Modify

### New files
- `src/lib/health-score.ts` — computeHotelHealth function
- `src/lib/action-queue.ts` — generateActions function

### Modified files
- `src/app/(dashboard)/dashboard/page.tsx` — complete rewrite with new two-column layout, property grid, action queue sidebar
- `src/app/(dashboard)/layout.tsx` — pass org data to dashboard if needed (may already be available)

---

## Out of Scope
- Historical health score tracking (trends over time)
- Email alerts when health drops
- Custom scoring weights per org
- Dashboard widgets / customization
