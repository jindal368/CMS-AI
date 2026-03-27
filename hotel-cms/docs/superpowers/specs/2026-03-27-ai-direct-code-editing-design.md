# AI Direct Code Editing — Design Spec

**Goal:** Enable AI to make changes directly to generated website HTML/CSS, not just through structured CMS operations. Each hotel gets persistent AI context so the AI always knows the full state.

**Decisions:**
- Hybrid layer: CMS operations + custom CSS/HTML override layer
- Full context: Schema + AI memory + rendered HTML snapshot per hotel
- Smart merge: Warn on conflicts, let user choose keep/discard/re-apply

---

## 1. Hotel Context Store

New Prisma model storing persistent AI context per hotel.

```prisma
model HotelContext {
  id            String   @id @default(uuid())
  hotelId       String   @unique @map("hotel_id")
  brandVoice    String   @default("")         // "warm, romantic, understated luxury"
  styleNotes    String   @default("")         // "owner prefers dark tones, gold accents"
  pastDecisions Json     @default("[]")       // [{prompt, decision, reasoning, timestamp}]
  preferences   Json     @default("{}")       // {colorPreference, typography, mood}
  renderedHtml  Json     @default("{}")       // {"/": "<html>...", "/rooms": "<html>..."} per page slug
  renderedCss   String   @default("")         // combined custom CSS across all sections
  lastSnapshot  DateTime @default(now()) @map("last_snapshot")
  updatedAt     DateTime @updatedAt @map("updated_at")

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("hotel_contexts")
}
```

**Behavior:**
- Created automatically when a hotel is created (empty defaults)
- After every AI action or CMS edit, the system re-renders affected page(s) and stores full HTML in `renderedHtml`
- Before every AI prompt, the full context is loaded: schema + memory + rendered snapshot
- `pastDecisions` is appended after each AI interaction with: prompt, approach used, what changed, timestamp
- `brandVoice` and `styleNotes` are updated when AI detects brand-relevant information in prompts
- `preferences` stores extracted patterns (color preference, typography style, mood)

### Files to create/modify
- Modify: `prisma/schema.prisma` — add HotelContext model + relation on Hotel
- Create: `src/lib/hotel-context.ts` — CRUD functions for context (get, update, appendDecision, updateSnapshot)
- Modify: `prisma/seed/index.ts` — seed initial context for The Meridian

---

## 2. Custom Override Layer

Each section gets optional custom CSS/HTML overrides stored alongside structured props.

### Schema changes

```prisma
model Section {
  // ... existing fields ...
  customCss    String?  @map("custom_css")     // scoped CSS for this section
  customHtml   String?  @map("custom_html")    // full HTML replacement
  customMode   Boolean  @default(false) @map("custom_mode")  // true = custom HTML active
}
```

### Three rendering states per section

1. **Component mode** (default): `customMode=false`, no overrides. Normal component rendering.
2. **Enhanced mode**: `customMode=false`, `customCss` exists. Component renders normally, custom CSS injected as a scoped `<style>` block wrapping the section.
3. **Custom mode**: `customMode=true`, `customHtml` exists. Component bypassed, raw HTML rendered directly.

### Rendering changes

In `RenderSection.tsx`, before rendering the component variant:

```
if (section.customMode && section.customHtml) {
  // Custom mode: render raw HTML directly
  return <div dangerouslySetInnerHTML={{ __html: section.customHtml }} />
}

// Normal component rendering
const rendered = <ComponentVariant {...props} />

if (section.customCss) {
  // Enhanced mode: inject scoped CSS
  return (
    <>
      <style>{section.customCss}</style>
      {rendered}
    </>
  )
}

return rendered
```

### Files to modify
- Modify: `prisma/schema.prisma` — add customCss, customHtml, customMode fields to Section
- Modify: `src/components/renderer/RenderSection.tsx` — add override rendering logic
- Modify: `src/components/cms/PageBuilder.tsx` — show override indicator badge on sections with custom edits

---

## 3. Smart Merge — Conflict Detection

When a CMS structured edit (component swap, prop change) targets a section with custom overrides, the system detects the conflict and asks the user.

### API response format

When a section edit would conflict with overrides, the API returns:

