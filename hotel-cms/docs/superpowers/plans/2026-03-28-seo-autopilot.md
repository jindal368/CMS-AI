# SEO Autopilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add auto-generated sitemaps, schema.org structured data, and a stored SEO audit system with per-hotel scores visible on the dashboard.

**Architecture:** New SeoAudit Prisma model stores audit results per hotel. Sitemap and robots.txt are dynamic Next.js route handlers. Schema.org JSON-LD is injected into preview pages from a utility. Audit engine runs deterministic checks on hotel data and upserts results. SEO tab on hotel detail shows issues, dashboard shows scores.

**Tech Stack:** Prisma, Next.js route handlers (XML response), JSON-LD structured data, server components.

---

### Task 1: Prisma schema — add SeoAudit model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add SeoAudit model and Hotel relation**

Add to `prisma/schema.prisma` after HotelContext model:

```prisma
model SeoAudit {
  id          String   @id @default(uuid())
  hotelId     String   @unique @map("hotel_id")
  score       Int      @default(100)
  issues      Json     @default("[]")
  lastAuditAt DateTime @default(now()) @map("last_audit_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("seo_audits")
}
```

Add `seoAudit SeoAudit?` to the Hotel model's relation list.

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-seo-audit`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Sitemap + robots.txt routes

**Files:**
- Create: `src/app/sitemap/[hotelId]/sitemap.xml/route.ts`
- Create: `src/app/robots/[hotelId]/route.ts`

- [ ] **Step 1: Create sitemap.xml route**

`GET /sitemap/[hotelId]/sitemap.xml` — no auth (public).

In Next.js 16, params are Promises: `{ params: Promise<{ hotelId: string }> }`.

Fetch the hotel to verify it exists. Fetch all pages for the hotel with their sections (to get lastmod). For each page, find the most recent `updatedAt` across its sections. Generate XML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://localhost:3000/preview/{hotelId}/{pageSlug}</loc>
    <lastmod>{ISO date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ...
</urlset>
```

Home page (slug "/") gets priority 1.0. Return with `new Response(xml, { headers: { "Content-Type": "application/xml" } })`.

- [ ] **Step 2: Create robots.txt route**

`GET /robots/[hotelId]` — returns plain text:

```
User-agent: *
Allow: /
Sitemap: http://localhost:3000/sitemap/{hotelId}/sitemap.xml
```

Return with `Content-Type: text/plain`.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: Schema.org structured data + injection

**Files:**
- Create: `src/lib/seo/structured-data.ts`
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx`

- [ ] **Step 1: Create structured data utility**

Create `src/lib/seo/structured-data.ts` with two exported functions:

`generateHotelSchema(hotel)` — accepts hotel with contactInfo, media, category. Returns a JSON-LD object:
```json
{
  "@context": "https://schema.org",
  "@type": "Hotel",
  "name": "hotel.name",
  "address": { "@type": "PostalAddress", "streetAddress", "addressLocality", "addressCountry" },
  "telephone": "phone",
  "email": "email",
  "starRating": { "@type": "Rating", "ratingValue": N },
  "image": "first media URL or empty"
}
```
Star rating: luxury=5, resort=4, boutique=4, business=3, budget=2. Extract contact fields from hotel.contactInfo (cast as Record).

`generateRoomSchemas(rooms)` — accepts rooms array. Returns array of:
```json
{
  "@context": "https://schema.org",
  "@type": "HotelRoom",
  "name": "room.name",
  "description": "room.description",
  "occupancy": { "@type": "QuantitativeValue", "maxValue": room.maxGuests },
  "offers": { "@type": "Offer", "price": pricing.basePrice, "priceCurrency": pricing.currency }
}
```
Extract pricing from room.pricing (cast as Record).

- [ ] **Step 2: Inject into preview page**

Read `src/app/preview/[hotelId]/[pageSlug]/page.tsx` first. After the existing JSX return, inject a `<script type="application/ld+json">` tag in the page body (inside the fragment, before or after the preview banner). Generate both schemas and combine into an array:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify([
      generateHotelSchema(hotel),
      ...generateRoomSchemas(rooms),
    ])
  }}
/>
```

