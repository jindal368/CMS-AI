# Publishing & Domain System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable hotel chains to publish websites to custom domains with per-hotel sub-paths, backed by ISR and on-demand revalidation.

**Architecture:** New schema fields track publishing state and custom domains. Shared renderer utility extracts common page rendering logic. Next.js middleware routes custom domain requests to a public site catch-all route. Publish/unpublish API endpoints control visibility. CMS gets publish buttons, status badges, and domain configuration.

**Tech Stack:** Prisma (schema), Next.js middleware + ISR + revalidatePath, shared renderer utility.

---

### Task 1: Prisma schema — publishing + domain fields

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields**

Read `prisma/schema.prisma`.

Add to Organization model (after lockedSections):
```prisma
  customDomain String? @unique @map("custom_domain")
  published    Boolean @default(false)
```

Add to Hotel model (after `links`):
```prisma
  publishedAt DateTime? @map("published_at")
```

The Hotel model already has a `name` field. We need a URL-safe slug. Check if Hotel already has a slug-like field. If not, add:
```prisma
  hotelSlug String? @map("hotel_slug")
```

Add unique constraint within org: `@@unique([orgId, hotelSlug])` — but only if hotelSlug is not null (Prisma handles this with optional unique).

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-publishing-system`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Shared page renderer utility

**Files:**
- Create: `src/lib/render-page.ts`

- [ ] **Step 1: Create shared renderer**

Read `src/app/preview/[hotelId]/[pageSlug]/page.tsx` to understand the full rendering pipeline.

Create `src/lib/render-page.ts` that extracts the common data-fetching and enrichment logic:

```typescript
import { prisma } from "@/lib/db";
import { resolvePropsLinks, resolveSmartLink, HotelLinkData } from "@/lib/smart-links";

export interface PageRenderData {
  hotel: any;
  page: any;
  sections: any[];
  themeData: any;
  rooms: any[];
  media: any[];
  hotelLinkData: HotelLinkData;
  structuredData: any[];
  locales: string[];
}

export async function getHotelPageData(
  hotelId: string,
  pageSlug: string,
  locale?: string
): Promise<PageRenderData | null>
```

The function:
1. Fetches hotel with include: theme, org (for brandTheme + lockedSections), rooms, media, pages (for locale list)
2. Resolves the page by hotelId + slug + locale (with fallback to defaultLocale)
3. Fetches sections for the page
4. Enriches section props with rooms/media/hotel data (same logic as preview route)
5. Resolves smart links on all props
6. Applies org brand theme override if present
7. Injects locked sections (top/bottom)
8. Generates structured data (Hotel + Room schemas)
9. Returns all data needed for rendering

This is a pure data function — no JSX. The route components call it and render PageRenderer with the result.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: Next.js middleware for domain routing

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
```

Logic:
1. Get hostname from `request.headers.get("host")` — strip port if present
2. Skip if hostname is `localhost` or `127.0.0.1` or `admin.*` — pass through
3. Skip if pathname starts with `/_next`, `/api`, `/dashboard`, `/hotels`, `/login`, `/register`, `/preview`, `/site`, `/docs`, `/guide`, `/brand`, `/team`, `/campaigns`, `/components` or has a file extension (`.js`, `.css`, `.ico`, `.png`, etc.)
4. Look up org by customDomain: query `prisma` — but middleware runs on edge, so use a simple fetch to an internal API endpoint instead: `fetch(new URL('/api/domain-lookup?host=' + hostname, request.url))`
5. If org found: rewrite to `/site/${orgSlug}${pathname}`. E.g., `cghearth.com/palais-de-mahe/rooms` → `/site/cgh-earth/palais-de-mahe/rooms`
6. If not found: pass through

**Simpler approach for v1:** Instead of fetching in middleware (which has edge runtime limitations), use a hardcoded domain map loaded from env, OR create the domain lookup API and fetch it.

Actually, the simplest production-ready approach: create `src/app/api/domain-lookup/route.ts` that middleware calls, with in-memory caching.

Create `src/app/api/domain-lookup/route.ts`:
- GET with `?host=cghearth.com`
- Looks up `prisma.organization.findFirst({ where: { customDomain: host } })`
- Returns `{ orgSlug }` or 404
- Cache result in a module-level Map with 60s TTL

Middleware calls this on non-localhost requests, caches the result, rewrites.

**Matcher config:**
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|docs|guide|site|preview|login|register|dashboard|hotels|components|team|campaigns|brand|.*\\..*).*)'],
};
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: Public site catch-all route + property directory

**Files:**
- Create: `src/app/site/[orgSlug]/[[...path]]/page.tsx`

- [ ] **Step 1: Create public site route**

Server component. `export const revalidate = 3600;` (ISR — revalidate hourly).

Params: `Promise<{ orgSlug: string; path?: string[] }>`.

Logic:
1. Fetch org by slug: `prisma.organization.findFirst({ where: { slug: orgSlug } })`
2. If not found → notFound()
3. Parse the `path` array:

