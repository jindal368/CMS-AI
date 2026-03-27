import { getOperationsSchema } from "./operations";

/**
 * Prompt templates for each LLM tier.
 * All prompts instruct the LLM to output structured CMS operations
 * so the executor knows exactly what DB writes to make.
 */

export interface PromptContext {
  hotelName: string;
  hotelCategory: string;
  hotelId: string;
  brandVoice?: string;
  userRequest: string;
  // Target section context
  sectionId?: string;
  currentVariant?: string;
  currentProps?: Record<string, unknown>;
  componentType?: string;
  // Page context
  pageId?: string;
  pageSlug?: string;
  pageSections?: Array<{
    id: string;
    variant: string;
    props: Record<string, unknown>;
    sortOrder: number;
    customCss?: string | null;
    customHtml?: string | null;
    customMode?: boolean;
  }>;
  // Theme
  theme?: Record<string, unknown>;
  // Available components
  availableVariants?: string[];
  // Full website snapshot (readable text)
  websiteSnapshot?: string;
  // Hotel meta
  location?: string;
  audience?: string;
  competitors?: string[];
  differentiator?: string;
  // AI memory (from HotelContext)
  brandVoiceMemory?: string;
  styleNotesMemory?: string;
  pastDecisionsMemory?: Array<{ prompt: string; reasoning: string; timestamp: string }>;
  preferencesMemory?: Record<string, unknown>;
  // Rendered HTML of current page
  renderedPageHtml?: string;
  // Custom overrides on sections
  sectionOverrides?: Array<{ sectionId: string; hasCustomCss: boolean; hasCustomHtml: boolean; customMode: boolean }>;
  siteReference?: {
    url: string;
    title: string;
    description: string;
    headings: string[];
    bodyExcerpt: string;
    success: boolean;
  };
  isEmptyPage?: boolean;
}

const OPERATIONS_SCHEMA = getOperationsSchema();

function buildReferenceBlock(ref: PromptContext["siteReference"], isEmptyPage?: boolean): string {
  if (!ref) return "";
  if (ref.success) {
    // For page generation, keep it short to save tokens
    if (isEmptyPage) {
      return `\nREFERENCE: ${ref.url} — "${ref.title}". Sections: ${ref.headings.slice(0, 5).join(", ") || "unknown"}.\n`;
    }
    return `\nREFERENCE WEBSITE: ${ref.url}
  Title: "${ref.title}"
  Description: "${ref.description}"
  Sections: ${ref.headings.slice(0, 8).join(", ") || "none detected"}
  Content: "${ref.bodyExcerpt.slice(0, 500)}"
Match this site's style and tone.\n`;
  }
  return `\nREFERENCE: ${ref.url} — use your knowledge of this brand.\n`;
}

function buildPageGenBlock(ctx: PromptContext): string {
  if (!ctx.isEmptyPage) return "";
  return `\nPAGE IS EMPTY — create sections using add_section with good props.
Use pageId="${ctx.pageId}". Create these:

1. add_section variant=hero_cinematic props={headline:"...", subtext:"...", cta:"Book Now", ctaLink:"#booking"}
2. add_section variant=rooms_grid props={columns:3, showPrice:true, showAmenities:true, cta:"View Room"}
3. add_section variant=reviews_wall props={maxReviews:6, showRating:true, layout:"grid"}
4. add_section variant=footer_rich props={showNewsletter:true, showSocial:true, columns:4, copyrightText:"© 2026 ${ctx.hotelName}"}

Write compelling headline and subtext for "${ctx.hotelName}" (${ctx.hotelCategory}).
${ctx.siteReference ? `Inspired by: ${ctx.siteReference.url}` : ""}
Also emit save_memory with the brand style.
Do NOT use replace_html — just add_section with props.\n`;
}

// ─── Tier 1: Fast text/copy operations ───────────────────

