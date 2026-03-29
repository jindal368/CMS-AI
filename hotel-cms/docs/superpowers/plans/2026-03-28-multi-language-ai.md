# Multi-Language AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable AI-powered translation of entire hotel websites with per-locale page duplication and URL-based locale routing.

**Architecture:** New `enabledLocales` field on Hotel tracks supported languages. Translation utility clones pages/sections per locale and batch-translates text props via LLM. New preview route serves locale-specific pages. CMS gets locale switcher and "Add Language" modal.

**Tech Stack:** Prisma (schema), OpenRouter LLM (translation), Next.js dynamic routes, React client components for locale UI.

---

### Task 1: Prisma schema — add enabledLocales to Hotel

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add enabledLocales field**

Read `prisma/schema.prisma`. Add to Hotel model after `links`:

```prisma
  enabledLocales Json @default("[\"en\"]") @map("enabled_locales")
```

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-enabled-locales`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Language detection + translation utility

**Files:**
- Create: `src/lib/i18n/languages.ts`
- Create: `src/lib/i18n/translate.ts`

- [ ] **Step 1: Create languages map**

Create `src/lib/i18n/languages.ts`. Export:

```typescript
export const LANGUAGES: Record<string, string> = {
  "french": "fr", "français": "fr",
  "spanish": "es", "español": "es",
  "german": "de", "deutsch": "de",
  "hindi": "hi",
  "japanese": "ja",
  "chinese": "zh",
  "arabic": "ar",
  "portuguese": "pt",
  "italian": "it",
  "russian": "ru",
  "dutch": "nl",
  "korean": "ko",
  "thai": "th",
  "turkish": "tr",
  "tamil": "ta",
  "telugu": "te",
  "bengali": "bn",
  "marathi": "mr",
};

export const LOCALE_NAMES: Record<string, string> = {
  "en": "English", "fr": "French", "es": "Spanish", "de": "German",
  "hi": "Hindi", "ja": "Japanese", "zh": "Chinese", "ar": "Arabic",
  "pt": "Portuguese", "it": "Italian", "ru": "Russian", "nl": "Dutch",
  "ko": "Korean", "th": "Thai", "tr": "Turkish", "ta": "Tamil",
  "te": "Telugu", "bn": "Bengali", "mr": "Marathi",
};

