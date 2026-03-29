# Brand Governance Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable chain admins to set org-wide brand themes and locked sections that cascade to all hotels, enforced in the renderer, page builder, and AI operations.

**Architecture:** New brandTheme and lockedSections JSON fields on Organization. Renderer checks org for theme override and injects locked sections at top/bottom. Page builder shows locked sections as read-only with lock icon. AI executor skips operations targeting locked section IDs. Brand management page lets admins configure theme + locked sections.

**Tech Stack:** Prisma (Organization fields), Next.js server components, existing component renderer + theme system.

---

### Task 1: Prisma schema — brandTheme + lockedSections on Organization

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields to Organization model**

Read `prisma/schema.prisma`. Add to Organization model after `brandGuidelines`:

```prisma
  brandTheme     Json?  @map("brand_theme")
  lockedSections Json   @default("[]") @map("locked_sections")
```

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-brand-governance`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Renderer integration — theme override + locked section injection

**Files:**
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx`
- Modify: `src/app/preview/[hotelId]/lang/[locale]/[pageSlug]/page.tsx`

- [ ] **Step 1: Update default locale preview route**

Read `src/app/preview/[hotelId]/[pageSlug]/page.tsx`. Make these changes:

1. In the hotel fetch, include org: add `org: true` to the hotel's Prisma include (or if hotel already includes org, ensure it's there).

2. **Theme override:** After building the `themeData` variable, add:
```typescript
// Org brand theme override
const orgBrandTheme = (hotel.org as any)?.brandTheme;
if (orgBrandTheme) {
  // Override hotel theme with org brand theme
  themeData = {
    colorTokens: orgBrandTheme.colorTokens || themeData?.colorTokens,
    typography: orgBrandTheme.typography || themeData?.typography,
    spacing: orgBrandTheme.spacing || themeData?.spacing,
    baseTemplate: orgBrandTheme.baseTemplate || themeData?.baseTemplate,
  } as any;
}
```

3. **Locked sections:** After building the sections array, inject locked sections:
```typescript
// Inject org locked sections
const orgLockedSections = ((hotel.org as any)?.lockedSections || []) as Array<{
  id: string; label: string; position: string; componentVariant: string;
  props: Record<string, unknown>; customHtml?: string; customMode?: boolean;
}>;

const topLocked = orgLockedSections.filter(s => s.position === "top").map(s => ({
  id: s.id,
  componentVariant: s.componentVariant,
  props: s.props || {},
  sortOrder: -1000,
  isVisible: true,
  customCss: null,
  customHtml: s.customHtml || null,
  customMode: s.customMode || false,
}));

const bottomLocked = orgLockedSections.filter(s => s.position === "bottom").map(s => ({
  // same shape, sortOrder: 9999
}));

// Final sections: topLocked + page sections + bottomLocked
const allSections = [...topLocked, ...pageSections, ...bottomLocked];
```

Pass `allSections` to the renderer instead of just `pageSections`. Apply smart link resolution to locked sections too.

- [ ] **Step 2: Apply same changes to locale preview route**

Read `src/app/preview/[hotelId]/lang/[locale]/[pageSlug]/page.tsx`. Apply the identical theme override and locked section injection changes.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: AI protection — skip operations on locked sections

**Files:**
- Modify: `src/lib/llm/operations.ts`
- Modify: `src/lib/llm/index.ts`

- [ ] **Step 1: Add lockedSectionIds to TrustedContext**

In `src/lib/llm/operations.ts`, add to the `TrustedContext` interface:
```typescript
lockedSectionIds: string[]; // IDs of org-locked sections that cannot be modified
```

- [ ] **Step 2: Add locked section check in executeOperations**

In the `executeOperations` function, after `sanitizeOperation` and before `executeSingle`, add a check:

```typescript
// Skip operations targeting locked sections
const targetId = (operation as any).sectionId;
if (targetId && trusted.lockedSectionIds.includes(targetId)) {
  results.push({
    op: operation.op,
    success: false,
    details: { error: "Cannot modify locked section (managed by organization admin)" },
  });
  continue;
}
```

- [ ] **Step 3: Pass locked section IDs from LLM index**

In `src/lib/llm/index.ts`, where `trustedCtx` is built, add:

```typescript
// Get org locked section IDs
const orgLockedSections = ((hotel.org as any)?.lockedSections || []) as Array<{ id: string }>;

const trustedCtx: TrustedContext = {
  hotelId,
  pageId: currentPage?.id,
  sectionIds: pageSections.map(s => s.id),
  lockedSectionIds: orgLockedSections.map(s => s.id),
};
```

Ensure the hotel fetch includes org (it should already from previous tasks).

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: Page builder integration — read-only locked sections + theme banner

