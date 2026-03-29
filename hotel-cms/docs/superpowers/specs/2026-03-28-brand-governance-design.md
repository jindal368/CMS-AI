# Brand Governance Engine — Design Spec

**Goal:** Enable chain admins to set org-wide brand themes and locked sections that cascade to all hotels, ensuring consistent branding while allowing local content customization.

**Decisions:**
- Theme + locked sections (no rules engine for v1)
- Locked sections visible but read-only in page builder with lock icon
- Resolved at render time — no per-hotel duplication of locked sections

---

## 1. Data Model

### New fields on Organization model

```prisma
model Organization {
  // existing fields...
  brandTheme    Json? @map("brand_theme")      // org-wide theme override
  lockedSections Json @default("[]") @map("locked_sections") // locked section definitions
}
```

### brandTheme structure

Same as hotel Theme: `{ colorTokens, typography, spacing, baseTemplate }`. When set, overrides all hotel themes in the org.

### lockedSections structure

```json
[
  {
    "id": "uuid",
    "label": "Corporate Footer",
    "position": "bottom",
    "componentVariant": "footer_rich",
    "props": { "copyrightText": "© 2026 Demo Hotel Group", "showNewsletter": true },
    "customHtml": null,
    "customMode": false
  },
  {
    "id": "uuid",
    "label": "Brand Header",
    "position": "top",
    "componentVariant": "hero_minimal",
    "props": { "headline": "A Demo Hotel Group Property", "bgColor": "#1a1a2e" },
    "customHtml": null,
    "customMode": false
  }
]
```

### Files
- Modify: `prisma/schema.prisma` — add brandTheme and lockedSections to Organization
- Run migration

---

## 2. Renderer Integration

### Preview page changes

In `src/app/preview/[hotelId]/[pageSlug]/page.tsx`:

1. Fetch the hotel's org: `hotel.org` (already available via include)
2. **Theme override:** If `org.brandTheme` is set, use it instead of `hotel.theme` for CSS variable injection
3. **Locked sections:** Parse `org.lockedSections`. Prepend "top" sections before page sections, append "bottom" sections after. Each locked section is rendered as a regular section through RenderSection (same component dispatch, same smart link resolution)
4. Locked sections get a `data-locked="true"` attribute on their wrapper div

### AI protection

In the LLM operations executor (`src/lib/llm/operations.ts`):
- Before executing any section-targeting operation (update_text, update_props, swap_component, inject_css, replace_html, remove_section), check if the target sectionId is a locked section ID
- Locked section IDs are passed via TrustedContext
- If locked, skip the operation and return `{ success: false, details: { error: "Cannot modify locked section" } }`

### Files
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx` — theme override + locked section injection
- Modify: `src/app/preview/[hotelId]/lang/[locale]/[pageSlug]/page.tsx` — same changes
- Modify: `src/lib/llm/operations.ts` — add locked section protection

---

## 3. Page Builder Integration

### Section list changes

In `src/components/cms/PageBuilder.tsx`:

1. Fetch org locked sections (passed from the server page via props)
2. Render "top" locked sections at the top of the section list:
   - Grayed-out card with 🔒 lock icon
   - Label text (e.g., "Corporate Footer")
   - No drag handle, no move/delete/visibility buttons
   - Clicking shows: "This section is managed by your organization admin."
3. Render "bottom" locked sections at the bottom
4. Regular (editable) sections render between them as usual
5. Locked sections also appear in the preview iframe (since they're rendered at preview time)

### Hotel theme editor changes

In `src/app/(dashboard)/hotels/[id]/theme/page.tsx`:
- If `org.brandTheme` is set, show a banner: "Organization theme is active. Contact your admin to change brand colors."
- Disable the theme editor for non-admin users when org theme is active
- Admin can still override per-hotel (adds a "Use hotel-specific theme" toggle)

### Files
- Modify: `src/components/cms/PageBuilder.tsx` — render locked sections as read-only
- Modify: `src/app/(dashboard)/hotels/[id]/pages/[pageId]/page.tsx` — pass org locked sections to PageBuilder
- Modify: `src/app/(dashboard)/hotels/[id]/theme/page.tsx` — org theme banner

---

## 4. Brand Management UI

### New page: `/brand`

Accessible from sidebar (admin only). New "Brand" icon between Team and Campaigns.

**Brand Theme section:**
- Same color picker / font / spacing / template editor as hotel theme
- Toggle: "Apply organization theme to all hotels" — when on, sets brandTheme; when off, clears it (hotels use own themes)
- Save button → PUT `/api/brand/theme`
- Preview swatch showing the theme

**Locked Sections section:**
- List of locked sections as cards: label, position badge (top/bottom), component variant name
- "Add Locked Section" button → modal:
  - Label input
  - Position: radio (Top / Bottom)
  - Component variant picker (from component registry)
  - Props editor (dynamic form based on component's propSchema)
  - Save → adds to org.lockedSections array
- Edit: click card to edit props
- Delete: with confirmation "This removes it from all hotel pages"
- All changes → PUT `/api/brand/sections`

### API routes

`GET /api/brand` — requireRole("admin"). Returns org's brandTheme + lockedSections.

`PUT /api/brand/theme` — requireRole("admin"). Accepts `{ brandTheme }` or `null` to clear. Updates org.

`PUT /api/brand/sections` — requireRole("admin"). Accepts full lockedSections array. Updates org.

### Files
- Create: `src/app/(dashboard)/brand/page.tsx`
- Create: `src/components/cms/BrandThemeEditor.tsx`
- Create: `src/components/cms/LockedSectionManager.tsx`
- Create: `src/app/api/brand/route.ts`
- Create: `src/app/api/brand/theme/route.ts`
- Create: `src/app/api/brand/sections/route.ts`
- Modify: `src/components/sidebar-nav.tsx` — add Brand icon

---

## Out of Scope
- Content rules engine ("headlines must be under 80 chars")
- Per-hotel override of locked sections (admin can only edit at org level)
- Locked section versioning
- Brand compliance scoring
- Template marketplace (pre-built brand templates)