export function buildTier1Prompt(ctx: PromptContext): string {
  const sectionCtx = ctx.sectionId
    ? `TARGET SECTION:
  sectionId: "${ctx.sectionId}"
  variant: ${ctx.currentVariant}
  current props: ${JSON.stringify(ctx.currentProps || {})}`
    : `PAGE SECTIONS (pick the most relevant one to modify):
${(ctx.pageSections || [])
  .map(
    (s) =>
      `  - sectionId: "${s.id}" | variant: ${s.variant} | props: ${JSON.stringify(s.props)}`
  )
  .join("\n")}`;

  return `SYSTEM: You are a hotel website copywriter. You modify website content by emitting CMS operations.
Output ONLY valid JSON. No markdown, no code fences, no explanation outside the JSON.

${OPERATIONS_SCHEMA}

${ctx.websiteSnapshot || ""}
${buildReferenceBlock(ctx.siteReference, ctx.isEmptyPage)}
${buildPageGenBlock(ctx)}
${ctx.brandVoiceMemory ? `\nBRAND VOICE: "${ctx.brandVoiceMemory}"` : ""}
${ctx.styleNotesMemory ? `\nSTYLE NOTES: "${ctx.styleNotesMemory}"` : ""}
${(ctx.pastDecisionsMemory && ctx.pastDecisionsMemory.length > 0) ? `\nPAST: ${ctx.pastDecisionsMemory.slice(-3).map(d => `"${d.prompt.slice(0, 40)}"`).join(", ")}` : ""}
${ctx.renderedPageHtml ? `\nPAGE HTML (excerpt):\n${ctx.renderedPageHtml.slice(0, 800)}` : ""}
${(ctx.sectionOverrides && ctx.sectionOverrides.some(s => s.hasCustomCss || s.hasCustomHtml)) ? `\nSECTIONS WITH CUSTOM OVERRIDES:\n${ctx.sectionOverrides.filter(s => s.hasCustomCss || s.hasCustomHtml).map(s => `  - ${s.sectionId}: ${s.customMode ? "CUSTOM HTML (component bypassed)" : "CUSTOM CSS (layered on component)"}`).join("\n")}` : ""}

USER REQUEST: "${ctx.userRequest}"

INSTRUCTIONS:
- You have FULL context of the website above. Use it to understand what content exists.
- Use "update_text" for text-only changes (headline, subtext, CTA label)
- Use "replace_html" for ANY visual/style change (background color, layout, gradients, spacing, images, fonts). This is CRITICAL — inject_css does NOT work reliably for visual changes because components use inline styles.
- When using replace_html: write COMPLETE self-contained HTML with ALL styles as inline style="" attributes. NO CSS classes. Keep existing text content.
- Use "update_meta" for SEO changes
- Use "save_memory" whenever you learn about user preferences
- Always include 2 alternatives when updating text
- Use the exact sectionId and pageId values from the website state above
- If the user mentions a style preference, emit save_memory alongside other operations`;
}

// ─── Tier 2: Layout/component operations ─────────────────

export function buildTier2Prompt(ctx: PromptContext): string {
  const variantList =
    ctx.availableVariants?.join(", ") || "hero_cinematic, hero_editorial, hero_minimal, rooms_grid, rooms_showcase, gallery_masonry, gallery_filmstrip, booking_inline, booking_sticky, reviews_wall, map_immersive, footer_rich";

  const sectionCtx = ctx.sectionId
    ? `TARGET SECTION:
  sectionId: "${ctx.sectionId}"
  variant: ${ctx.currentVariant}
  current props: ${JSON.stringify(ctx.currentProps || {})}`
    : `PAGE SECTIONS:
${(ctx.pageSections || [])
  .map(
    (s) =>
      `  - sectionId: "${s.id}" | variant: ${s.variant} | sortOrder: ${s.sortOrder}`
  )
  .join("\n")}`;

  return `SYSTEM: You are a hotel website designer. You modify website layouts by emitting CMS operations.
Output ONLY valid JSON. No markdown, no code fences, no explanation outside the JSON.

${OPERATIONS_SCHEMA}

${ctx.websiteSnapshot || ""}
${buildReferenceBlock(ctx.siteReference, ctx.isEmptyPage)}
${buildPageGenBlock(ctx)}
${ctx.brandVoiceMemory ? `\nBRAND VOICE: "${ctx.brandVoiceMemory}"` : ""}
${ctx.styleNotesMemory ? `\nSTYLE NOTES: "${ctx.styleNotesMemory}"` : ""}
${(ctx.pastDecisionsMemory && ctx.pastDecisionsMemory.length > 0) ? `\nPAST: ${ctx.pastDecisionsMemory.slice(-3).map(d => `"${d.prompt.slice(0, 40)}"`).join(", ")}` : ""}
${ctx.renderedPageHtml ? `\nPAGE HTML (excerpt):\n${ctx.renderedPageHtml.slice(0, 800)}` : ""}
${(ctx.sectionOverrides && ctx.sectionOverrides.some(s => s.hasCustomCss || s.hasCustomHtml)) ? `\nSECTIONS WITH CUSTOM OVERRIDES:\n${ctx.sectionOverrides.filter(s => s.hasCustomCss || s.hasCustomHtml).map(s => `  - ${s.sectionId}: ${s.customMode ? "CUSTOM HTML (component bypassed)" : "CUSTOM CSS (layered on component)"}`).join("\n")}` : ""}

AVAILABLE COMPONENT VARIANTS: [${variantList}]

USER REQUEST: "${ctx.userRequest}"

INSTRUCTIONS:
- You have FULL context of the website above.
- For ANY visual/style change (background, colors, gradients, layout, spacing): ALWAYS use "replace_html" with complete inline-styled HTML
- For structural changes (add/remove/reorder sections, swap component type): use CMS operations
- For text-only changes: use "update_text"
- When using replace_html: write COMPLETE self-contained HTML with ALL styles as inline style="" attributes. NO CSS classes. Keep existing text content.
- You can emit multiple operations in one response
- Use the exact sectionId and pageId values from the website state above
- ALWAYS emit save_memory when you learn user preferences`;
}

