import { prisma } from "@/lib/db";
import { COMPONENT_REGISTRY } from "@/lib/component-registry";
import { appendDecision, updateBrandVoice as updateBrandVoiceContext } from "@/lib/hotel-context";

/**
 * CMS Operations — the complete set of mutations the AI can emit.
 * Each operation is deterministic and maps directly to a DB write.
 *
 * The LLM is instructed to output one or more of these operations.
 * The executor runs them in order, no guessing required.
 */

export interface UpdateTextOp {
  op: "update_text";
  sectionId: string;
  field: string;
  value: string;
  alternatives?: string[];
}

export interface UpdatePropsOp {
  op: "update_props";
  sectionId: string;
  props: Record<string, unknown>;
}

export interface SwapComponentOp {
  op: "swap_component";
  sectionId: string;
  newVariant: string;
  props: Record<string, unknown>;
}

export interface AddSectionOp {
  op: "add_section";
  pageId: string;
  variant: string;
  props: Record<string, unknown>;
  position?: number; // sort order, appends to end if omitted
}

export interface RemoveSectionOp {
  op: "remove_section";
  sectionId: string;
}

export interface UpdateThemeOp {
  op: "update_theme";
  hotelId: string;
  colorTokens?: Record<string, string>;
  typography?: Record<string, string>;
  spacing?: string;
  baseTemplate?: string;
}

export interface UpdateMetaOp {
  op: "update_meta";
  pageId: string;
  metaTags: Record<string, string>;
}

export interface ReorderSectionsOp {
  op: "reorder_sections";
  order: { sectionId: string; sortOrder: number }[];
}

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

export interface TranslateSiteOp {
  op: "translate_site";
  hotelId: string;
  targetLocale: string;
  targetLanguage: string;
}

export type CmsOperation =
  | UpdateTextOp
  | UpdatePropsOp
  | SwapComponentOp
  | AddSectionOp
  | RemoveSectionOp
  | UpdateThemeOp
  | UpdateMetaOp
  | ReorderSectionsOp
  | InjectCssOp
  | ReplaceHtmlOp
  | ClearOverridesOp
  | SaveMemoryOp
  | UpdateBrandVoiceOp
  | TranslateSiteOp;

export interface OperationResult {
  op: string;
  success: boolean;
  details: Record<string, unknown>;
}

/**
 * Trusted context — real IDs from the database, not from LLM output.
 * Used to override any IDs the LLM hallucinates.
 */
export interface TrustedContext {
  hotelId: string;
  pageId?: string;
  sectionIds: string[]; // valid section IDs for the current page
  lockedSectionIds: string[];
}

/**
 * Execute a list of CMS operations against the database.
 * Overrides LLM-provided IDs with trusted IDs to prevent FK violations.
 */
export async function executeOperations(
  operations: CmsOperation[],
  trusted: TrustedContext
): Promise<OperationResult[]> {
  const results: OperationResult[] = [];

  // Track newly created section IDs so subsequent operations can target them
  let lastCreatedSectionId: string | null = null;

  for (let operation of operations) {
    // For replace_html right after add_section: use the just-created section ID
    if (
      (operation.op === "replace_html" || operation.op === "inject_css") &&
      lastCreatedSectionId &&
      !trusted.sectionIds.includes((operation as { sectionId: string }).sectionId)
    ) {
      (operation as { sectionId: string }).sectionId = lastCreatedSectionId;
      lastCreatedSectionId = null; // consume it
    }

    // Override IDs with trusted values
    operation = sanitizeOperation(operation, trusted);

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

    try {
      const result = await executeSingle(operation);
      results.push(result);

      // If add_section succeeded, track the new ID for the next operation
      if (operation.op === "add_section" && result.success && result.details.sectionId) {
        lastCreatedSectionId = result.details.sectionId as string;
        trusted.sectionIds.push(lastCreatedSectionId);
      }
    } catch (err) {
      results.push({
        op: operation.op,
        success: false,
        details: {
          error: err instanceof Error ? err.message : "Unknown error",
        },
      });
    }
  }

  return results;
}

