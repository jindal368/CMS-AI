import { Tier } from "../router/classifier";
import {
  buildTier1Prompt,
  buildTier2Prompt,
  buildTier3Prompt,
  PromptContext,
} from "./prompts";
import { prisma } from "@/lib/db";
import { createVersion } from "@/lib/versioning";
import { getComponentsByType } from "@/lib/component-registry";
import { CmsOperation, executeOperations, OperationResult, TrustedContext } from "./operations";
import { getHotelContext, appendDecision } from "@/lib/hotel-context";
import { capturePageSnapshot } from "@/lib/snapshot";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

async function callOpenRouter(
  prompt: string,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Get a key at https://openrouter.ai/keys"
    );
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "hotelCMS",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  return content;
}

/**
 * Extract JSON from LLM response (handles markdown wrapping).
 */
function extractJson(raw: string): Record<string, unknown> {
  let jsonStr = raw;

  // Try markdown code fence
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  } else {
    // Try raw JSON object
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonStr = braceMatch[0];
    }
  }

  return JSON.parse(jsonStr);
}

export interface LLMExecutionResult {
  tier: number;
  model: string;
  action: string;
  operations: CmsOperation[];
  operationResults: OperationResult[];
  reasoning?: string;
  rawResponse: Record<string, unknown>;
}

/**
 * Execute an LLM tier operation:
 * 1. Build prompt with real IDs and context
 * 2. Call LLM via OpenRouter
 * 3. Parse operations from response
 * 4. Execute operations against DB
 * 5. Create version snapshot
 */
