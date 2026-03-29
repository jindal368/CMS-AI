# Competitive Intelligence — Design Spec

**Goal:** Enable hotel chains to monitor competitor websites, detect changes, and get AI-powered actionable suggestions.

**Decisions:**
- On-demand scanning (click "Scan Now", no cron)
- Diff + AI insights per scan (2-3 actionable suggestions)
- Max 5 competitors per hotel

---

## 1. Data Model

### New Prisma models

```prisma
model Competitor {
  id           String   @id @default(uuid())
  hotelId      String   @map("hotel_id")
  name         String
  url          String
  lastSnapshot Json     @default("{}") @map("last_snapshot")
  lastScanAt   DateTime? @map("last_scan_at")
  createdAt    DateTime @default(now()) @map("created_at")

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  scans CompetitorScan[]

  @@map("competitors")
}

model CompetitorScan {
  id              String   @id @default(uuid())
  competitorId    String   @map("competitor_id")
  changes         Json     @default("[]")
  insights        Json     @default("[]")
  snapshotBefore  Json     @default("{}") @map("snapshot_before")
  snapshotAfter   Json     @default("{}") @map("snapshot_after")
  scannedAt       DateTime @default(now()) @map("scanned_at")

  competitor Competitor @relation(fields: [competitorId], references: [id], onDelete: Cascade)

  @@map("competitor_scans")
}
```

Add `competitors Competitor[]` relation to Hotel model.

### Files
- Modify: `prisma/schema.prisma`
- Run migration

---

## 2. Change Detection Engine

### Utility: `src/lib/competitors/scan.ts`

```typescript
async function scanCompetitor(competitorId: string, hotelId: string): Promise<{
  changes: Change[];
  insights: Insight[];
}>
```

**Change detection:**
1. Call `scrapeReference(competitor.url)` from existing scraper
2. Compare new vs `competitor.lastSnapshot`:
   - Title different → `{ type: "title_changed", old, new }`
   - Description different → `{ type: "description_changed", old, new }`
   - New headings (in new but not in old) → `{ type: "section_added", detail: heading }` per heading
   - Removed headings → `{ type: "section_removed", detail: heading }` per heading
   - Body excerpt similarity <70% → `{ type: "major_content_update" }`
3. If first scan (lastSnapshot empty): store snapshot, return empty changes + "Baseline captured" insight
4. If no changes: return empty changes, no LLM call
5. If changes found: call LLM for insights

**LLM insights:**
One call per competitor via OpenRouter. Prompt includes changes list + hotel context (name, category, city, brand voice). Returns 2-3 suggestions with priority (high/medium/low).

**After scan:**
- Create CompetitorScan record with changes, insights, snapshotBefore, snapshotAfter
- Update competitor.lastSnapshot and lastScanAt

### Scan all utility:

```typescript
async function scanAllCompetitors(hotelId: string): Promise<{ scanned: number; withChanges: number }>
```

Iterates all competitors for the hotel, calls scanCompetitor sequentially.

### Files
- Create: `src/lib/competitors/scan.ts`

---

## 3. API Routes

### `POST /api/competitors` — Add competitor

Auth: requireHotelAccess + editor role. Accepts `{ hotelId, name, url }`. Check count < 5 for this hotel. Creates Competitor. Runs initial baseline scan. Returns competitor with scan.

### `GET /api/competitors?hotelId=xxx` — List competitors

Auth: requireHotelAccess. Returns competitors for the hotel with last scan summary.

### `DELETE /api/competitors/[id]` — Remove competitor

Auth: requireHotelAccess + editor role. Deletes competitor + cascading scans.

### `POST /api/competitors/[id]/scan` — Scan one competitor

Auth: requireHotelAccess. `export const maxDuration = 120`. Calls scanCompetitor. Returns scan result.

### `POST /api/competitors/scan-all/[hotelId]` — Scan all competitors

Auth: requireHotelAccess. `export const maxDuration = 300`. Calls scanAllCompetitors. Returns summary.

### `GET /api/competitors/[id]/history` — Scan history

Auth: requireHotelAccess. Returns last 10 CompetitorScan records for this competitor.

### Files
- Create: `src/app/api/competitors/route.ts`
- Create: `src/app/api/competitors/[id]/route.ts`
- Create: `src/app/api/competitors/[id]/scan/route.ts`
- Create: `src/app/api/competitors/[id]/history/route.ts`
- Create: `src/app/api/competitors/scan-all/[hotelId]/route.ts`

---

## 4. CMS UI — Competitors Tab

### New page: `/hotels/[id]/competitors`

Server component. Fetches competitors + latest scan per competitor.

**Layout:**
- Add "Competitors" to HotelTabs
- Header: "Competitive Intelligence" + competitor count + "Scan All" button + "Add Competitor" button
- Add Competitor: inline form or modal with Name + URL fields
- Competitor cards (glass-card):
  - Name, URL (linked), last scanned relative time
  - "Scan" button per card
  - Latest changes as colored badges (title_changed=amber, section_added=teal, section_removed=coral, major_content_update=purple, no_changes=gray)
  - AI insights as expandable cards with priority badges and suggestion text
  - "History" toggle showing past scans in a timeline
- Empty state: "Add competitors to monitor what they're doing"

### Dashboard integration

On the multi-property dashboard, add a small "Competitor Activity" section or badge:
- Count of competitors with recent changes across all hotels
- Only shown if any competitor scan found changes

### Files
- Create: `src/app/(dashboard)/hotels/[id]/competitors/page.tsx`
- Modify: `src/components/hotel-tabs.tsx` — add Competitors tab
- Modify: `src/app/(dashboard)/dashboard/page.tsx` — add competitor activity indicator (optional, lightweight)

---

## Out of Scope
- Automated scheduled scanning (cron jobs)
- Pricing extraction from competitor sites
- Visual screenshot comparison (would need Puppeteer)
- Competitor SEO analysis
- Alert/notification system for changes
- Competitor social media monitoring
