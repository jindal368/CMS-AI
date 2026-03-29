# SEO Autopilot — Design Spec

**Goal:** Auto-generate sitemaps, inject schema.org structured data, and run SEO audits with stored scores per hotel.

**Decisions:**
- Stored audit results (SeoAudit model, runs after content changes)
- Minimal structured data: Hotel + Room JSON-LD only (deterministic, no LLM)
- SEO score visible on multi-property dashboard + new SEO tab per hotel

---

## 1. Sitemap Generation

**Route:** `src/app/sitemap/[hotelId]/sitemap.xml/route.ts`

Dynamic XML sitemap per hotel. Fetches all pages, generates `<url>` entries with `<loc>` pointing to `/preview/[hotelId]/[pageSlug]` and `<lastmod>` from the most recent section updatedAt. Response: `Content-Type: application/xml`. No auth — public.

**Route:** `src/app/robots/[hotelId]/route.ts`

Returns `robots.txt` pointing to the hotel's sitemap URL.

### Files
- Create: `src/app/sitemap/[hotelId]/sitemap.xml/route.ts`
- Create: `src/app/robots/[hotelId]/route.ts`

---

## 2. Schema.org Structured Data

**Utility:** `src/lib/seo/structured-data.ts`

Two functions:

`generateHotelSchema(hotel)` → JSON-LD `Hotel` object:
- @type: "Hotel"
- name, address (PostalAddress), telephone, email, url
- starRating: luxury=5, boutique=4, resort=4, business=3, budget=2
- image: first media asset URL if available

`generateRoomSchemas(rooms)` → array of JSON-LD `HotelRoom` objects:
- @type: "HotelRoom"
- name, description, occupancy.maxValue
- offers: { @type: "Offer", price, priceCurrency }

**Injection:** Modify `src/app/preview/[hotelId]/[pageSlug]/page.tsx` to include `<script type="application/ld+json">` in the rendered page with both Hotel and Room schemas.

### Files
- Create: `src/lib/seo/structured-data.ts`
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx`

---

## 3. SEO Audit System

### New Prisma model

```prisma
model SeoAudit {
  id          String   @id @default(uuid())
  hotelId     String   @unique @map("hotel_id")
  score       Int      @default(100)
  issues      Json     @default("[]")  // Array<{ severity, category, message, pageId?, fix }>
  lastAuditAt DateTime @default(now()) @map("last_audit_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("seo_audits")
}
```

Add `seoAudit SeoAudit?` relation to Hotel model.

### Audit checks

| Check | Severity | Category | Condition | Fix suggestion |
|-------|----------|----------|-----------|----------------|
| Missing page title | critical | meta | metaTags.title empty/missing | "Add a title in page settings" |
| Missing meta description | critical | meta | metaTags.description empty/missing | "Add a meta description in page settings" |
| Missing hotel contact | critical | schema | contactInfo missing phone or email | "Add phone and email in hotel settings" |
| Duplicate page titles | warning | meta | two+ pages share same title | "Make each page title unique" |
| Thin content | warning | content | page has < 2 sections | "Add more sections to this page" |
| Missing image alt text | warning | media | media asset has empty altText | "Add alt text to images in media library" |
| No rooms with pricing | warning | schema | hotel has 0 rooms | "Add rooms to enable Room schema" |
| No theme configured | info | branding | no theme record | "Configure a theme for brand consistency" |
| Short meta description | info | meta | description exists but < 50 chars | "Expand meta description to 50-160 characters" |

### Scoring

Start at 100. Deductions per issue: critical = -15, warning = -8, info = -3. Floor at 0.

### When audits run

- `runSeoAudit(hotelId)` utility function in `src/lib/seo/audit.ts`
- Called after content changes (section CRUD, page update, room update, media update) — fire-and-forget, non-blocking
- On-demand via API: `POST /api/seo/audit/[hotelId]`
- Upserts the SeoAudit record

### Files
- Modify: `prisma/schema.prisma` — add SeoAudit model + Hotel relation
- Create: `src/lib/seo/audit.ts` — runSeoAudit function
- Create: `src/app/api/seo/audit/[hotelId]/route.ts` — POST triggers audit, GET returns latest

---

## 4. SEO Dashboard Tab

New tab on hotel detail page showing audit results.

**Page:** `src/app/(dashboard)/hotels/[id]/seo/page.tsx`

Shows:
- SEO score as large colored number (90+=teal, 80+=blue, 65+=amber, 50+=coral, <50=red)
- "Last audited" timestamp
- "Run Audit" button → POST to audit API, refresh
- Summary row: N critical, N warnings, N info (colored badges)
- Issues list grouped by severity:
  - Each: severity badge, category tag, message, link to fix page (if pageId), fix suggestion text

**Dashboard integration:**
- Modify `src/app/(dashboard)/dashboard/page.tsx` to show SEO score badge on each property card (fetch SeoAudit alongside hotel data)
- Add "SEO" to `src/components/hotel-tabs.tsx`

### Files
- Create: `src/app/(dashboard)/hotels/[id]/seo/page.tsx`
- Modify: `src/components/hotel-tabs.tsx` — add SEO tab
- Modify: `src/app/(dashboard)/dashboard/page.tsx` — show SEO score on property cards

---

## Out of Scope
- Keyword ranking monitoring (requires external API like Google Search Console)
- Competitor SEO comparison
- Auto-fix via AI (could emit update_meta operations — future addition)
- Review/FAQ structured data (phase 2)
- Per-page SEO score (only per-hotel for now)