export async function executeLLMTier(
  hotelId: string,
  tier: Tier,
  action: string,
  userRequest: string,
  context?: Record<string, unknown>
): Promise<LLMExecutionResult> {
  if (tier === 0) {
    throw new Error("Tier 0 should not go through LLM gateway");
  }

  // ── Fetch full website context ──────────────────────────
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      theme: true,
      rooms: { orderBy: { sortOrder: "asc" } },
      media: { take: 20, orderBy: { createdAt: "desc" } },
      pages: {
        orderBy: { sortOrder: "asc" },
        include: { sections: { orderBy: { sortOrder: "asc" } } },
      },
      org: true,
    },
  });
  if (!hotel) throw new Error(`Hotel ${hotelId} not found`);

  // Load AI memory context
  const hotelContext = await getHotelContext(hotelId);

  // Current page sections
  const pageId = context?.pageId as string | undefined;
  const currentPage = pageId
    ? hotel.pages.find((p) => p.id === pageId)
    : hotel.pages[0];

  const pageSections: PromptContext["pageSections"] = (currentPage?.sections || []).map((s) => ({
    id: s.id,
    variant: s.componentVariant,
    props: (s.props as Record<string, unknown>) || {},
    sortOrder: s.sortOrder,
    customCss: (s as any).customCss as string | null,
    customHtml: (s as any).customHtml as string | null,
    customMode: (s as any).customMode as boolean,
  }));

  // Auto-target section
  const sectionId = context?.sectionId as string | undefined;
  let targetSection: { id: string; variant: string; props: Record<string, unknown> } | undefined;
  if (sectionId) {
    const sec = pageSections.find((s) => s.id === sectionId);
    if (sec) targetSection = { id: sec.id, variant: sec.variant, props: sec.props };
  } else if (pageSections.length > 0) {
    if (action === "rewrite_text" || action === "suggest_text" || action === "translate") {
      const hero = pageSections.find((s) => s.props.headline);
      if (hero) targetSection = { id: hero.id, variant: hero.variant, props: hero.props };
    }
  }

  // Build full website snapshot for context
  const websiteSnapshot = buildWebsiteSnapshot(hotel, currentPage, pageSections);

  // Build prompt context with real IDs + full snapshot
  const contactInfo = hotel.contactInfo as Record<string, unknown> | null;
  const promptCtx: PromptContext = {
    hotelName: hotel.name,
    hotelCategory: hotel.category,
    hotelId: hotel.id,
    brandVoice: (context?.brandVoice as string) || undefined,
    userRequest,
    sectionId: targetSection?.id,
    currentVariant: targetSection?.variant,
    currentProps: targetSection?.props,
    componentType: context?.componentType as string,
    pageId: currentPage?.id,
    pageSlug: currentPage?.slug || context?.pageSlug as string,
    pageSections,
    theme: hotel.theme
      ? {
          colors: hotel.theme.colorTokens,
          typography: hotel.theme.typography,
          spacing: hotel.theme.spacing,
        }
      : undefined,
    location: contactInfo?.city
      ? `${contactInfo.city}, ${contactInfo.country || ""}`
      : context?.location as string,
    audience: context?.audience as string,
    competitors: context?.competitors as string[],
    differentiator: context?.differentiator as string,
    websiteSnapshot,
    brandVoiceMemory: hotelContext.brandVoice || undefined,
    styleNotesMemory: hotelContext.styleNotes || undefined,
    pastDecisionsMemory: Array.isArray(hotelContext.pastDecisions)
      ? (hotelContext.pastDecisions as Array<{ prompt: string; reasoning: string; timestamp: string }>).slice(-5)
      : [],
    preferencesMemory: (hotelContext.preferences as Record<string, unknown>) || undefined,
    renderedPageHtml: currentPage
      ? ((hotelContext.renderedHtml as Record<string, string>)?.[currentPage.slug] || undefined)
      : undefined,
    sectionOverrides: pageSections.map(s => ({
      sectionId: s.id,
      hasCustomCss: !!s.customCss,
      hasCustomHtml: !!s.customHtml,
      customMode: !!s.customMode,
    })),
    siteReference: (context?.siteReference as PromptContext["siteReference"]) || undefined,
    isEmptyPage: pageSections.length === 0,
  };

  // Add available variants for tier 2
  if (tier === 2 && context?.componentType) {
    const variants = getComponentsByType(context.componentType as string);
    promptCtx.availableVariants = variants.map((v) => v.variant);
  }

  // Build prompt
  let prompt: string;
  switch (tier) {
    case 1: prompt = buildTier1Prompt(promptCtx); break;
    case 2: prompt = buildTier2Prompt(promptCtx); break;
    case 3: prompt = buildTier3Prompt(promptCtx); break;
    default: throw new Error(`Invalid tier: ${tier}`);
  }

  // Call LLM
  // Higher token limits needed for replace_html which outputs full HTML
  const maxTokens = tier === 3 ? 8192 : tier === 2 ? 6144 : 4096;
  const rawResponse = await callOpenRouter(prompt, maxTokens);

  // Parse response
  let parsed: Record<string, unknown>;
  try {
    parsed = extractJson(rawResponse);
  } catch {
    throw new Error(`LLM returned invalid JSON: ${rawResponse.slice(0, 300)}`);
  }

  // Extract operations array
  let operations: CmsOperation[] = [];
  if (Array.isArray(parsed.operations)) {
    operations = parsed.operations as CmsOperation[];
  } else {
    // Fallback: try to interpret old-style response as operations
    operations = convertLegacyResponse(parsed, targetSection?.id, pageId, hotelId);
  }

  // Build trusted context — real IDs that override anything the LLM hallucinated
  const trustedCtx: TrustedContext = {
    hotelId,
    pageId: currentPage?.id,
    sectionIds: pageSections.map((s) => s.id),
    lockedSectionIds: ((hotel as any).org?.lockedSections || []).map((s: any) => s.id) as string[],
  };

  // Execute all operations with trusted IDs
  const operationResults = await executeOperations(operations, trustedCtx);

  // Create version snapshot
  const beforeState = { pageSections, targetSection };
  await createVersion({
    hotelId,
    before: beforeState as unknown as Record<string, unknown>,
    after: parsed,
    modelTier: tier,
    modelUsed: "nemotron-120b-free",
    description: `AI: ${action} — "${userRequest.slice(0, 80)}"`,
  });

  // Update AI memory with this decision
  await appendDecision(hotelId, {
    prompt: userRequest,
    approach: operations.map(o => o.op).join(", "),
    operations: operations.map(o => o.op),
    reasoning: (parsed.reasoning as string) || "",
  });

  // Capture page snapshot asynchronously (don't block response)
  if (currentPage) {
    capturePageSnapshot(hotelId, currentPage.slug).catch(() => {});
  }

  return {
    tier,
    model: "nemotron-120b-free",
    action,
    operations,
    operationResults,
    reasoning: parsed.reasoning as string | undefined,
    rawResponse: parsed,
  };
}