Import the functions from `@/lib/seo/structured-data`.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: SEO audit engine + API

**Files:**
- Create: `src/lib/seo/audit.ts`
- Create: `src/app/api/seo/audit/[hotelId]/route.ts`

- [ ] **Step 1: Create audit engine**

Create `src/lib/seo/audit.ts`. Export:

```typescript
interface SeoIssue {
  severity: "critical" | "warning" | "info";
  category: "meta" | "content" | "media" | "schema" | "branding";
  message: string;
  pageId?: string;
  fix: string;
}

async function runSeoAudit(hotelId: string): Promise<{ score: number; issues: SeoIssue[] }>
```

Fetch hotel with all relations (pages with sections and metaTags, rooms, media, theme). Run these checks:

**Critical (-15 each):**
- For each page: if metaTags is null or metaTags.title is empty → issue with pageId, fix "Add a title in page settings"
- For each page: if metaTags.description is empty → issue with pageId, fix "Add a meta description in page settings"
- If contactInfo missing phone or email → issue, fix "Add phone and email in hotel settings"

**Warning (-8 each):**
- Duplicate titles: collect all page titles, find duplicates → issue per duplicate, fix "Make each page title unique"
- For each page: if sections.length < 2 → "Thin content" with pageId, fix "Add more sections to this page"
- For each media: if altText is empty → "Missing image alt text", fix "Add alt text in media library"
- If rooms.length === 0 → "No rooms with pricing", fix "Add rooms to enable Room schema"

**Info (-3 each):**
- If no theme → "No theme configured", fix "Configure a theme for brand consistency"
- For each page: if metaTags.description exists but length < 50 → "Short meta description" with pageId, fix "Expand to 50-160 characters"

Score: start at 100, subtract per issue, floor at 0.

Upsert into prisma.seoAudit: `where: { hotelId }, create: { hotelId, score, issues, lastAuditAt: new Date() }, update: { score, issues, lastAuditAt: new Date() }`. Cast issues `as any` for Prisma JSON.

Return `{ score, issues }`.

- [ ] **Step 2: Create audit API route**

`src/app/api/seo/audit/[hotelId]/route.ts`:

POST handler: `requireHotelAccess(request, hotelId)` + role >= editor. Calls `runSeoAudit(hotelId)`. Returns `{ score, issues, lastAuditAt }`.

GET handler: `requireHotelAccess(request, hotelId)`. Fetches stored SeoAudit from DB. If none exists, runs audit first. Returns stored result.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 5: SEO tab + dashboard integration

**Files:**
- Create: `src/app/(dashboard)/hotels/[id]/seo/page.tsx`
- Modify: `src/components/hotel-tabs.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create SEO tab page**

`src/app/(dashboard)/hotels/[id]/seo/page.tsx` — server component, `force-dynamic`. Call `getSessionOrRedirect()`. Fetch hotel + SeoAudit from DB. If no audit exists, call `runSeoAudit` to create one.

Render:
- Large SEO score with color (90+=teal #0fa886, 80+=blue #3b7dd8, 65+=amber #d49a12, 50+=coral #e85d45, <50=red #dc2626)
- "Last audited: {relative time}" text
- "Run Audit" button — "use client" wrapper that POSTs to `/api/seo/audit/[hotelId]` then `router.refresh()`
- Summary row: 3 glass cards showing count of critical/warning/info issues with colored badges
- Issues list: grouped by severity (critical first). Each issue card shows: severity badge (colored), category tag, message text, fix suggestion in muted text, and if pageId exists a "Fix →" link to `/hotels/[id]/pages/[pageId]`

Include HotelTabs at the top (same pattern as other hotel sub-pages).

- [ ] **Step 2: Add SEO to hotel tabs**

Read `src/components/hotel-tabs.tsx`. Add a new tab: `{ label: "SEO", href: \`/hotels/\${hotelId}/seo\` }` after the Versions tab.

- [ ] **Step 3: Add SEO score to dashboard property cards**

Read `src/app/(dashboard)/dashboard/page.tsx`. In the Prisma query, add `seoAudit: true` to the hotel include. On each property card, after the health grade badge, add a small SEO score pill if seoAudit exists: `SEO: {score}` with matching color.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