```json
{
  "conflict": true,
  "sectionId": "xxx",
  "overrideType": "enhanced | custom",
  "options": [
    { "action": "keep", "label": "Keep custom edits, apply CMS change underneath" },
    { "action": "discard", "label": "Discard custom edits, use fresh component output" },
    { "action": "reapply", "label": "Apply CMS change, then ask AI to re-apply custom styles" }
  ]
}
```

### Option behavior

- **keep**: CMS edit applies to structured fields, custom CSS/HTML stays. May look inconsistent.
- **discard**: Clear `customCss`/`customHtml`, set `customMode=false`. Pure component rendering.
- **reapply**: CMS edit applies, overrides cleared, then system auto-prompts AI with the original intent from `pastDecisions` to regenerate overrides for the new component.

### UI

A modal in the page builder when conflict is detected. Three buttons matching the options. The edit doesn't proceed until the user picks one.

### Files to create/modify
- Create: `src/components/cms/ConflictModal.tsx` — conflict resolution modal
- Modify: `src/app/api/sections/[id]/route.ts` — detect overrides before applying PUT, return conflict if needed
- Modify: `src/components/cms/SectionEditor.tsx` — handle conflict response, show modal

---

## 4. Updated AI Prompt Flow

### Context gathering (before LLM call)

Load the full hotel context:
1. Hotel data + theme + rooms + media + all pages + all sections (existing)
2. `HotelContext.brandVoice`, `styleNotes`, `preferences` (new)
3. `HotelContext.renderedHtml[currentPageSlug]` — the actual HTML of the current page (new)
4. Any existing `customCss`/`customHtml` on target sections (new)

### New operations

Added to the operations schema that the LLM can emit:

```
inject_css:
  { "op": "inject_css", "sectionId": "xxx", "css": ".hero-wrapper { background: #1a1a2e; color: gold; }" }
  → Writes to section.customCss. Keeps customMode=false (enhanced mode).

replace_html:
  { "op": "replace_html", "sectionId": "xxx", "html": "<div class='custom-hero'>...</div>" }
  → Writes to section.customHtml. Sets customMode=true (custom mode).

clear_overrides:
  { "op": "clear_overrides", "sectionId": "xxx" }
  → Clears customCss/customHtml, sets customMode=false. Reverts to component.

save_memory:
  { "op": "save_memory", "note": "User prefers dark romantic aesthetic with gold accents" }
  → Appends to HotelContext.pastDecisions with timestamp.

update_brand_voice:
  { "op": "update_brand_voice", "brandVoice": "warm, romantic, understated luxury" }
  → Updates HotelContext.brandVoice.
```

### Approach selection in prompt

The AI prompt instructs the model to pick the lightest tool:

```
APPROACH SELECTION (always use the lightest that works):
1. CMS operations (update_text, swap_component, update_theme, etc.)
   → For changes expressible through structured data
2. inject_css — For visual tweaks components can't express
   → Scoped CSS added on top of component output
3. replace_html — For completely custom designs
   → Component bypassed, raw HTML served
4. save_memory / update_brand_voice — For learning user preferences
   → Always emit alongside other operations when you learn something new
```

### Post-execution

After every AI execution:
1. Re-render the affected page(s) server-side
2. Store the rendered HTML in `HotelContext.renderedHtml`
3. Append to `pastDecisions`: `{ prompt, approach, operations, reasoning, timestamp }`
4. If AI detected brand/style preferences, update `brandVoice` or `preferences`

### Files to modify
- Modify: `src/lib/llm/operations.ts` — add inject_css, replace_html, clear_overrides, save_memory, update_brand_voice executors
- Modify: `src/lib/llm/prompts.ts` — include rendered HTML snapshot + AI memory in prompts, add new operations to schema
- Modify: `src/lib/llm/index.ts` — load HotelContext, pass to prompts, update snapshot after execution
- Create: `src/lib/snapshot.ts` — function to render a page to HTML string and store in HotelContext

---

## Out of Scope

- Exporting hotel as standalone static site (full code export)
- Visual drag-and-drop HTML editor
- Per-page custom CSS (only per-section for now)
- Version diffing of custom HTML changes (version system already tracks snapshots)
