# Publishing & Domain System — Design Spec

**Goal:** Enable hotel chains to publish websites to a custom domain with per-hotel sub-paths, backed by ISR for production performance.

**Decisions:**
- Dynamic catch-all route + ISR for published sites
- Next.js middleware for domain-based routing (Host header → org lookup → rewrite)
- Auto-generated property directory for chain root
- On-demand revalidation on content changes

---

## 1. Data Model Changes

### Organization — new fields

```prisma
  customDomain String? @unique @map("custom_domain")  // "cghearth.com"
  published    Boolean @default(false)                  // whether public site is live
```

### Hotel — new fields

```prisma
  slug         String                                    // already exists, ensure unique within org
  publishedAt  DateTime? @map("published_at")            // null = draft, Date = published
```

Add unique constraint: `@@unique([orgId, slug])` on Hotel to prevent duplicate slugs within an org.

### URL Structure

```
cghearth.com/                           → chain property directory
cghearth.com/palais-de-mahe/            → hotel homepage
cghearth.com/palais-de-mahe/rooms       → hotel rooms page
cghearth.com/palais-de-mahe/fr/rooms    → hotel rooms page (French)
```

### Files
- Modify: `prisma/schema.prisma`
- Run migration

---

## 2. Routing Architecture — Middleware

### `src/middleware.ts`

Next.js middleware that runs on every request:

1. Read `Host` header
2. Skip if host is localhost, admin domain, or API/dashboard paths
3. Look up org by customDomain (cached in-memory Map, 60s TTL)
4. If match: rewrite URL internally:
   - `cghearth.com/` → `/site/demo-hotel-group`
   - `cghearth.com/palais-de-mahe/rooms` → `/site/demo-hotel-group/palais-de-mahe/rooms`
5. If no match: pass through (normal CMS routing)

### Matcher config

```typescript
export const config = {
  matcher: [
    // Skip internal paths: _next, api, dashboard, preview, static files
    '/((?!_next|api|dashboard|hotels|components|team|campaigns|brand|login|register|preview|site|docs|guide|.*\\.).*)',
  ],
};
```

### Domain lookup caching

```typescript
const domainCache = new Map<string, { orgSlug: string; orgId: string; expires: number }>();
const CACHE_TTL = 60_000; // 60 seconds
```

### Local development fallback

`/site/[orgSlug]/...` is directly accessible without middleware for testing on localhost.

### Files
- Create: `src/middleware.ts`

---

## 3. Public Site Renderer

### Route: `src/app/site/[orgSlug]/[[...path]]/page.tsx`

Optional catch-all route. Handles three cases based on `path` array:

**Case 1: No path (chain root)**
- `path` is undefined or empty
- Fetch org by slug, fetch all published hotels (`publishedAt IS NOT NULL`)
- Render property directory: org name heading, grid of hotel cards (name, category, city, image, link to `/{hotelSlug}/`)
- Use org's brandTheme for styling if set

**Case 2: Hotel homepage (`path = ["palais-de-mahe"]`)**
- First path segment = hotel slug
- Look up hotel by slug + orgId, check publishedAt is not null
- Render homepage (page with slug "/") using same logic as preview route
- No preview banner, no admin overlays

**Case 3: Hotel subpage (`path = ["palais-de-mahe", "rooms"]`)**
- First segment = hotel slug, second = page slug
- Also handles locale: `["palais-de-mahe", "fr", "rooms"]` — detect if second segment is a 2-letter locale code

**Rendering logic:** Reuse the same rendering pipeline as preview (fetch hotel+theme+sections+rooms+media, enrich props, resolve smart links, inject structured data, inject locked sections). Extract into a shared utility `renderHotelPage(hotelId, pageSlug, locale?)` to avoid code duplication.

**ISR:**
```typescript
export const revalidate = 3600; // hourly baseline
```

**No preview banner, no admin tools** — this is the clean public version.

### Shared renderer utility: `src/lib/render-page.ts`

Extract common rendering logic from preview route into a reusable function:

```typescript
export async function getHotelPageData(hotelId: string, pageSlug: string, locale?: string): Promise<PageRenderData>
```

Both preview routes and the public site route call this. Returns all data needed for PageRenderer: sections, theme, rooms, media, hotelLinkData, structured data, locked sections.

### Files
- Create: `src/app/site/[orgSlug]/[[...path]]/page.tsx`
- Create: `src/lib/render-page.ts`
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx` — use shared renderer
- Modify: `src/app/preview/[hotelId]/lang/[locale]/[pageSlug]/page.tsx` — use shared renderer

---

## 4. Publish Flow

### Publishing a hotel

Admin clicks "Publish" on hotel detail page:
1. Validate: hotel has ≥1 page with ≥1 section, hotel has a slug
2. Auto-generate slug from hotel name if not set: `name.toLowerCase().replace(/[^a-z0-9]+/g, "-")`
3. Set `publishedAt = new Date()`
4. Call `revalidatePath('/site/[orgSlug]')` to update the property directory
5. Return success with public URL

### Unpublishing

Set `publishedAt = null`. Call revalidatePath.

### API routes

`POST /api/hotels/[id]/publish` — requireRole("admin") + requireHotelAccess. Validates, sets publishedAt, revalidates. Returns `{ published: true, url: "/{hotelSlug}/" }`.

`POST /api/hotels/[id]/unpublish` — requireRole("admin"). Sets publishedAt = null. Returns `{ published: false }`.

### On-demand revalidation

New utility: `src/lib/revalidate.ts`

```typescript
export async function revalidateHotelPages(hotelSlug: string, orgSlug: string): Promise<void>
// Calls revalidatePath for:
// /site/[orgSlug]/[hotelSlug]
// /site/[orgSlug]/[hotelSlug]/rooms
// /site/[orgSlug]/[hotelSlug]/gallery
// etc. for all pages
// Also revalidates /site/[orgSlug] (property directory)
```

Called after: section CRUD, page update, theme change, hotel update, AI execute, brand governance change.

### Files
- Create: `src/app/api/hotels/[id]/publish/route.ts`
- Create: `src/app/api/hotels/[id]/unpublish/route.ts`
- Create: `src/lib/revalidate.ts`

---

## 5. CMS UI Integration

### Hotel detail page

- New "Publish" / "Unpublish" button in the hotel header (admin only)
- Published status badge: green "Live" pill or gray "Draft" pill
- When published: show "View Live Site →" link to the public URL
- Hotel slug shown + editable (auto-generated from name, admin can customize)

### Brand/Org settings

- "Custom Domain" input field on the brand page
- Shows current public URL format: `yourdomain.com/[hotelSlug]`
- Instructions: "Point your domain's DNS to [server IP]. Add a CNAME record for your domain."
- Save updates org.customDomain

### Dashboard property cards

- Published hotels show green dot / "Live" badge
- Unpublished show gray "Draft"

### Files
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx` — publish button, status badge, slug editor
- Modify: `src/app/(dashboard)/brand/page.tsx` — custom domain field
- Modify: `src/app/(dashboard)/dashboard/page.tsx` — published status on cards

---

## Out of Scope
- SSL certificate management for custom domains
- Subdomain routing (hotel.cghearth.com vs cghearth.com/hotel)
- Static HTML export to external CDN
- Custom 404 pages per hotel
- Analytics / visitor tracking on public pages
- Password-protected preview for unpublished hotels