export function detectLanguageFromPrompt(prompt: string): { locale: string; language: string } | null
```

`detectLanguageFromPrompt`: lowercase the prompt, check if any key from LANGUAGES appears in it. If found, return `{ locale: LANGUAGES[key], language: LOCALE_NAMES[LANGUAGES[key]] }`. Return null if no match.

- [ ] **Step 2: Create translation utility**

Create `src/lib/i18n/translate.ts`. Import prisma from `@/lib/db`. Export:

```typescript
export async function translateHotelSite(
  hotelId: string,
  targetLocale: string,
  targetLanguage: string
): Promise<{ pagesTranslated: number; sectionsTranslated: number }>
```

Logic:
1. Fetch hotel with defaultLocale
2. Fetch all pages where `hotelId` and `locale = hotel.defaultLocale`, include sections ordered by sortOrder
3. For each page:
   a. Upsert a page with same `hotelId + slug + locale: targetLocale` (use prisma upsert on the unique constraint `[hotelId, slug, locale]`)
   b. Delete existing sections on the translated page (to refresh)
   c. For each section in the original page: extract text props (walk props object, collect string values that are > 3 chars and not URLs/tokens). Build a `textsToTranslate` map: `{ "sectionIndex_propKey": "English text" }`
   d. Call LLM once per page via the existing `callOpenRouter` pattern (import from `@/lib/llm/index.ts` or duplicate the fetch logic). Prompt: `"Translate these hotel website texts to ${targetLanguage}. Return JSON with same keys. Keep brand names, URLs, and {{tokens}} unchanged.\n\n${JSON.stringify(textsToTranslate)}"`
   e. Parse LLM response as JSON
   f. Create cloned sections on the translated page with translated props
4. Update hotel's enabledLocales: fetch current array, add targetLocale if not present, update
5. Return counts

For the LLM call, reuse the OpenRouter fetch pattern from `src/lib/llm/index.ts` (same URL, API key, headers). Use model `nvidia/nemotron-3-super-120b-a12b:free`. Max tokens 4096.

Helper: `isTranslatableText(value: string): boolean` — returns true if string length > 3, doesn't start with `http`, `{{`, `tel:`, `mailto:`, `#`, `/`. These are text that should be translated, not URLs/tokens.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: New translate_site operation + classifier rule

**Files:**
- Modify: `src/lib/llm/operations.ts`
- Modify: `src/lib/router/classifier.ts`

- [ ] **Step 1: Add TranslateSiteOp to operations**

In `src/lib/llm/operations.ts`, add the interface:

```typescript
export interface TranslateSiteOp {
  op: "translate_site";
  hotelId: string;
  targetLocale: string;
  targetLanguage: string;
}
```

Add to `CmsOperation` union. Add executor:

```typescript
async function executeTranslateSite(op: TranslateSiteOp): Promise<OperationResult> {
  const { translateHotelSite } = await import("@/lib/i18n/translate");
  const result = await translateHotelSite(op.hotelId, op.targetLocale, op.targetLanguage);
  return {
    op: "translate_site",
    success: true,
    details: { ...result, locale: op.targetLocale, language: op.targetLanguage },
  };
}
```

Wire into `executeSingle` switch. In `sanitizeOperation`, override hotelId with `trusted.hotelId`.

Add to `getOperationsSchema()`:
```
14. translate_site — Translate the entire hotel website to another language
    { "op": "translate_site", "hotelId": "<id>", "targetLocale": "<locale code>", "targetLanguage": "<language name>" }
```

- [ ] **Step 2: Add translation classifier rule**

In `src/lib/router/classifier.ts`, add to TIER_1_PATTERNS:

```typescript
{ pattern: /\b(translate|translation)\b.*\b(to|into|in)\b/i, action: "translate" },
```

This ensures "translate the site to French" classifies as Tier 1.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: Locale-aware preview route + language switcher

**Files:**
- Create: `src/app/preview/[hotelId]/[locale]/[pageSlug]/page.tsx`
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx`

- [ ] **Step 1: Create locale-aware preview route**

Create `src/app/preview/[hotelId]/[locale]/[pageSlug]/page.tsx`. This is largely a copy of the existing preview page but with locale in the params.

Server component. `export const dynamic = "force-dynamic"`. Params: `Promise<{ hotelId: string; locale: string; pageSlug: string }>`.

Same logic as existing preview: fetch hotel, resolve slug ("home" → "/"), fetch page by `hotelId + slug + locale`. If locale page not found, try `hotel.defaultLocale` as fallback. Fetch rooms, media. Enrich props, resolve smart links, render with PageRenderer.

Add structured data injection (same as existing). Include the locale in the page title metadata.

- [ ] **Step 2: Add language switcher to preview pages**

In both preview routes (existing and new locale one), add a floating language switcher widget after the preview banner.

Query distinct locales for this hotel: `prisma.page.findMany({ where: { hotelId }, select: { locale: true }, distinct: ["locale"] })`.

Render a small floating pill bar (fixed top-right, below preview banner):
```tsx
<div className="fixed top-10 right-4 z-40 flex gap-1 bg-white/90 backdrop-blur rounded-full px-2 py-1 shadow-lg border">
  {locales.map(l => (
    <a key={l} href={`/preview/${hotelId}/${l}/${currentSlug}`}
       className={`px-2 py-0.5 rounded-full text-xs font-medium ${l === currentLocale ? 'bg-[#e85d45] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
      {l.toUpperCase()}
    </a>
  ))}
</div>
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 5: Translation API routes

**Files:**
- Create: `src/app/api/i18n/translate/[hotelId]/route.ts`
- Create: `src/app/api/i18n/[hotelId]/[locale]/route.ts`

- [ ] **Step 1: Create translate route**

`POST /api/i18n/translate/[hotelId]` — accepts `{ targetLocale, targetLanguage }`. Auth: requireHotelAccess + role >= editor. Calls `translateHotelSite()`. Returns `{ pagesTranslated, sectionsTranslated, locale, language }`.

Set `export const maxDuration = 180` (translations can take time with free model).

- [ ] **Step 2: Create delete locale route**

`DELETE /api/i18n/[hotelId]/[locale]` — Auth: requireHotelAccess + admin role. Prevents deleting the defaultLocale. Deletes all pages where `hotelId + locale` (cascades to sections). Removes locale from hotel's enabledLocales array. Returns `{ deleted: true, locale }`.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 6: CMS locale management UI

**Files:**
- Create: `src/components/cms/LocaleSwitcher.tsx`
- Create: `src/components/cms/AddLanguageModal.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx`
- Modify: `src/components/cms/PageBuilder.tsx`

- [ ] **Step 1: Create LocaleSwitcher component**

`src/components/cms/LocaleSwitcher.tsx` — "use client". Props: `{ hotelId: string, enabledLocales: string[], currentLocale: string, onLocaleChange: (locale: string) => void }`.

Renders horizontal pills: `EN | FR | HI`. Active locale highlighted with coral background. Clicking fires `onLocaleChange(locale)`. Import `LOCALE_NAMES` from `@/lib/i18n/languages` for tooltip/label.

- [ ] **Step 2: Create AddLanguageModal**

`src/components/cms/AddLanguageModal.tsx` — "use client" modal. Props: `{ hotelId: string, enabledLocales: string[], onClose, onAdded }`.

Shows a list of available languages (from LOCALE_NAMES, excluding already-enabled ones). Each is a button. Clicking one triggers POST to `/api/i18n/translate/[hotelId]` with the selected locale. Shows progress: "Translating to French..." with spinner. On success: shows "Done! X pages translated." then calls onAdded + onClose.

- [ ] **Step 3: Add locale UI to hotel detail page**

Read `src/app/(dashboard)/hotels/[id]/page.tsx`. In the header area (near hotel name), add:
- `<LocaleSwitcher>` showing enabled locales (from `hotel.enabledLocales`)
- "Add Language" button that opens `<AddLanguageModal>`
- When locale is switched, filter the pages list to show only pages matching that locale

The page needs a client wrapper for locale state. Create an inline client component or wrap the pages section.

Serialize `hotel.enabledLocales` for client components.

- [ ] **Step 4: Add locale badge to PageBuilder**

Read `src/components/cms/PageBuilder.tsx`. In the toolbar, after the page info, show a locale badge: small pill showing the current page's locale (e.g., "FR" in purple). Non-interactive — just visual indicator of which locale is being edited.

The page's locale comes from the page data already passed to PageBuilder.

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