/**
 * Sanitize an operation by overriding LLM-provided IDs with trusted ones.
 * The LLM may hallucinate or mangle UUIDs — we always use real DB IDs.
 */
function sanitizeOperation(op: CmsOperation, trusted: TrustedContext): CmsOperation {
  switch (op.op) {
    case "update_text":
    case "update_props":
      // If sectionId is not in trusted list, use the first trusted section
      if (!trusted.sectionIds.includes(op.sectionId)) {
        op.sectionId = trusted.sectionIds[0] || op.sectionId;
      }
      return op;

    case "swap_component":
      if (!trusted.sectionIds.includes(op.sectionId)) {
        op.sectionId = trusted.sectionIds[0] || op.sectionId;
      }
      return op;

    case "remove_section":
      if (!trusted.sectionIds.includes(op.sectionId)) {
        op.sectionId = trusted.sectionIds[0] || op.sectionId;
      }
      return op;

    case "add_section":
      // Always use the trusted pageId
      op.pageId = trusted.pageId || op.pageId;
      return op;

    case "update_theme":
      // Always use the trusted hotelId
      op.hotelId = trusted.hotelId;
      return op;

    case "update_meta":
      op.pageId = trusted.pageId || op.pageId;
      return op;

    case "reorder_sections":
      // Filter to only include known section IDs
      op.order = op.order.filter((item) => trusted.sectionIds.includes(item.sectionId));
      return op;

    case "inject_css":
    case "replace_html":
    case "clear_overrides":
      if (!trusted.sectionIds.includes(op.sectionId)) {
        op.sectionId = trusted.sectionIds[0] || op.sectionId;
      }
      return op;

    case "save_memory":
    case "update_brand_voice":
      op.hotelId = trusted.hotelId;
      return op;

    case "translate_site":
      op.hotelId = trusted.hotelId;
      return op;

    default:
      return op;
  }
}

async function executeSingle(op: CmsOperation): Promise<OperationResult> {
  switch (op.op) {
    case "update_text":
      return executeUpdateText(op);
    case "update_props":
      return executeUpdateProps(op);
    case "swap_component":
      return executeSwapComponent(op);
    case "add_section":
      return executeAddSection(op);
    case "remove_section":
      return executeRemoveSection(op);
    case "update_theme":
      return executeUpdateTheme(op);
    case "update_meta":
      return executeUpdateMeta(op);
    case "reorder_sections":
      return executeReorderSections(op);
    case "inject_css":
      return executeInjectCss(op);
    case "replace_html":
      return executeReplaceHtml(op);
    case "clear_overrides":
      return executeClearOverrides(op);
    case "save_memory":
      return executeSaveMemory(op);
    case "update_brand_voice":
      return executeUpdateBrandVoice(op);
    case "translate_site":
      return executeTranslateSite(op);
    default:
      return {
        op: (op as CmsOperation).op,
        success: false,
        details: { error: `Unknown operation: ${(op as CmsOperation).op}` },
      };
  }
}

async function executeUpdateText(op: UpdateTextOp): Promise<OperationResult> {
  const section = await prisma.section.findUnique({
    where: { id: op.sectionId },
  });
  if (!section) throw new Error(`Section ${op.sectionId} not found`);

  const currentProps = (section.props as Record<string, unknown>) || {};
  const oldValue = currentProps[op.field];
  const updatedProps = { ...currentProps, [op.field]: op.value };

  await prisma.section.update({
    where: { id: op.sectionId },
    data: { props: updatedProps as any },
  });

  return {
    op: "update_text",
    success: true,
    details: {
      sectionId: op.sectionId,
      field: op.field,
      oldValue: oldValue ?? "(empty)",
      newValue: op.value,
      alternatives: op.alternatives,
    },
  };
}