/**
 * Convert old-style LLM responses (path/value, sectionUpdate) to operations.
 * Fallback for when the LLM doesn't follow the operations schema.
 */
function convertLegacyResponse(
  parsed: Record<string, unknown>,
  sectionId?: string,
  pageId?: string,
  hotelId?: string
): CmsOperation[] {
  const ops: CmsOperation[] = [];

  // path + value → update_text
  if (parsed.path && parsed.value && sectionId) {
    const pathParts = (parsed.path as string).split(".");
    const field = pathParts[pathParts.length - 1];
    ops.push({
      op: "update_text",
      sectionId,
      field,
      value: parsed.value as string,
      alternatives: parsed.alternatives as string[] | undefined,
    });
  }

  // sectionUpdate → swap_component
  if (parsed.sectionUpdate && sectionId) {
    const update = parsed.sectionUpdate as { componentVariant: string; props: Record<string, unknown> };
    ops.push({
      op: "swap_component",
      sectionId,
      newVariant: update.componentVariant,
      props: update.props || {},
    });
  }

  // template + theme → update_theme
  if (parsed.template && parsed.theme && hotelId) {
    const theme = parsed.theme as Record<string, unknown>;
    ops.push({
      op: "update_theme",
      hotelId,
      colorTokens: theme.colors as Record<string, string>,
      typography: theme.typography as Record<string, string>,
      spacing: theme.spacing as string,
      baseTemplate: parsed.template as string,
    });
  }

  return ops;
}

/**
 * Build a compact website snapshot for LLM context.
 * Kept short to fit within free model context limits.
 */
function buildWebsiteSnapshot(
  hotel: Record<string, unknown> & {
    name: string;
    category: string;
    contactInfo: unknown;
    theme: Record<string, unknown> | null;
    rooms: Array<Record<string, unknown>>;
    media: Array<Record<string, unknown>>;
    pages: Array<Record<string, unknown> & {
      slug: string;
      pageType: string;
      sections: Array<Record<string, unknown>>;
    }>;
  },
  currentPage: Record<string, unknown> & { slug: string; pageType: string; sections: Array<Record<string, unknown>> } | undefined,
  _pageSections: PromptContext["pageSections"]
): string {
  const lines: string[] = [];
  const contact = hotel.contactInfo as Record<string, unknown> | null;

  lines.push(`HOTEL: ${hotel.name} (${hotel.category})`);
  if (contact) {
    lines.push(`Location: ${contact.city || "?"}, ${contact.country || "?"}`);
  }

  if (hotel.theme) {
    const colors = hotel.theme.colorTokens as Record<string, string> | null;
    if (colors) lines.push(`Theme: primary=${colors.primary} accent=${colors.accent} bg=${colors.bg}`);
  }

  // Current page sections — compact format, skip customHtml content
  if (currentPage) {
    lines.push(`\nPAGE: /${currentPage.slug} (${currentPage.pageType})`);
    for (const section of currentPage.sections) {
      const props = section.props as Record<string, unknown> | null;
      const hasCustom = section.customMode ? " [CUSTOM HTML]" : section.customCss ? " [CSS]" : "";
      lines.push(`  Section [${section.id}] ${section.componentVariant}${hasCustom}`);
      // Only show key text props, not the full object
      if (props) {
        const textProps = ["headline", "subtext", "cta", "ctaLink", "columns", "showPrice"];
        for (const key of textProps) {
          if (props[key] !== undefined) {
            const val = String(props[key]);
            lines.push(`    ${key}: "${val.length > 60 ? val.slice(0, 60) + "..." : val}"`);
          }
        }
      }
    }
  }

  return lines.join("\n");
}