// ─── Tier 3: Full design brief ───────────────────────────

export function buildTier3Prompt(ctx: PromptContext): string {
  return `SYSTEM: You are a senior hotel web designer creating comprehensive design changes.
Output ONLY valid JSON. No markdown, no code fences, no explanation outside the JSON.

${OPERATIONS_SCHEMA}

${ctx.websiteSnapshot || ""}
${buildReferenceBlock(ctx.siteReference, ctx.isEmptyPage)}
${buildPageGenBlock(ctx)}
${ctx.brandVoiceMemory ? `\nBRAND VOICE: "${ctx.brandVoiceMemory}"` : ""}
${ctx.styleNotesMemory ? `\nSTYLE NOTES: "${ctx.styleNotesMemory}"` : ""}
${(ctx.pastDecisionsMemory && ctx.pastDecisionsMemory.length > 0) ? `\nPAST: ${ctx.pastDecisionsMemory.slice(-3).map(d => `"${d.prompt.slice(0, 40)}"`).join(", ")}` : ""}
${ctx.renderedPageHtml ? `\nPAGE HTML (excerpt):\n${ctx.renderedPageHtml.slice(0, 800)}` : ""}
${(ctx.sectionOverrides && ctx.sectionOverrides.some(s => s.hasCustomCss || s.hasCustomHtml)) ? `\nSECTIONS WITH CUSTOM OVERRIDES:\n${ctx.sectionOverrides.filter(s => s.hasCustomCss || s.hasCustomHtml).map(s => `  - ${s.sectionId}: ${s.customMode ? "CUSTOM HTML (component bypassed)" : "CUSTOM CSS (layered on component)"}`).join("\n")}` : ""}

AVAILABLE COMPONENT VARIANTS:
  hero: hero_cinematic, hero_editorial, hero_minimal
  rooms: rooms_grid, rooms_showcase
  gallery: gallery_masonry, gallery_filmstrip
  booking: booking_inline, booking_sticky
  reviews: reviews_wall
  map: map_immersive
  footer: footer_rich

USER REQUEST: "${ctx.userRequest}"

INSTRUCTIONS:
- You have FULL context of the website above — hotel, theme, rooms, media, all pages, all sections.
- For ANY visual/style change per section: use "replace_html" with complete inline-styled HTML
- For theme-wide color/font changes: use "update_theme"
- For structural changes (add/remove sections): use CMS operations
- For text changes: use "update_text"
- When using replace_html: write COMPLETE self-contained HTML with ALL styles as inline style="" attributes. NO CSS classes.
- Emit multiple operations for full redesigns (e.g. replace_html for each section + update_theme)
- Use the exact sectionId, pageId, hotelId values from website state above
- ALWAYS emit save_memory when you learn user preferences`;
}
