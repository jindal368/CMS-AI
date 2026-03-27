# AI Direct Code Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable AI to edit hotel website HTML/CSS directly (not just structured CMS data), with persistent per-hotel AI memory and smart merge conflict detection.

**Architecture:** Adds HotelContext model for AI memory + rendered snapshots. Extends Section model with customCss/customHtml/customMode fields. Modifies renderer to support override layers. Adds 5 new LLM operations (inject_css, replace_html, clear_overrides, save_memory, update_brand_voice). Updates prompts to include full rendered HTML context.

**Tech Stack:** Prisma (schema + migration), Next.js server components, OpenRouter LLM, React dangerouslySetInnerHTML for custom HTML rendering.

---

### Task 1: Add HotelContext model + Section override fields to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add HotelContext model and Section override fields**

Add to `prisma/schema.prisma`:

After the Hotel model's closing brace, add the HotelContext model:
```prisma
model HotelContext {
  id            String   @id @default(uuid())
  hotelId       String   @unique @map("hotel_id")
  brandVoice    String   @default("")
  styleNotes    String   @default("")
  pastDecisions Json     @default("[]")
  preferences   Json     @default("{}")
  renderedHtml  Json     @default("{}")
  renderedCss   String   @default("")
  lastSnapshot  DateTime @default(now()) @map("last_snapshot")
  updatedAt     DateTime @updatedAt @map("updated_at")

  hotel Hotel @relation(fields: [hotelId], references: [id], onDelete: Cascade)

  @@map("hotel_contexts")
}
```

Add to the Hotel model's relation list: `context HotelContext?`

Add to the Section model (after `updatedAt`):
```prisma
  customCss    String?  @map("custom_css")
  customHtml   String?  @map("custom_html")
  customMode   Boolean  @default(false) @map("custom_mode")
```

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-hotel-context-and-overrides`
Expected: Migration applied, client regenerated.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`
Expected: `✓ Compiled successfully`

---

### Task 2: Create hotel-context.ts CRUD library

**Files:**
- Create: `src/lib/hotel-context.ts`

- [ ] **Step 1: Create the hotel context CRUD module**

Create `src/lib/hotel-context.ts` with these functions:

```typescript
import { prisma } from "@/lib/db";

// Get or create context for a hotel
export async function getHotelContext(hotelId: string) { ... }

// Append a decision to pastDecisions array
export async function appendDecision(hotelId: string, decision: {
  prompt: string;
  approach: string;
  operations: string[];
  reasoning: string;
}) { ... }

// Update the rendered HTML snapshot for a page
export async function updateSnapshot(hotelId: string, pageSlug: string, html: string) { ... }

// Update brand voice
export async function updateBrandVoice(hotelId: string, brandVoice: string) { ... }

// Update style notes
export async function updateStyleNotes(hotelId: string, styleNotes: string) { ... }

// Update preferences
export async function updatePreferences(hotelId: string, preferences: Record<string, unknown>) { ... }
```

`getHotelContext` should upsert — if context doesn't exist for the hotel, create it with defaults and return it. Use `prisma.hotelContext.upsert` with `where: { hotelId }`, `create` with defaults, `update: {}`.

`appendDecision` should fetch current `pastDecisions`, parse as array, push the new decision with `timestamp: new Date().toISOString()`, and update. Cast JSON fields with `as any` for Prisma compatibility.

`updateSnapshot` should fetch current `renderedHtml`, parse as object, set `[pageSlug]: html`, and update the record + `lastSnapshot` timestamp.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`
Expected: `✓ Compiled successfully`

---

### Task 3: Update seed to create HotelContext for The Meridian

**Files:**
- Modify: `prisma/seed/index.ts`

- [ ] **Step 1: Add HotelContext seeding**

After the "Seeding initial schema version" section in the seed file, add:

```typescript
console.log("Seeding hotel context...");
await prisma.hotelContext.create({
  data: {
    hotelId: hotel.id,
    brandVoice: "warm, personal, understated luxury with French-Tamil heritage charm",
    styleNotes: "Earth tones, heritage architecture, romantic atmosphere. Serif headings (Cormorant Garamond), clean body text (DM Sans).",
    pastDecisions: [] as any,
    preferences: {
      colorPreference: "warm earth tones",
      typography: "serif headings, sans body",
      mood: "romantic, heritage, boutique",
    } as any,
    renderedHtml: {} as any,
    renderedCss: "",
  },
});
console.log("Created hotel context.");
```

Also add `hotelContext` to the clear sequence at the top of the seed (before `schemaVersion`).

- [ ] **Step 2: Re-seed and verify**

Run: `npx prisma db seed`
Expected: "Created hotel context." in output.

---

### Task 4: Update renderer to support custom overrides

**Files:**
- Modify: `src/components/renderer/RenderSection.tsx`
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx`

