# Competitive Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable hotel chains to add competitor websites, scan them on-demand for changes, and get AI-powered actionable suggestions.

**Architecture:** New Competitor and CompetitorScan Prisma models. Scan utility uses existing scraper to fetch competitor sites, diffs snapshots, calls LLM for insights. API routes handle CRUD + scanning. CMS gets a Competitors tab per hotel with add form, scan buttons, and results display.

**Tech Stack:** Prisma (models), existing scraper utility, OpenRouter LLM (insights), Next.js server components + client components.

---

### Task 1: Prisma schema — Competitor + CompetitorScan models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add models**

Read `prisma/schema.prisma`. Add after Campaign model:

```prisma
model Competitor {
  id           String    @id @default(uuid())
  hotelId      String    @map("hotel_id")
  name         String
  url          String
  lastSnapshot Json      @default("{}") @map("last_snapshot")
  lastScanAt   DateTime? @map("last_scan_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  scans CompetitorScan[]

  @@map("competitors")
}

model CompetitorScan {
  id             String   @id @default(uuid())
  competitorId   String   @map("competitor_id")
  changes        Json     @default("[]")
  insights       Json     @default("[]")
  snapshotBefore Json     @default("{}") @map("snapshot_before")
  snapshotAfter  Json     @default("{}") @map("snapshot_after")
  scannedAt      DateTime @default(now()) @map("scanned_at")

  competitor Competitor @relation(fields: [competitorId], references: [id], onDelete: Cascade)

  @@map("competitor_scans")
}
```

Add `competitors Competitor[]` to Hotel model's relations.

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-competitors`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Change detection engine

**Files:**
- Create: `src/lib/competitors/scan.ts`

- [ ] **Step 1: Create scan utility**

Import `prisma` from `@/lib/db`, `scrapeReference` from `@/lib/scraper`.

Export types:
```typescript
interface Change {
  type: "title_changed" | "description_changed" | "section_added" | "section_removed" | "major_content_update";
  old?: string;
  new?: string;
  detail?: string;
}

