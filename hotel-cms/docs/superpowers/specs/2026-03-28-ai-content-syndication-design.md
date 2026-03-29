# AI Content Syndication — Design Spec

**Goal:** Enable chain managers to create a promotional brief once and have AI generate adapted content for every hotel property, injected into their homepages. Managed campaigns allow one-click removal.

**Decisions:**
- Inject promotional section into each hotel's homepage (add_section + replace_html)
- Managed campaigns with createdSections tracking for one-click end/removal
- One LLM call per hotel, sequential execution

---

## 1. Campaign Data Model

### New Prisma models

```prisma
enum CampaignStatus {
  draft
  active
  ended
}

model Campaign {
  id              String         @id @default(uuid())
  orgId           String         @map("org_id")
  title           String
  brief           String
  status          CampaignStatus @default(draft)
  targetHotels    Json           @default("[]") @map("target_hotels")    // hotel ID array, [] = all
  createdSections Json           @default("[]") @map("created_sections") // [{ hotelId, sectionId, pageId }]
  createdById     String         @map("created_by_id")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  org       Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  createdBy User         @relation(fields: [createdById], references: [id])

  @@map("campaigns")
}
```

Add relations: `campaigns Campaign[]` on Organization, `campaigns Campaign[]` on User.

### createdSections structure

```json
[
  { "hotelId": "uuid", "sectionId": "uuid", "pageId": "uuid", "locale": "en" },
  { "hotelId": "uuid", "sectionId": "uuid", "pageId": "uuid", "locale": "fr" }
]
```

Tracks every section created by this campaign for cleanup.

### Files
- Modify: `prisma/schema.prisma` — add CampaignStatus enum, Campaign model, relations on Org + User
- Run migration

---

## 2. Campaign Execution

### Utility: `src/lib/campaigns/execute.ts`

```typescript
async function executeCampaign(campaignId: string): Promise<{ deployed: number; failed: number }>
```

**Per hotel:**
1. Fetch hotel with: name, category, contactInfo, theme, context (brand voice), enabledLocales, pages
2. Find homepage: page with slug "/" and locale = defaultLocale
3. Call LLM (OpenRouter, same pattern as existing) with prompt:
   ```
   You are creating a promotional banner for a hotel website.

   Campaign: "{title}"
   Brief: "{brief}"

   Hotel: {name} ({category}) in {city}, {country}
   Brand voice: "{brandVoice}"
   Theme: primary={primary}, accent={accent}

   Generate a promotional banner as complete HTML with inline styles.
   Use the hotel's brand colors in the design.
   Mention the hotel by name.
   Include: attention-grabbing headline, short description, CTA button linking to {{booking}}.
   Make it visually striking. All styles must be inline (style="...").
   ```
4. Create section: `add_section` with variant `hero_minimal` at position 1 (after hero)
5. Apply `replace_html` with LLM output
6. Record `{ hotelId, sectionId, pageId, locale: defaultLocale }` in campaign.createdSections
7. For each additional locale in hotel.enabledLocales: find locale homepage, clone the section, translate the HTML text via LLM, record
8. Update campaign status to "active"

**Error handling:** If one hotel fails, record the error, continue to next. Return deployed + failed counts.

### Files
- Create: `src/lib/campaigns/execute.ts`

---

## 3. Campaign Cleanup

### Utility: `src/lib/campaigns/cleanup.ts`

```typescript
async function endCampaign(campaignId: string): Promise<{ removed: number }>
```

1. Fetch campaign, get createdSections array
2. For each entry: `prisma.section.delete({ where: { id: sectionId } })` — wrapped in try/catch (section may already be manually deleted)
3. Update campaign status to "ended", clear createdSections
4. Return count of removed sections

### Files
- Create: `src/lib/campaigns/cleanup.ts`

---

## 4. Campaign API Routes

### `POST /api/campaigns` — Create campaign

Auth: requireRole("admin"). Accepts: `{ title, brief, targetHotels }`. Creates Campaign with status "draft". Returns campaign.

### `GET /api/campaigns` — List campaigns

Auth: requireAuth. Fetch all campaigns for user's org, ordered by createdAt desc. Return array.

### `GET /api/campaigns/[id]` — Campaign detail

Auth: requireAuth. Return campaign with createdSections.

### `POST /api/campaigns/[id]/launch` — Launch campaign

Auth: requireRole("admin"). Calls `executeCampaign(id)`. `export const maxDuration = 300` (5 min for many hotels). Returns `{ deployed, failed }`.

### `POST /api/campaigns/[id]/end` — End campaign

Auth: requireRole("admin"). Calls `endCampaign(id)`. Returns `{ removed }`.

### `DELETE /api/campaigns/[id]` — Delete campaign

Auth: requireRole("admin"). If active, end it first. Then delete record.

### Files
- Create: `src/app/api/campaigns/route.ts` — GET list, POST create
- Create: `src/app/api/campaigns/[id]/route.ts` — GET detail, DELETE
- Create: `src/app/api/campaigns/[id]/launch/route.ts` — POST launch
- Create: `src/app/api/campaigns/[id]/end/route.ts` — POST end

---

## 5. Campaign Management UI

### Sidebar update

Add "Campaigns" icon to sidebar nav (admin only), linking to `/campaigns`.

### Campaigns list page: `/campaigns`

Server component. Shows all campaigns as cards:
- Title, status badge (draft=purple, active=teal, ended=gray), hotel count, creation date
- "New Campaign" button opens CreateCampaignModal

### CreateCampaignModal

"use client" modal. Fields:
- Title: text input ("Summer Pool Package")
- Brief: textarea ("20% off all pool-view rooms, highlight pool amenities, target couples and families")
- Target Hotels: checkboxes of all org hotels with "Select All" toggle
- "Create Campaign" button → POST /api/campaigns → redirects to campaign detail

### Campaign detail page: `/campaigns/[id]`

Server component. Shows:
- Campaign title, brief, status badge
- If draft: "Launch Campaign" button (triggers POST /launch, shows progress)
- If active: deployment table (hotel name, status checkmark/X, locale, link to preview section), "End Campaign" button
- If ended: "Campaign ended on {date}" with deployment history

### Progress during launch

"use client" wrapper. On launch click: show "Deploying to {N} hotels..." with progress. Poll or wait for the API response (maxDuration 300s). Show result: "Deployed to 8/10 hotels. 2 failed."

### Files
- Create: `src/app/(dashboard)/campaigns/page.tsx`
- Create: `src/app/(dashboard)/campaigns/[id]/page.tsx`
- Create: `src/components/cms/CreateCampaignModal.tsx`
- Modify: `src/components/sidebar-nav.tsx` — add Campaigns icon (admin only)

---

## Out of Scope
- Scheduled start/end dates (v2)
- A/B testing different promotional content per hotel
- Campaign analytics (click tracking on promotional sections)
- Template library for common promotions
- Approval workflow (editor creates, admin approves)