- [ ] **Step 1: Update RenderSection to handle custom overrides**

Read `src/components/renderer/RenderSection.tsx` first. The component receives section data and dispatches to variant components.

Add `customCss`, `customHtml`, and `customMode` to the `SectionData` interface (or whatever the section type is).

Before the switch statement, add override logic:

```typescript
// Custom mode: render raw HTML directly
if (section.customMode && section.customHtml) {
  return (
    <div
      data-section-id={section.id}
      data-custom-mode="true"
      dangerouslySetInnerHTML={{ __html: section.customHtml }}
    />
  );
}

// Normal component rendering (existing switch statement)
const rendered = /* existing switch/dispatch */;

// Enhanced mode: inject scoped CSS on top of component
if (section.customCss && rendered) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: section.customCss }} />
      {rendered}
    </>
  );
}

return rendered;
```

- [ ] **Step 2: Update preview page to pass override fields**

Read `src/app/preview/[hotelId]/[pageSlug]/page.tsx`. In the section mapping where it builds `SectionData` objects, add the three new fields:

```typescript
customCss: section.customCss ?? null,
customHtml: section.customHtml ?? null,
customMode: section.customMode ?? false,
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 5: Add override indicator in PageBuilder

**Files:**
- Modify: `src/components/cms/PageBuilder.tsx`

- [ ] **Step 1: Add customCss/customHtml/customMode to Section interface**

Read `src/components/cms/PageBuilder.tsx`. Find the `Section` interface (near the top). Add:

```typescript
customCss?: string | null;
customHtml?: string | null;
customMode?: boolean;
```

- [ ] **Step 2: Add visual indicator on sections with overrides**

In the section list item rendering, after the component variant name, add a badge:

```tsx
{(section.customCss || section.customHtml) && (
  <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded bg-[#7c5cbf]/15 text-[#7c5cbf] font-medium">
    {section.customMode ? "CUSTOM" : "CSS"}
  </span>
)}
```

- [ ] **Step 3: Update reloadSections to include override fields**

In the `reloadSections` function, ensure the fetched sections include `customCss`, `customHtml`, `customMode` from the API response.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 6: Add 5 new operations to the LLM operations system

**Files:**
- Modify: `src/lib/llm/operations.ts`

- [ ] **Step 1: Add new operation type interfaces**

After the existing operation interfaces (ReorderSectionsOp), add:

```typescript
export interface InjectCssOp {
  op: "inject_css";
  sectionId: string;
  css: string;
}

export interface ReplaceHtmlOp {
  op: "replace_html";
  sectionId: string;
  html: string;
}

export interface ClearOverridesOp {
  op: "clear_overrides";
  sectionId: string;
}

export interface SaveMemoryOp {
  op: "save_memory";
  hotelId: string;
  note: string;
}

export interface UpdateBrandVoiceOp {
  op: "update_brand_voice";
  hotelId: string;
  brandVoice: string;
}
```

Add them to the `CmsOperation` union type.

- [ ] **Step 2: Add executor functions**

Add these executor functions:

`executeInjectCss` — finds the section, updates `customCss` field (appends to existing if any), keeps `customMode=false`. Returns old/new css in details.

`executeReplaceHtml` — finds the section, sets `customHtml` and `customMode=true`. Returns the sectionId and variant in details.

`executeClearOverrides` — finds the section, sets `customCss=null`, `customHtml=null`, `customMode=false`. Returns what was cleared.

`executeSaveMemory` — calls `appendDecision` from `hotel-context.ts` with the note as the reasoning.

`executeUpdateBrandVoice` — calls `updateBrandVoice` from `hotel-context.ts`.

- [ ] **Step 3: Wire into executeSingle switch and sanitizeOperation**

Add cases for all 5 new ops in the `executeSingle` switch.

In `sanitizeOperation`, add:
- `inject_css`, `replace_html`, `clear_overrides` — sanitize sectionId same as update_text
- `save_memory`, `update_brand_voice` — override hotelId with trusted.hotelId

- [ ] **Step 4: Update getOperationsSchema**

Add the 5 new operations to the schema string that gets included in LLM prompts:

```
9. inject_css — Add custom CSS on top of component output
   { "op": "inject_css", "sectionId": "<id>", "css": "<scoped css rules>" }

10. replace_html — Replace section with fully custom HTML
    { "op": "replace_html", "sectionId": "<id>", "html": "<full html>" }

11. clear_overrides — Remove custom CSS/HTML, revert to component
    { "op": "clear_overrides", "sectionId": "<id>" }

12. save_memory — Save a note about user preferences for future context
    { "op": "save_memory", "hotelId": "<id>", "note": "<what you learned>" }

13. update_brand_voice — Update the hotel's brand voice description
    { "op": "update_brand_voice", "hotelId": "<id>", "brandVoice": "<description>" }
```

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 7: Update AI prompts with full context + approach selection

**Files:**
- Modify: `src/lib/llm/prompts.ts`

- [ ] **Step 1: Add AI memory fields to PromptContext**

Add to the `PromptContext` interface:

```typescript
// AI memory (from HotelContext)
brandVoiceMemory?: string;
styleNotesMemory?: string;
pastDecisionsMemory?: Array<{ prompt: string; reasoning: string; timestamp: string }>;
preferencesMemory?: Record<string, unknown>;
// Rendered HTML of current page
renderedPageHtml?: string;
// Custom overrides on sections
sectionOverrides?: Array<{ sectionId: string; hasCustomCss: boolean; hasCustomHtml: boolean; customMode: boolean }>;
```

- [ ] **Step 2: Update all three prompt builders**

In each of `buildTier1Prompt`, `buildTier2Prompt`, `buildTier3Prompt`, add these blocks after the website snapshot:

AI Memory section:
```
${ctx.brandVoiceMemory ? `\nBRAND VOICE: "${ctx.brandVoiceMemory}"` : ""}
${ctx.styleNotesMemory ? `\nSTYLE NOTES: "${ctx.styleNotesMemory}"` : ""}
${ctx.pastDecisionsMemory?.length ? `\nPAST DECISIONS (most recent 5):\n${ctx.pastDecisionsMemory.slice(-5).map(d => `  - "${d.prompt}" → ${d.reasoning}`).join("\n")}` : ""}
```

Rendered HTML section (truncated to avoid token overflow):
```
${ctx.renderedPageHtml ? `\nRENDERED HTML OF CURRENT PAGE (first 3000 chars):\n${ctx.renderedPageHtml.slice(0, 3000)}` : ""}
```

Section override indicators:
```
${ctx.sectionOverrides?.some(s => s.hasCustomCss || s.hasCustomHtml) ? `\nSECTIONS WITH CUSTOM OVERRIDES:\n${ctx.sectionOverrides.filter(s => s.hasCustomCss || s.hasCustomHtml).map(s => `  - ${s.sectionId}: ${s.customMode ? "CUSTOM HTML" : "CUSTOM CSS"}`).join("\n")}` : ""}
```

Add approach selection to the INSTRUCTIONS of each prompt:
```
APPROACH SELECTION (always use the lightest that works):
1. CMS operations (update_text, swap_component, etc.) — for structured changes
2. inject_css — for visual tweaks components can't express
3. replace_html — for completely custom designs
4. save_memory / update_brand_voice — always emit when you learn user preferences
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 8: Update LLM executor to load/save hotel context

**Files:**
- Modify: `src/lib/llm/index.ts`
- Create: `src/lib/snapshot.ts`

- [ ] **Step 1: Create snapshot utility**

Create `src/lib/snapshot.ts`:

```typescript
import { prisma } from "@/lib/db";
import { updateSnapshot } from "@/lib/hotel-context";

/**
 * Render a hotel page to HTML string by fetching from the preview route.
 * Uses internal fetch to the preview endpoint.
 */
export async function capturePageSnapshot(
  hotelId: string,
  pageSlug: string,
  baseUrl: string = "http://localhost:3000"
): Promise<string> {
  try {
    const resolvedSlug = pageSlug === "/" ? "home" : pageSlug;
    const res = await fetch(`${baseUrl}/preview/${hotelId}/${resolvedSlug}`, {
      cache: "no-store",
    });
    if (!res.ok) return "";
    const html = await res.text();
    await updateSnapshot(hotelId, pageSlug, html);
    return html;
  } catch {
    return "";
  }
}
```

- [ ] **Step 2: Update executeLLMTier to load hotel context**

In `src/lib/llm/index.ts`, in the `executeLLMTier` function:

After fetching the hotel, load the context:
```typescript
import { getHotelContext, appendDecision } from "@/lib/hotel-context";

const hotelContext = await getHotelContext(hotelId);
```

Add context fields to `promptCtx`:
```typescript
brandVoiceMemory: hotelContext.brandVoice || undefined,
styleNotesMemory: hotelContext.styleNotes || undefined,
pastDecisionsMemory: (hotelContext.pastDecisions as any[])?.slice(-5),
preferencesMemory: hotelContext.preferences as Record<string, unknown>,
renderedPageHtml: (hotelContext.renderedHtml as Record<string, string>)?.[currentPage?.slug || "/"],
sectionOverrides: pageSections.map(s => ({
  sectionId: s.id,
  hasCustomCss: !!(s as any).customCss,
  hasCustomHtml: !!(s as any).customHtml,
  customMode: !!(s as any).customMode,
})),
```

- [ ] **Step 3: Add post-execution context update**

After `executeOperations` and `createVersion`, add:

```typescript
// Update AI memory
await appendDecision(hotelId, {
  prompt: userRequest,
  approach: operations.map(o => o.op).join(", "),
  operations: operations.map(o => o.op),
  reasoning: parsed.reasoning as string || "",
});

// Capture page snapshot (async, don't block response)
if (currentPage) {
  capturePageSnapshot(hotelId, currentPage.slug).catch(() => {});
}
```

Import `capturePageSnapshot` from `@/lib/snapshot`.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 9: Smart merge conflict detection

**Files:**
- Create: `src/components/cms/ConflictModal.tsx`
- Modify: `src/app/api/sections/[id]/route.ts`
- Modify: `src/components/cms/SectionEditor.tsx`

- [ ] **Step 1: Create ConflictModal component**

Create `src/components/cms/ConflictModal.tsx` — "use client" modal:
- Props: `{ sectionId, overrideType: "enhanced" | "custom", onResolve: (action: "keep" | "discard" | "reapply") => void, onClose: () => void }`
- Renders a glass-card modal with 3 option buttons:
  - Keep: "Keep custom edits, apply change underneath" (amber button)
  - Discard: "Discard custom edits, use fresh component" (coral button)
  - Re-apply: "Apply change, then ask AI to re-style" (purple button)
- Each button calls `onResolve(action)` then `onClose()`

- [ ] **Step 2: Update sections API to detect conflicts**

In `src/app/api/sections/[id]/route.ts`, in the PUT handler:

After finding the existing section, check for overrides:
```typescript
const hasOverrides = existing.customCss || existing.customHtml;
```

If the request is changing `componentVariant` or `props` AND `hasOverrides`, check for a `conflictResolution` field in the request body:
- If not present: return `{ conflict: true, sectionId, overrideType: existing.customMode ? "custom" : "enhanced", options: [...] }` with status 409
- If `conflictResolution === "keep"`: proceed normally, don't touch overrides
- If `conflictResolution === "discard"`: clear `customCss`, `customHtml`, set `customMode=false` alongside the edit
- If `conflictResolution === "reapply"`: clear overrides, apply edit, return `{ reapplyIntent: true }` in response so frontend can trigger AI

- [ ] **Step 3: Update SectionEditor to handle conflict**

In `src/components/cms/SectionEditor.tsx`, when the save PUT returns a 409 conflict response:
- Parse the conflict data
- Show `<ConflictModal>` with the override type
- On resolve, re-send the PUT with `conflictResolution` field included
- If response has `reapplyIntent: true`, trigger the AI action bar with the last known intent from memory

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
