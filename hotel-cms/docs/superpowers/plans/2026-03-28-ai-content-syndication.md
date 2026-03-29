# AI Content Syndication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable chain managers to broadcast promotional content across all hotel properties with AI-adapted versions per hotel, tracked as managed campaigns with one-click removal.

**Architecture:** New Campaign model stores briefs and tracks created sections. Execution utility iterates hotels, calls LLM per hotel to generate adapted promotional HTML, injects into homepages. Cleanup utility removes all tracked sections on campaign end. CMS gets a campaigns dashboard for creating, launching, and ending campaigns.

**Tech Stack:** Prisma (Campaign model), OpenRouter LLM (per-hotel content generation), Next.js server components + client modals.

---

### Task 1: Prisma schema — Campaign model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add CampaignStatus enum and Campaign model**

Read `prisma/schema.prisma`. Add after the UserRole enum:

```prisma
enum CampaignStatus {
  draft
  active
  ended
}
```

Add Campaign model after SeoAudit:

```prisma
model Campaign {
  id              String         @id @default(uuid())
  orgId           String         @map("org_id")
  title           String
  brief           String
  status          CampaignStatus @default(draft)
  targetHotels    Json           @default("[]") @map("target_hotels")
  createdSections Json           @default("[]") @map("created_sections")
  createdById     String         @map("created_by_id")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  org       Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  createdBy User         @relation(fields: [createdById], references: [id])

  @@map("campaigns")
}
```

Add `campaigns Campaign[]` relation to both Organization and User models.

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-campaigns`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Campaign execution + cleanup utilities

**Files:**
- Create: `src/lib/campaigns/execute.ts`
- Create: `src/lib/campaigns/cleanup.ts`

- [ ] **Step 1: Create execute utility**

Create `src/lib/campaigns/execute.ts`. Import prisma from `@/lib/db`.

Export `executeCampaign(campaignId: string): Promise<{ deployed: number; failed: number }>`.

Logic:
1. Fetch campaign with org. If status !== "draft", throw error.
2. Determine target hotels: if targetHotels array is empty, fetch all hotels in org. Otherwise fetch hotels by IDs. Include: theme, context, pages (with sections), enabledLocales.
3. Initialize `createdSections: Array<{ hotelId: string; sectionId: string; pageId: string; locale: string }>` = [].
4. For each hotel:
   a. Extract: name, category, city/country from contactInfo, brandVoice from context, theme colors
   b. Find homepage: page with slug "/" and locale = hotel.defaultLocale (or "en")
   c. If no homepage, skip (record failure)
   d. Call OpenRouter LLM (fetch to `https://openrouter.ai/api/v1/chat/completions`, model `nvidia/nemotron-3-super-120b-a12b:free`, max_tokens 2048). Use `process.env.OPENROUTER_API_KEY`. Prompt:
   ```
   Create a promotional banner for a hotel website.
   Campaign: "{title}"
   Brief: "{brief}"
   Hotel: {name} ({category}) in {city}, {country}
   Brand voice: "{brandVoice || "professional, welcoming"}"

   Generate a promotional banner as complete HTML with inline styles.
   Use these brand colors: primary={primary}, accent={accent}.
   Mention the hotel name. Include headline, short description, CTA button linking to {{booking}}.
   All styles inline (style="..."). Keep it under 500 chars of HTML.
   Return ONLY the HTML, no explanation.
   ```
   e. Extract HTML from response (handle markdown fences: regex for ```html...```, or take raw)
   f. Create section: `prisma.section.create({ data: { pageId: homepage.id, componentVariant: "hero_minimal", sortOrder: 1, isVisible: true, props: {} as any, customHtml: html, customMode: true } })`
   g. Push `{ hotelId, sectionId: section.id, pageId: homepage.id, locale: hotel.defaultLocale || "en" }` to createdSections
   h. Catch errors per hotel, increment failed count
5. Update campaign: `prisma.campaign.update({ where: { id: campaignId }, data: { status: "active", createdSections: createdSections as any } })`
6. Return { deployed, failed }

- [ ] **Step 2: Create cleanup utility**

Create `src/lib/campaigns/cleanup.ts`. Import prisma from `@/lib/db`.

Export `endCampaign(campaignId: string): Promise<{ removed: number }>`.

Logic:
1. Fetch campaign. If status !== "active", throw error.
2. Parse createdSections as array of `{ sectionId }`.
3. For each entry: try `prisma.section.delete({ where: { id: sectionId } })` catch (ignore if already deleted).
4. Update campaign: status "ended", createdSections [] (cleared).
5. Return { removed: count of successful deletes }

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: Campaign API routes