interface Insight {
  suggestion: string;
  priority: "high" | "medium" | "low";
}
```

Export `scanCompetitor(competitorId: string, hotelId: string): Promise<{ changes: Change[]; insights: Insight[] }>`:

1. Fetch competitor from DB (include hotel with context for brand voice)
2. Call `scrapeReference(competitor.url)` — get new snapshot `{ title, description, headings, bodyExcerpt, success }`
3. If scrape failed, throw "Could not reach competitor website"
4. Get `lastSnapshot` from competitor (cast as same shape)
5. If lastSnapshot is empty (first scan): store snapshot, create CompetitorScan with empty changes and one insight `{ suggestion: "Baseline captured. Future scans will detect changes.", priority: "low" }`. Update competitor. Return.
6. Detect changes:
   - If title different → push `{ type: "title_changed", old: last.title, new: current.title }`
   - If description different → push `{ type: "description_changed", old: last.description, new: current.description }`
   - New headings (in current.headings but not in last.headings) → push `{ type: "section_added", detail: heading }` each
   - Removed headings (in last but not current) → push `{ type: "section_removed", detail: heading }` each
   - Body similarity: if bodyExcerpt length difference > 30% or content overlap < 70% → push `{ type: "major_content_update" }`. Simple check: compare first 500 chars, count matching words.
7. If no changes: create scan with empty changes/insights. Update lastSnapshot + lastScanAt. Return.
8. If changes found: call OpenRouter LLM. Prompt:
   ```
   Competitor "{name}" ({url}) made these changes:
   {changes as bullet list}

   Our hotel: {hotelName} ({category}) in {city}
   Brand voice: "{brandVoice}"

   Generate 2-3 actionable suggestions for how we should respond.
   Return ONLY valid JSON: { "insights": [{ "suggestion": "...", "priority": "high|medium|low" }] }
   ```
   Model: `nvidia/nemotron-3-super-120b-a12b:free`, max_tokens 1024. Parse response, extract insights.
9. Create CompetitorScan record. Update competitor lastSnapshot + lastScanAt. Return { changes, insights }.

Export `scanAllCompetitors(hotelId: string): Promise<{ scanned: number; withChanges: number }>`:
- Fetch all competitors for hotel
- Call scanCompetitor for each sequentially
- Count how many had changes
- Return totals

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: API routes

**Files:**
- Create: `src/app/api/competitors/route.ts`
- Create: `src/app/api/competitors/[id]/route.ts`
- Create: `src/app/api/competitors/[id]/scan/route.ts`
- Create: `src/app/api/competitors/[id]/history/route.ts`
- Create: `src/app/api/competitors/scan-all/[hotelId]/route.ts`

- [ ] **Step 1: Create list + add routes**

`GET /api/competitors?hotelId=xxx` — requireAuth. requireHotelAccess on hotelId from query. Fetch competitors for hotel with latest scan (orderBy scannedAt desc, take 1 on scans). Return array.

`POST /api/competitors` — requireAuth + role >= editor. Accepts `{ hotelId, name, url }`. Validate name and url non-empty. Check count < 5 for this hotel (prisma.competitor.count). Create competitor. Run initial baseline scan by calling scanCompetitor. Return competitor + scan result. `export const maxDuration = 60`.

- [ ] **Step 2: Create detail + delete routes**

`GET /api/competitors/[id]` — requireAuth. Fetch competitor with latest scan. Verify hotel access. Return.

`DELETE /api/competitors/[id]` — requireAuth + role >= editor. Fetch competitor, verify hotel access. Delete (cascades scans). Return { deleted: true }.

Params: `Promise<{ id: string }>`.

- [ ] **Step 3: Create scan route**

`POST /api/competitors/[id]/scan` — requireAuth + role >= editor. `export const maxDuration = 120`. Fetch competitor, verify hotel access. Call scanCompetitor. Return scan result.

- [ ] **Step 4: Create history route**

`GET /api/competitors/[id]/history` — requireAuth. Fetch last 10 CompetitorScan records for this competitor, ordered by scannedAt desc. Return array.

- [ ] **Step 5: Create scan-all route**

`POST /api/competitors/scan-all/[hotelId]` — requireAuth + role >= editor. `export const maxDuration = 300`. Verify hotel access. Call scanAllCompetitors. Return { scanned, withChanges }.

- [ ] **Step 6: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: CMS UI — Competitors tab

**Files:**
- Create: `src/app/(dashboard)/hotels/[id]/competitors/page.tsx`
- Modify: `src/components/hotel-tabs.tsx`

- [ ] **Step 1: Create competitors page**

`src/app/(dashboard)/hotels/[id]/competitors/page.tsx` — server component, force-dynamic. getSessionOrRedirect. Fetch competitors for hotel with latest scan each. Fetch hotel name + context. Serialize.

Render with a client wrapper component for interactivity:
- HotelTabs at top
- Header: "Competitive Intelligence" + count + "Scan All" button + "Add Competitor" button
- Add Competitor: inline form (glass-card-static) with Name input, URL input, "Add" button. On submit: POST /api/competitors. Show loading. On success: router.refresh().
- Competitor cards (glass-card): each shows:
  - Name (font-semibold), URL (small, linked, muted), last scanned relative time
  - "Scan" button (purple) — POST /api/competitors/[id]/scan, loading state, refresh on done
  - Latest changes as colored pills: title_changed=amber "Title Changed", section_added=teal "Section Added", section_removed=coral "Section Removed", major_content_update=purple "Major Update", no changes=gray "No Changes"
  - AI insights as small cards below with priority dot (high=#dc2626, medium=#d49a12, low=#3b7dd8) + suggestion text
  - "Delete" button (small, coral, with confirm)
- "Scan All" button: POST /api/competitors/scan-all/[hotelId], shows "Scanning..." progress, refresh on done
- Empty state: "Add competitors to monitor what they're doing. You can track up to 5 competitor websites."

- [ ] **Step 2: Add Competitors to hotel tabs**

Read `src/components/hotel-tabs.tsx`. Add `{ label: "Competitors", href: \`/hotels/\${hotelId}/competitors\` }` after SEO tab.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
