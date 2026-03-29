# Multi-Language AI — Design Spec

**Goal:** Enable AI-powered translation of entire hotel websites with per-locale page storage and URL-based locale routing.

**Decisions:**
- Duplicate pages per locale (clone + AI translate) — uses existing schema's locale field
- URL-based locale routing: `/preview/[hotelId]/[locale]/[pageSlug]`
- One LLM call per page (batch all text props for efficiency)

---

## 1. Translation Flow

### New AI operation: `translate_site`

When user prompts "translate the site to French" or "add Hindi version":

1. Classifier detects translation intent (new rule: matches "translate" + language name)
2. Determines target locale code (French → "fr", Hindi → "hi", Spanish → "es", etc.)
3. For each page in the hotel where `locale = hotel.defaultLocale`:
   - Upsert a Page record with same slug + target locale
   - For each section in the original page:
     - Clone section to the new locale page (copy componentVariant, sortOrder, isVisible, customCss, customHtml, customMode)
     - Extract all text-type string props (headline, subtext, cta, description, copyrightText, etc.)
     - Skip non-text props (numbers, booleans, arrays, URLs)
   - Batch all text props from all sections into one LLM call: "Translate these key-value pairs to {language}: { section1_headline: '...', section1_subtext: '...', section2_headline: '...' }"
   - LLM returns translated values → update each cloned section's props
4. Add locale to hotel's `enabledLocales` array
5. Save memory: "Translated site to French"

### New operation type

```typescript
interface TranslateSiteOp {
  op: "translate_site";
  hotelId: string;
  targetLocale: string;  // "fr", "hi", "es", etc.
  targetLanguage: string; // "French", "Hindi", "Spanish"
}
```

### Translation utility

**File:** `src/lib/i18n/translate.ts`

```typescript
async function translateHotelSite(hotelId: string, targetLocale: string, targetLanguage: string): Promise<{ pagesTranslated: number; sectionsTranslated: number }>
```

- Fetches all pages + sections for the hotel's default locale
- For each page: upserts locale page, clones sections, batches text for LLM
- Single LLM call per page with prompt: "Translate these hotel website texts to {language}. Return JSON with same keys. Keep brand names unchanged."
- Returns count of pages and sections translated

### Language detection from prompt

**File:** `src/lib/i18n/languages.ts`

Map of common languages to locale codes:
```typescript
const LANGUAGES: Record<string, string> = {
  "french": "fr", "français": "fr",
  "spanish": "es", "español": "es",
  "german": "de", "deutsch": "de",
  "hindi": "hi", "हिंदी": "hi",
  "japanese": "ja", "日本語": "ja",
  "chinese": "zh", "中文": "zh",
  "arabic": "ar", "العربية": "ar",
  "portuguese": "pt",
  "italian": "it",
  "russian": "ru", "русский": "ru",
  "dutch": "nl",
  "korean": "ko",
  "thai": "th",
  "turkish": "tr",
};

function detectLanguageFromPrompt(prompt: string): { locale: string; language: string } | null
```

### Files
- Create: `src/lib/i18n/translate.ts`
- Create: `src/lib/i18n/languages.ts`
- Modify: `src/lib/llm/operations.ts` — add TranslateSiteOp + executor
- Modify: `src/lib/router/classifier.ts` — add translation rule

---

## 2. Schema Changes

### Hotel model — new field

```prisma
  enabledLocales Json @default("[\"en\"]") @map("enabled_locales")
```

Array of locale codes this hotel supports. Auto-updated when translations are created/deleted.

### Files
- Modify: `prisma/schema.prisma` — add enabledLocales to Hotel
- Run migration

---

## 3. Locale-Aware Preview Route

### New route: `/preview/[hotelId]/[locale]/[pageSlug]`

**File:** `src/app/preview/[hotelId]/[locale]/[pageSlug]/page.tsx`

Same logic as existing preview route but fetches page by `hotelId + slug + locale`. If locale page doesn't exist, falls back to hotel's `defaultLocale`.

### Existing route unchanged

`/preview/[hotelId]/[pageSlug]` continues to serve defaultLocale pages. No breaking change.

### Language switcher widget

Injected into every preview page — a small floating pill in the top-right showing available locales (e.g., "EN | FR | HI"). Each links to `/preview/[hotelId]/[locale]/[currentSlug]`.

Built by querying distinct locales from the hotel's pages.

### Sitemap update

`/sitemap/[hotelId]/sitemap.xml` updated to include URLs for all locale versions:
```xml
<url>
  <loc>/preview/{hotelId}/fr/home</loc>
  <xhtml:link rel="alternate" hreflang="fr" href="..." />
  <xhtml:link rel="alternate" hreflang="en" href="..." />
</url>
```

### Files
- Create: `src/app/preview/[hotelId]/[locale]/[pageSlug]/page.tsx`
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx` — add language switcher widget
- Modify: `src/app/sitemap/[hotelId]/sitemap.xml/route.ts` — include locale URLs

---

## 4. CMS Locale Management

### Hotel detail page — locale switcher

Locale pills in the hotel header: `EN | FR | HI`. Clicking filters pages list to that locale. Active locale is highlighted.

### "Add Language" button

Opens a modal with a searchable list of common languages. Selecting one triggers the `translate_site` operation. Shows progress: "Translating to French... Page 1/4... Done!"

### "Remove Language" action

Per locale (except defaultLocale): "Remove French" → confirms → deletes all pages + sections with that locale → removes from `enabledLocales`.

### Page builder locale indicator

Shows current locale badge (e.g., "FR") next to the page name in the toolbar. Editors can switch locale via dropdown.

### Files
- Create: `src/components/cms/LocaleSwitcher.tsx` — pills component used in hotel detail + page builder
- Create: `src/components/cms/AddLanguageModal.tsx` — language picker + translation trigger
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx` — add locale switcher + filtered page list
- Modify: `src/components/cms/PageBuilder.tsx` — add locale badge

---

## 5. Translation API

### New route: `POST /api/i18n/translate/[hotelId]`

Accepts: `{ targetLocale: "fr", targetLanguage: "French" }`

Auth: requireHotelAccess + editor role.

Calls `translateHotelSite()`. Returns `{ pagesTranslated, sectionsTranslated, locale }`.

### New route: `DELETE /api/i18n/[hotelId]/[locale]`

Auth: requireHotelAccess + admin role.

Deletes all pages + sections for that locale. Removes from enabledLocales.

### Files
- Create: `src/app/api/i18n/translate/[hotelId]/route.ts`
- Create: `src/app/api/i18n/[hotelId]/[locale]/route.ts`

---

## Out of Scope
- RTL layout support (Arabic, Hebrew) — future CSS enhancement
- Translation memory / glossary (reuse previous translations)
- Machine translation without AI (Google Translate API)
- Per-section translation (only full-site translation for now)
- Content sync (updating original doesn't auto-update translations)