async function executeUpdateProps(op: UpdatePropsOp): Promise<OperationResult> {
  const section = await prisma.section.findUnique({
    where: { id: op.sectionId },
  });
  if (!section) throw new Error(`Section ${op.sectionId} not found`);

  const currentProps = (section.props as Record<string, unknown>) || {};
  const updatedProps = { ...currentProps, ...op.props };

  await prisma.section.update({
    where: { id: op.sectionId },
    data: { props: updatedProps as any },
  });

  return {
    op: "update_props",
    success: true,
    details: {
      sectionId: op.sectionId,
      changedFields: Object.keys(op.props),
      oldProps: currentProps,
      newProps: updatedProps,
    },
  };
}

async function executeSwapComponent(op: SwapComponentOp): Promise<OperationResult> {
  const section = await prisma.section.findUnique({
    where: { id: op.sectionId },
  });
  if (!section) throw new Error(`Section ${op.sectionId} not found`);

  // Validate variant exists in registry
  const component = COMPONENT_REGISTRY.find((c) => c.variant === op.newVariant);
  if (!component) throw new Error(`Unknown variant: ${op.newVariant}`);

  const oldVariant = section.componentVariant;

  await prisma.section.update({
    where: { id: op.sectionId },
    data: {
      componentVariant: op.newVariant,
      props: op.props as any,
    },
  });

  return {
    op: "swap_component",
    success: true,
    details: {
      sectionId: op.sectionId,
      oldVariant,
      newVariant: op.newVariant,
      props: op.props,
    },
  };
}