**Files:**
- Create: `src/app/api/campaigns/route.ts`
- Create: `src/app/api/campaigns/[id]/route.ts`
- Create: `src/app/api/campaigns/[id]/launch/route.ts`
- Create: `src/app/api/campaigns/[id]/end/route.ts`

- [ ] **Step 1: Create campaigns list + create route**

`GET /api/campaigns` — requireAuth. Fetch all campaigns where orgId = user's org, ordered by createdAt desc. Return array with id, title, status, targetHotels count, createdSections count, createdAt.

`POST /api/campaigns` — requireRole("admin"). Accepts `{ title, brief, targetHotels }`. Validate title non-empty, brief non-empty. Create Campaign with orgId, createdById = user.id, status "draft". Return campaign.

- [ ] **Step 2: Create campaign detail + delete route**

`GET /api/campaigns/[id]` — requireAuth. Fetch campaign, verify it belongs to user's org. Return full campaign including createdSections.

`DELETE /api/campaigns/[id]` — requireRole("admin"). If campaign is active, call endCampaign first. Then delete record. Return { deleted: true }.

Next.js 16 params: `Promise<{ id: string }>`.

- [ ] **Step 3: Create launch route**

`POST /api/campaigns/[id]/launch` — requireRole("admin"). `export const maxDuration = 300`. Call `executeCampaign(id)`. Return `{ deployed, failed }`.

- [ ] **Step 4: Create end route**

`POST /api/campaigns/[id]/end` — requireRole("admin"). Call `endCampaign(id)`. Return `{ removed }`.

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: Campaigns list + detail pages

**Files:**
- Create: `src/app/(dashboard)/campaigns/page.tsx`
- Create: `src/app/(dashboard)/campaigns/[id]/page.tsx`

- [ ] **Step 1: Create campaigns list page**

`src/app/(dashboard)/campaigns/page.tsx` — server component, force-dynamic. Call getSessionOrRedirect, check role === admin (redirect to /dashboard if not).

Fetch campaigns for the org via prisma. Serialize dates.

Render:
- Header: "Campaigns" + count + "New Campaign" button (opens CreateCampaignModal from Task 5)
- Campaign cards (glass-card): title, status badge (draft=purple, active=teal, ended=gray with opacity), target hotel count ("All hotels" or "N hotels"), deployed sections count, created date relative, created by name. Click card → /campaigns/[id].

Empty state: "No campaigns yet. Create your first promotional campaign."

Pass campaigns + hotels list (for the modal) to a client wrapper component.

- [ ] **Step 2: Create campaign detail page**

`src/app/(dashboard)/campaigns/[id]/page.tsx` — server component, force-dynamic. Fetch campaign + resolve hotel names from createdSections.

Render:
- Breadcrumb: Campaigns > {title}
- Glass card header: title, brief (displayed in full), status badge, created by, created date
- If draft: large "Launch Campaign" button (coral gradient). Client component that POSTs to /launch, shows progress "Deploying..." with spinner, displays result on success.
- If active: deployment table — hotel name, locale, status (checkmark), "Preview" link to /preview/[hotelId]/home. "End Campaign" button (red, with confirmation).
- If ended: "Campaign ended" message with deployment history.

Client wrapper for the action buttons (launch/end).

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 5: CreateCampaignModal + sidebar update

**Files:**
- Create: `src/components/cms/CreateCampaignModal.tsx`
- Modify: `src/components/sidebar-nav.tsx`

- [ ] **Step 1: Create CreateCampaignModal**

`src/components/cms/CreateCampaignModal.tsx` — "use client" modal. Props: `{ hotels: Array<{id: string, name: string}>, onClose: () => void }`.

Glass card modal with fields:
- Title: text input, required, placeholder "Summer Pool Package"
- Brief: textarea, required, placeholder "20% off all pool-view rooms. Highlight pool amenities, target couples and families. Mention seasonal availability."
- Target Hotels: checkboxes of all hotels with "Select All" toggle. Shows hotel name + category badge per checkbox.
- "Create Campaign" button → POST /api/campaigns → on success, `router.push('/campaigns/' + campaign.id)`.

Styled with glassmorphism, coral accent buttons.

- [ ] **Step 2: Add Campaigns to sidebar**

Read `src/components/sidebar-nav.tsx`. Add a "Campaigns" nav item (megaphone/broadcast icon) after the Team link. Only show if `user?.role === "admin"`. Link to `/campaigns`. SVG icon: a simple megaphone or broadcast icon.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
