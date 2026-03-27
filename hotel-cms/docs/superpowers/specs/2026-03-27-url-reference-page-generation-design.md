# URL Reference + Full Page Generation — Design Spec

**Goal:** Enable AI to generate complete hotel website pages from scratch, optionally using a reference URL (like hablis.com) for style/structure inspiration.

**Decisions:**
- Hybrid fetch: Try lightweight scrape of reference URL, fall back to LLM knowledge
- Mix generation: Create component skeleton via add_section, then customize each with replace_html
- Page generation mode triggers when page has 0 sections

---

## 1. URL Scraper Utility

**File:** `src/lib/scraper.ts`

Lightweight URL fetcher — no headless browser, no new dependencies.

```typescript
interface SiteReference {
  url: string;
  title: string;           // from <title> tag
  description: string;     // from <meta name="description">
  headings: string[];      // h1-h3 text content
  bodyExcerpt: string;     // first 2000 chars of visible text (tags stripped)
  success: boolean;        // true if fetch worked
}

async function scrapeReference(url: string): Promise<SiteReference>
```

**Behavior:**
- Normalizes URL: if no protocol, prepend `https://`
- Fetches with 5-second timeout, browser-like User-Agent header
- On success: regex-parses `<title>`, `<meta description>`, `<h1>`-`<h3>` tags, strips HTML from body for excerpt
- On failure (timeout, 403, network error): returns `{ url, title: "", description: "", headings: [], bodyExcerpt: "", success: false }`
- No external dependencies — uses built-in `fetch()` and regex for HTML parsing

---

## 2. URL Detection in Execute Route

**File:** `src/app/api/ai/execute/route.ts` (modify)

Before calling `executeLLMTier`, detect URLs in the user's action text:

```typescript
// Regex: matches http(s) URLs and bare domains (xxx.com)
const urlRegex = /(?:https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi;
const urls = action.match(urlRegex);

let siteReference: SiteReference | undefined;
if (urls && urls.length > 0) {
  siteReference = await scrapeReference(urls[0]);
}

// Pass to context
context.siteReference = siteReference;
```

---

## 3. Prompt Context Extension

**File:** `src/lib/llm/prompts.ts` (modify PromptContext interface)

Add to PromptContext:
```typescript
siteReference?: {
  url: string;
  title: string;
  description: string;
  headings: string[];
  bodyExcerpt: string;
  success: boolean;
};
isEmptyPage?: boolean;  // true when pageSections.length === 0
```

**File:** `src/lib/llm/index.ts` (modify)

Set `isEmptyPage` and pass `siteReference` to prompt context.

---

## 4. Prompt Additions

**In all three prompt builders**, add two conditional blocks:

### Reference website block (when siteReference exists):
```
REFERENCE WEBSITE: {url}
  Title: "{title}"
  Description: "{description}"
  Section headings found: {headings.join(", ")}
  Content excerpt: "{bodyExcerpt.slice(0, 1000)}"
(If success=false): The user referenced {url} — use your knowledge of this hotel/brand to guide the design.

Match the reference site's visual style, section structure, and content tone.
```

### Page generation mode block (when isEmptyPage=true):
```
PAGE GENERATION MODE: This page is EMPTY. You must build it from scratch.
Emit add_section operations to create the page structure, then replace_html on each for custom design.

Required sections (in order):
1. Hero (hero_cinematic or hero_editorial) — full-width hero with headline
2. Rooms (rooms_grid or rooms_showcase) — showcase accommodations
3. About/Features (hero_editorial or hero_minimal) — hotel story or key features
4. Gallery (gallery_masonry or gallery_filmstrip) — photo gallery
5. Reviews (reviews_wall) — guest testimonials
6. Booking (booking_inline or booking_sticky) — call to action
7. Footer (footer_rich) — contact info and links

For EACH section:
  Step 1: emit add_section with variant name and pageId
  Step 2: emit replace_html with complete custom HTML (inline styles, self-contained)

Use the hotel's real name, location, and contact info from context above.
Generate realistic content appropriate for the hotel category.
If a reference website is provided, match its structure and style.
```

### Token limit adjustment:
When `isEmptyPage=true`, force max_tokens to 8192 regardless of tier (page generation needs space for multiple replace_html operations).

---

## 5. Related Cases Handled

This design covers:
- "take reference from hablis.com and create homepage" — URL scraped + page generation mode
- "make it look like marriott.com" — URL scraped, existing sections modified via replace_html
- "create a luxury hotel homepage" — no URL, page generation mode uses LLM knowledge + hotel category
- "build a landing page for my resort" — page generation mode, no reference URL
- Empty page + no reference = LLM generates based on hotel data and category alone

---

## Out of Scope
- Screenshot/visual capture of reference websites (would need Puppeteer)
- Copying images from reference sites
- Multi-page generation in one prompt (only current page)
- Saving reference URL for future prompts (could be added via save_memory)