async function executeAddSection(op: AddSectionOp): Promise<OperationResult> {
  const component = COMPONENT_REGISTRY.find((c) => c.variant === op.variant);
  if (!component) throw new Error(`Unknown variant: ${op.variant}`);

  // Get max sort order if position not specified
  let sortOrder = op.position ?? 0;
  if (op.position === undefined) {
    const last = await prisma.section.findFirst({
      where: { pageId: op.pageId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const section = await prisma.section.create({
    data: {
      pageId: op.pageId,
      componentVariant: op.variant,
      props: (op.props || component.defaultProps) as any,
      sortOrder,
      isVisible: true,
    },
  });

  return {
    op: "add_section",
    success: true,
    details: {
      sectionId: section.id,
      variant: op.variant,
      sortOrder,
    },
  };
}

async function executeRemoveSection(op: RemoveSectionOp): Promise<OperationResult> {
  const section = await prisma.section.findUnique({
    where: { id: op.sectionId },
    select: { componentVariant: true },
  });
  if (!section) throw new Error(`Section ${op.sectionId} not found`);

  await prisma.section.delete({ where: { id: op.sectionId } });

  return {
    op: "remove_section",
    success: true,
    details: {
      sectionId: op.sectionId,
      removedVariant: section.componentVariant,
    },
  };
}

async function executeUpdateTheme(op: UpdateThemeOp): Promise<OperationResult> {
  const existing = await prisma.theme.findUnique({
    where: { hotelId: op.hotelId },
  });

  const data: Record<string, unknown> = {};
  if (op.colorTokens) data.colorTokens = op.colorTokens;
  if (op.typography) data.typography = op.typography;
  if (op.spacing) data.spacing = op.spacing;
  if (op.baseTemplate) data.baseTemplate = op.baseTemplate;

  if (existing) {
    await prisma.theme.update({
      where: { hotelId: op.hotelId },
      data: data as any,
    });
  } else {
    await prisma.theme.create({
      data: {
        hotelId: op.hotelId,
        colorTokens: (op.colorTokens || {}) as any,
        typography: (op.typography || {}) as any,
        spacing: (op.spacing || "balanced") as any,
        baseTemplate: op.baseTemplate || "boutique",
      },
    });
  }

  return {
    op: "update_theme",
    success: true,
    details: { hotelId: op.hotelId, fieldsUpdated: Object.keys(data) },
  };
}

async function executeUpdateMeta(op: UpdateMetaOp): Promise<OperationResult> {
  const page = await prisma.page.findUnique({ where: { id: op.pageId } });
  if (!page) throw new Error(`Page ${op.pageId} not found`);

  const currentMeta = (page.metaTags as Record<string, unknown>) || {};
  const updatedMeta = { ...currentMeta, ...op.metaTags };

  await prisma.page.update({
    where: { id: op.pageId },
    data: { metaTags: updatedMeta as any },
  });

  return {
    op: "update_meta",
    success: true,
    details: { pageId: op.pageId, oldMeta: currentMeta, newMeta: updatedMeta },
  };
}

async function executeReorderSections(op: ReorderSectionsOp): Promise<OperationResult> {
  for (const item of op.order) {
    await prisma.section.update({
      where: { id: item.sectionId },
      data: { sortOrder: item.sortOrder },
    });
  }

  return {
    op: "reorder_sections",
    success: true,
    details: { reordered: op.order.length },
  };
}

async function executeInjectCss(op: InjectCssOp): Promise<OperationResult> {
  const section = await prisma.section.findUnique({
    where: { id: op.sectionId },
  });
  if (!section) throw new Error(`Section ${op.sectionId} not found`);

  await prisma.section.update({
    where: { id: op.sectionId },
    data: {
      customCss: op.css,
      customMode: false,
    } as any,
  });

  return {
    op: "inject_css",
    success: true,
    details: {
      sectionId: op.sectionId,
      css: op.css,
    },
  };
}

async function executeReplaceHtml(op: ReplaceHtmlOp): Promise<OperationResult> {
  const section = await prisma.section.findUnique({
    where: { id: op.sectionId },
  });
  if (!section) throw new Error(`Section ${op.sectionId} not found`);

  const oldVariant = section.componentVariant;

  await prisma.section.update({
    where: { id: op.sectionId },
    data: {
      customHtml: op.html,
      customMode: true,
    } as any,
  });

  return {
    op: "replace_html",
    success: true,
    details: {
      sectionId: op.sectionId,
      oldVariant,
    },
  };
}

async function executeClearOverrides(op: ClearOverridesOp): Promise<OperationResult> {
  const section = await prisma.section.findUnique({
    where: { id: op.sectionId },
    select: { customCss: true, customHtml: true, customMode: true } as any,
  });
  if (!section) throw new Error(`Section ${op.sectionId} not found`);

  const { customCss, customHtml, customMode } = section as any;

  await prisma.section.update({
    where: { id: op.sectionId },
    data: {
      customCss: null,
      customHtml: null,
      customMode: false,
    } as any,
  });

  return {
    op: "clear_overrides",
    success: true,
    details: {
      sectionId: op.sectionId,
      clearedCss: customCss ?? null,
      clearedHtml: customHtml ?? null,
      wasCustomMode: customMode ?? false,
    },
  };
}

async function executeSaveMemory(op: SaveMemoryOp): Promise<OperationResult> {
  await appendDecision(op.hotelId, {
    prompt: op.note,
    approach: "memory",
    operations: ["save_memory"],
    reasoning: op.note,
  });

  return {
    op: "save_memory",
    success: true,
    details: {
      hotelId: op.hotelId,
      note: op.note,
    },
  };
}

async function executeUpdateBrandVoice(op: UpdateBrandVoiceOp): Promise<OperationResult> {
  await updateBrandVoiceContext(op.hotelId, op.brandVoice);

  return {
    op: "update_brand_voice",
    success: true,
    details: {
      hotelId: op.hotelId,
      brandVoice: op.brandVoice,
    },
  };
}

async function executeTranslateSite(op: TranslateSiteOp): Promise<OperationResult> {
  const { translateHotelSite } = await import("@/lib/i18n/translate");
  const result = await translateHotelSite(op.hotelId, op.targetLocale, op.targetLanguage);
  return {
    op: "translate_site",
    success: true,
    details: { ...result, locale: op.targetLocale, language: op.targetLanguage },
  };
}

/**
 * Build the operations schema documentation for inclusion in LLM prompts.
 * This tells the LLM exactly what operations it can emit.
 */
export function getOperationsSchema(): string {
  return `You MUST respond with a JSON object containing an "operations" array.
Each operation is an object with an "op" field and operation-specific fields.

AVAILABLE OPERATIONS:

1. update_text — Change a text field in a section
   { "op": "update_text", "sectionId": "<id>", "field": "<prop_name>", "value": "<new_text>", "alternatives": ["alt1", "alt2"] }

2. update_props — Update multiple props on a section
   { "op": "update_props", "sectionId": "<id>", "props": { "key": "value", ... } }

3. swap_component — Replace a section's component variant
   { "op": "swap_component", "sectionId": "<id>", "newVariant": "<variant_name>", "props": { ... } }

4. add_section — Add a new section to the page
   { "op": "add_section", "pageId": "<id>", "variant": "<variant_name>", "props": { ... } }

5. remove_section — Remove a section
   { "op": "remove_section", "sectionId": "<id>" }

6. update_theme — Modify hotel theme
   { "op": "update_theme", "hotelId": "<id>", "colorTokens": { "primary": "#hex", ... }, "typography": { ... }, "spacing": "compact|balanced|spacious", "baseTemplate": "luxury|boutique|business|resort" }

7. update_meta — Update page SEO meta tags
   { "op": "update_meta", "pageId": "<id>", "metaTags": { "title": "...", "description": "..." } }

8. reorder_sections — Change section order
   { "op": "reorder_sections", "order": [{ "sectionId": "<id>", "sortOrder": 0 }, ...] }

9. replace_html — Replace a section's rendered output with fully custom HTML
   { "op": "replace_html", "sectionId": "<id>", "html": "<complete standalone HTML for this section with inline styles>" }
   IMPORTANT: The HTML must be COMPLETE and SELF-CONTAINED with all styles inline.
   Include the full section structure (wrapper, content, text, buttons, etc.).
   Use inline style="" attributes for ALL styling — do NOT use Tailwind or CSS classes.
   Keep the existing content (headline, subtext, CTA) but apply the visual changes.

10. inject_css — Add simple CSS tweaks (font-size, text color, padding only)
    { "op": "inject_css", "sectionId": "<id>", "css": "font-size: 20px; padding: 40px;" }
    WARNING: Only use for TEXT styling (font, padding, margin). NEVER use for background, colors on complex components, or layout changes — these WILL NOT WORK because components use inline styles. Use replace_html instead.

11. clear_overrides — Remove custom CSS/HTML, revert to component rendering
    { "op": "clear_overrides", "sectionId": "<id>" }

12. save_memory — Save a note about user preferences for future AI context
    { "op": "save_memory", "hotelId": "<id>", "note": "<what you learned about user preferences>" }

13. update_brand_voice — Update the hotel's brand voice description
    { "op": "update_brand_voice", "hotelId": "<id>", "brandVoice": "<brand voice description>" }

14. translate_site — Translate entire hotel website to another language
    { "op": "translate_site", "hotelId": "<id>", "targetLocale": "<2-letter code>", "targetLanguage": "<language name>" }

CRITICAL APPROACH RULES:
- For ANY visual/style change (background, colors, layout, spacing, gradients, images): ALWAYS use replace_html
- For text-only changes (headline, subtext, CTA text): use update_text
- For text styling only (font-size, letter-spacing): inject_css is OK
- For component swap (different layout): use swap_component
- For theme-wide color changes: use update_theme
- ALWAYS emit save_memory when you learn about user preferences

When using replace_html, you MUST:
1. Look at the CURRENT PAGE HTML provided in context
2. Find the section being modified
3. Copy its HTML structure
4. Modify only what the user asked for
5. Keep ALL existing content (text, links, images)
6. Use ONLY inline styles (style="...") — no CSS classes

RESPONSE FORMAT (always wrap operations in this structure):
{
  "operations": [ { "op": "...", ... }, ... ],
  "reasoning": "Brief explanation of what you changed and why"
}`;
}
