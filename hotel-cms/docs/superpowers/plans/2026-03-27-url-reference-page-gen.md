# URL Reference + Full Page Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable AI to generate complete hotel website pages from a reference URL or from scratch, using component skeleton + custom HTML overrides.

**Architecture:** New scraper utility fetches reference URLs. Execute route detects URLs in prompts and passes scraped data to LLM context. Prompts get two new conditional blocks: reference website context and page generation mode (triggers on empty pages). Token limits increased for generation.

**Tech Stack:** Built-in fetch() for scraping, regex for HTML parsing, existing LLM operations system.

---

### Task 1: Create URL scraper utility

**Files:**
- Create: `src/lib/scraper.ts`

- [ ] **Step 1: Create scraper module**

Create `src/lib/scraper.ts` with:

```typescript
export interface SiteReference {
  url: string;
  title: string;
  description: string;
  headings: string[];
  bodyExcerpt: string;
  success: boolean;
}
```

`scrapeReference(rawUrl: string): Promise<SiteReference>` function that:
- Normalizes URL: if no `http` prefix, prepend `https://`
- Fetches with `AbortController` 5-second timeout
- Headers: `User-Agent: "Mozilla/5.0 (compatible; HotelCMS/1.0)"`
- On success: extract `<title>` via regex `/<title[^>]*>([^<]+)<\/title>/i`
- Extract meta description via `/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i`
- Extract h1-h3 headings via `/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi`, take first 10
- Strip all HTML tags from body for excerpt: `html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000)`
- On any error (catch block): return `{ url, title: "", description: "", headings: [], bodyExcerpt: "", success: false }`

Also export a URL detection helper:
```typescript
export function extractUrlFromText(text: string): string | null {
  const match = text.match(/(?:https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-z]{2,}(?:\/[^\s]*)?)/i);
  return match ? match[0] : null;
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Wire URL detection into execute route

**Files:**
- Modify: `src/app/api/ai/execute/route.ts`

- [ ] **Step 1: Add URL detection and scraping to execute route**

Read the file first. At the top, add import:
```typescript
import { extractUrlFromText, scrapeReference } from "@/lib/scraper";
```

After building the `context` object (after the hotel location context block), add:
```typescript
// Detect reference URL in the user's prompt
const detectedUrl = extractUrlFromText(action);
if (detectedUrl) {
  const siteRef = await scrapeReference(detectedUrl);
  context.siteReference = siteRef;
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: Update prompts with reference website and page generation blocks

**Files:**
- Modify: `src/lib/llm/prompts.ts`
- Modify: `src/lib/llm/index.ts`

- [ ] **Step 1: Add new fields to PromptContext**

In `src/lib/llm/prompts.ts`, add to the `PromptContext` interface:
```typescript
siteReference?: {
  url: string;
  title: string;
  description: string;
  headings: string[];
  bodyExcerpt: string;
  success: boolean;
};
isEmptyPage?: boolean;
```

- [ ] **Step 2: Create prompt block builder functions**

Add two helper functions in `prompts.ts` (before the tier builders):

```typescript
function buildReferenceBlock(ref: PromptContext["siteReference"]): string {
  if (!ref) return "";
  if (ref.success) {
    return `\nREFERENCE WEBSITE: ${ref.url}
  Title: "${ref.title}"
  Description: "${ref.description}"
  Sections found: ${ref.headings.slice(0, 8).join(", ") || "none detected"}
  Content: "${ref.bodyExcerpt.slice(0, 800)}"
Match this site's visual style, section layout, and content tone.\n`;
  }
  return `\nREFERENCE: User mentioned ${ref.url} — use your knowledge of this hotel/brand to guide the design.\n`;
}

function buildPageGenBlock(ctx: PromptContext): string {
  if (!ctx.isEmptyPage) return "";
  return `\nPAGE GENERATION MODE — this page is EMPTY. Build it from scratch.
Emit add_section for each section, then replace_html on each with complete custom inline-styled HTML.

Create these sections in order:
1. add_section variant=hero_cinematic → then replace_html with hero design
2. add_section variant=rooms_grid → then replace_html with rooms showcase
3. add_section variant=gallery_masonry → then replace_html with photo gallery
4. add_section variant=reviews_wall → then replace_html with testimonials
5. add_section variant=booking_sticky → then replace_html with booking CTA
6. add_section variant=footer_rich → then replace_html with footer

Use hotel name "${ctx.hotelName}" and category "${ctx.hotelCategory}" for content.
${ctx.siteReference ? "Match the reference website's style." : "Design for a premium " + ctx.hotelCategory + " hotel."}
Generate realistic content. All HTML must use inline style="" attributes only.\n`;
}
```

- [ ] **Step 3: Inject blocks into all three prompt builders**

In `buildTier1Prompt`, `buildTier2Prompt`, and `buildTier3Prompt`, add after the `websiteSnapshot` line:
```typescript
${buildReferenceBlock(ctx.siteReference)}
${buildPageGenBlock(ctx)}
```

- [ ] **Step 4: Pass siteReference and isEmptyPage from LLM index**

In `src/lib/llm/index.ts`, in the `executeLLMTier` function where `promptCtx` is built, add:
```typescript
siteReference: context?.siteReference as PromptContext["siteReference"],
isEmptyPage: pageSections.length === 0,
```

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: Token limit adjustment for page generation

**Files:**
- Modify: `src/lib/llm/index.ts`

- [ ] **Step 1: Increase max_tokens when page is empty**

In `src/lib/llm/index.ts`, find the `maxTokens` line:
```typescript
const maxTokens = tier === 3 ? 8192 : tier === 2 ? 6144 : 4096;
```

Replace with:
```typescript
// Page generation needs more tokens for multiple add_section + replace_html operations
const isPageGen = pageSections.length === 0;
const maxTokens = isPageGen ? 8192 : (tier === 3 ? 8192 : tier === 2 ? 6144 : 4096);
```

- [ ] **Step 2: Verify build and test end-to-end**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

Then test with curl:
```bash
curl -s --max-time 180 -X POST http://localhost:3000/api/ai/execute \
  -H "Content-Type: application/json" \
  -d '{"hotelId":"<id>","action":"take reference from hablis.com and create homepage","pageId":"<empty-page-id>"}' | head -c 500
```

Expected: Multiple operations (add_section + replace_html pairs) in the response.

---