**No path (chain root):**
- Fetch all published hotels in org: `prisma.hotel.findMany({ where: { orgId: org.id, publishedAt: { not: null } }, include: { theme: true, media: { take: 1 }, rooms: { select: { id: true } }, pages: { select: { id: true } } } })`
- Render property directory:
  - Org name as heading, brandTheme for styling if set
  - Grid of hotel cards (glass-card style): hotel name, category badge, city/country from contactInfo, image from first media, stats (pages/rooms count), "Visit Property →" link to `/{hotelSlug}/`
  - Clean, branded landing page. If org has brandTheme, apply those colors.

**Path with 1 segment (`["palais-de-mahe"]`):**
- Hotel slug = path[0]
- Look up hotel by hotelSlug + orgId, check publishedAt not null
- If not found or not published → notFound()
- Call `getHotelPageData(hotel.id, "/")` from shared renderer
- Render with PageRenderer — no preview banner

**Path with 2 segments (`["palais-de-mahe", "rooms"]`):**
- Hotel slug = path[0], page slug = path[1]
- Check if path[1] is a 2-letter locale code → if yes, it's `["hotel", "locale", "page"]` with 3 segments
- Otherwise: render page slug normally

**Path with 3 segments (`["palais-de-mahe", "fr", "rooms"]`):**
- Hotel slug = path[0], locale = path[1], page slug = path[2]
- Call `getHotelPageData(hotel.id, pageSlug, locale)`

All cases: no preview banner, no admin overlays. Include structured data. Include meta tags. Set generateMetadata for SEO.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 5: Publish/unpublish API + revalidation utility

**Files:**
- Create: `src/app/api/hotels/[id]/publish/route.ts`
- Create: `src/app/api/hotels/[id]/unpublish/route.ts`
- Create: `src/lib/revalidate.ts`

- [ ] **Step 1: Create revalidation utility**

Create `src/lib/revalidate.ts`:

```typescript
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function revalidateHotelPages(hotelId: string): Promise<void> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { org: true, pages: { select: { slug: true, locale: true } } },
  });
  if (!hotel?.org?.slug || !hotel.hotelSlug) return;

  const orgSlug = hotel.org.slug;
  const hotelSlug = hotel.hotelSlug;

  // Revalidate property directory
  revalidatePath(`/site/${orgSlug}`);

  // Revalidate each page
  for (const page of hotel.pages) {
    const pageSlug = page.slug === "/" ? "" : `/${page.slug}`;
    revalidatePath(`/site/${orgSlug}/${hotelSlug}${pageSlug}`);
    if (page.locale !== "en") {
      revalidatePath(`/site/${orgSlug}/${hotelSlug}/${page.locale}${pageSlug}`);
    }
  }
}
```

- [ ] **Step 2: Create publish route**

`POST /api/hotels/[id]/publish` — requireRole("admin") + requireHotelAccess.

Validate: hotel has ≥1 page with ≥1 section. Auto-generate hotelSlug from name if not set: `name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")`. Check slug unique within org.

Set `publishedAt = new Date()`, save hotelSlug. Call `revalidateHotelPages(id)`.

Return `{ published: true, hotelSlug, url: "/${hotelSlug}/" }`.

- [ ] **Step 3: Create unpublish route**

`POST /api/hotels/[id]/unpublish` — requireRole("admin") + requireHotelAccess.

Set `publishedAt = null`. Call `revalidateHotelPages(id)`.

Return `{ published: false }`.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 6: CMS UI — publish button, status badges, domain config

**Files:**
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx`
- Modify: `src/app/(dashboard)/brand/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Add publish/unpublish to hotel detail page**

Read `src/app/(dashboard)/hotels/[id]/page.tsx`. Add:

- In the hotel header area: status badge — green "Live" pill if publishedAt is set, gray "Draft" pill if null
- For admins: "Publish" button (teal) if draft, "Unpublish" button (gray) if live
- When published: show "View Live Site →" link (small, muted) — links to `/site/${orgSlug}/${hotelSlug}/`
- Hotel slug display: show current slug, editable input for admin (auto-generated from name if empty)
- Client wrapper for the publish/unpublish buttons: POST to `/api/hotels/[id]/publish` or `/unpublish`, show loading, router.refresh()

- [ ] **Step 2: Add custom domain to brand page**

Read `src/app/(dashboard)/brand/page.tsx`. Add a third section "Custom Domain" (glass-card-static):

- Input: "Custom Domain" text field, placeholder "yourdomain.com"
- Current value from org.customDomain
- "Save Domain" button → PUT `/api/brand/domain` (new route: updates org.customDomain)
- Helper text: "Point your domain's DNS CNAME to your server's address"
- Show current public URL format: `{domain}/{hotelSlug}/`

Create `src/app/api/brand/domain/route.ts`: PUT, requireRole("admin"), accepts `{ customDomain }`, updates org.

- [ ] **Step 3: Add published status to dashboard cards**

Read `src/app/(dashboard)/dashboard/page.tsx`. On each property card, add a small published indicator:
- If hotel.publishedAt is set: small green dot + "Live"
- If not: small gray dot + "Draft"
- Show next to the health grade badge

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