**Files:**
- Modify: `src/components/cms/PageBuilder.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/pages/[pageId]/page.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/theme/page.tsx`

- [ ] **Step 1: Pass locked sections to PageBuilder**

Read `src/app/(dashboard)/hotels/[id]/pages/[pageId]/page.tsx`. Fetch the hotel's org with lockedSections. Serialize and pass as `lockedSections` prop to PageBuilder.

- [ ] **Step 2: Render locked sections in PageBuilder**

Read `src/components/cms/PageBuilder.tsx`. Accept new prop: `lockedSections?: Array<{ id: string; label: string; position: string; componentVariant: string }>`.

In the section list, render locked sections:
- Top locked sections before the editable sections list
- Bottom locked sections after the editable sections list + "Add Section" button
- Each locked section card: grayed-out background (`opacity-50`), lock icon 🔒, label text, component variant name, no action buttons (no move/delete/visibility/drag)
- Clicking a locked section shows a small info card: "This section is managed by your organization admin. Contact them to make changes."

Style the locked sections distinctly: `bg-[#f0eef5]/50 border-dashed border-[#e2dfe8]` with `🔒` icon.

- [ ] **Step 3: Add org theme banner to theme editor**

Read `src/app/(dashboard)/hotels/[id]/theme/page.tsx`. Fetch the hotel's org brandTheme. If `org.brandTheme` is set:
- Show a banner at the top: "Organization theme is active. Brand colors and fonts are managed at the org level." with a teal info icon
- For non-admin users: disable the theme editor (just show current values as read-only)
- For admin users: show a toggle "Use hotel-specific theme override" that allows overriding

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 5: Brand management UI — brand page + API routes + sidebar

**Files:**
- Create: `src/app/(dashboard)/brand/page.tsx`
- Create: `src/components/cms/BrandThemeEditor.tsx`
- Create: `src/components/cms/LockedSectionManager.tsx`
- Create: `src/app/api/brand/route.ts`
- Create: `src/app/api/brand/theme/route.ts`
- Create: `src/app/api/brand/sections/route.ts`
- Modify: `src/components/sidebar-nav.tsx`

- [ ] **Step 1: Create Brand API routes**

`GET /api/brand` — requireRole("admin"). Fetch org for the user. Return `{ brandTheme, lockedSections }`.

`PUT /api/brand/theme` — requireRole("admin"). Accepts `{ brandTheme }` (object or null to clear). Update org.brandTheme. Return updated.

`PUT /api/brand/sections` — requireRole("admin"). Accepts `{ lockedSections }` (full array). Update org.lockedSections. Return updated.

- [ ] **Step 2: Create BrandThemeEditor component**

`src/components/cms/BrandThemeEditor.tsx` — "use client". Props: `{ brandTheme: object | null, onSave: () => void }`.

Same UI as the hotel ThemeEditor (color pickers, font inputs, spacing radio, template select) but:
- Toggle at top: "Apply organization theme to all hotels" (checkbox)
- When toggled on: form is enabled, save PUTs to `/api/brand/theme`
- When toggled off (or clearing): save PUTs with `{ brandTheme: null }`
- Preview swatch showing the theme colors

- [ ] **Step 3: Create LockedSectionManager component**

`src/components/cms/LockedSectionManager.tsx` — "use client". Props: `{ lockedSections: array, onUpdate: () => void }`.

Renders:
- List of locked section cards: label, position badge (top=purple, bottom=teal), component variant name, edit/delete buttons
- "Add Locked Section" button → inline form or modal:
  - Label input (e.g., "Corporate Footer")
  - Position: radio (Top / Bottom)
  - Component variant: select from COMPONENT_REGISTRY
  - Props: JSON textarea (simple for v1 — full props editor can come later)
  - Save → adds to array, PUTs full array to `/api/brand/sections`
- Edit: opens same form with pre-filled values
- Delete: removes from array with confirmation, PUTs updated array
- Generate unique IDs with `crypto.randomUUID()` on the client

- [ ] **Step 4: Create Brand page**

`src/app/(dashboard)/brand/page.tsx` — server component, force-dynamic. requireRole("admin"). Fetch org brandTheme + lockedSections. Serialize.

Renders:
- Header: "Brand Governance" heading
- Two sections in glass cards:
  1. "Organization Theme" → `<BrandThemeEditor>`
  2. "Locked Sections" → `<LockedSectionManager>`

- [ ] **Step 5: Add Brand to sidebar**

Read `src/components/sidebar-nav.tsx`. Add a "Brand" nav item after Campaigns (admin only). Use a shield/paintbrush icon. Link to `/brand`.

- [ ] **Step 6: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
