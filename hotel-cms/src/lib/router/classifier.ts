/**
 * Intent Classifier — routes CMS actions to the correct tier.
 *
 * Tier 0: Direct DB writes (~70% of ops) — $0
 * Tier 1: Fast LLM / Haiku (~20% of ops) — ~$0.001
 * Tier 2: Mid LLM / Sonnet (~8% of ops) — ~$0.02
 * Tier 3: Frontier / Opus (~2% of ops) — ~$0.50
 */

export type Tier = 0 | 1 | 2 | 3;

export interface ClassificationResult {
  tier: Tier;
  action: string;
  confidence: number;
  reasoning: string;
}

// ─── Tier 0 patterns (rule-based, no LLM needed) ────────

const TIER_0_PATTERNS: { pattern: RegExp; action: string }[] = [
  { pattern: /\b(update|change|set|edit)\b.*\b(phone|email|address|contact)\b/i, action: "update_contact" },
  { pattern: /\b(update|change|set|edit)\b.*\b(price|pricing|rate|cost)\b/i, action: "update_pricing" },
  { pattern: /\b(toggle|show|hide|enable|disable)\b.*\b(section|visibility|visible)\b/i, action: "toggle_visibility" },
  { pattern: /\b(reorder|move|sort|rearrange)\b.*\b(image|photo|gallery|section)\b/i, action: "reorder" },
  { pattern: /\b(update|change|set)\b.*\b(name|title)\b.*\b(hotel|property)\b/i, action: "update_hotel_name" },
  { pattern: /\b(add|create|new)\b.*\b(room|page)\b/i, action: "create_entity" },
  { pattern: /\b(delete|remove)\b.*\b(room|page|section|image)\b/i, action: "delete_entity" },
  { pattern: /\b(upload|add)\b.*\b(image|photo|media)\b/i, action: "upload_media" },
];

// ─── Tier 1 patterns (fast LLM) ─────────────────────────

const TIER_1_PATTERNS: { pattern: RegExp; action: string }[] = [
  { pattern: /\b(rewrite|rephrase|improve|make.*better)\b.*\b(headline|title|heading|text|copy)\b/i, action: "rewrite_text" },
  { pattern: /\b(translate|translation)\b.*\b(to|into|in)\b/i, action: "translate" },
  { pattern: /\b(generate|create|write)\b.*\b(meta|seo|tag|description)\b/i, action: "generate_meta" },
  { pattern: /\b(draft|write|respond)\b.*\b(review|response|reply)\b/i, action: "draft_review_response" },
  { pattern: /\b(suggest|recommend)\b.*\b(headline|title|tagline)\b/i, action: "suggest_text" },
  { pattern: /\b(make.*more|make.*less)\b.*\b(inviting|formal|casual|professional|friendly|elegant)\b/i, action: "rewrite_text" },
];

// ─── Tier 2 patterns (mid LLM) ──────────────────────────

const TIER_2_PATTERNS: { pattern: RegExp; action: string }[] = [
  { pattern: /\b(swap|change|switch)\b.*\b(component|variant|layout|hero|gallery)\b/i, action: "swap_component" },
  { pattern: /\b(redesign|restyle|redo)\b.*\b(section|layout|gallery|hero)\b/i, action: "redesign_section" },
  { pattern: /\b(more visual|more modern|more elegant|add photo|add image)\b.*\b(hero|header|section)\b/i, action: "redesign_section" },
  { pattern: /\b(figma|design|mockup)\b.*\b(import|convert|apply)\b/i, action: "figma_to_config" },
];

// ─── Tier 3 patterns (frontier LLM) ─────────────────────

const TIER_3_PATTERNS: { pattern: RegExp; action: string }[] = [
  { pattern: /\b(full|complete|entire)\b.*\b(design|redesign|website|site)\b/i, action: "full_design_brief" },
  { pattern: /\b(brand|branding|identity)\b.*\b(system|create|design|develop)\b/i, action: "brand_identity" },
  { pattern: /\b(generate|create|build)\b.*\b(all pages|multiple pages|whole site|entire site)\b/i, action: "multi_page_generation" },
  { pattern: /\b(conversion|funnel|optimize|optimization)\b.*\b(design|layout|strategy)\b/i, action: "conversion_funnel" },
];

/**
 * Classify a user action into the appropriate tier using rule-based matching.
 * Returns null if no rule matches (needs LLM fallback).
 */
export function classifyByRules(
  action: string
): ClassificationResult | null {
  // Check Tier 0 first (most common)
  for (const { pattern, action: actionType } of TIER_0_PATTERNS) {
    if (pattern.test(action)) {
      return {
        tier: 0,
        action: actionType,
        confidence: 0.95,
        reasoning: `Rule match: "${actionType}" — direct database operation`,
      };
    }
  }

  // Check Tier 1
  for (const { pattern, action: actionType } of TIER_1_PATTERNS) {
    if (pattern.test(action)) {
      return {
        tier: 1,
        action: actionType,
        confidence: 0.9,
        reasoning: `Rule match: "${actionType}" — fast LLM (Haiku)`,
      };
    }
  }

  // Check Tier 2
  for (const { pattern, action: actionType } of TIER_2_PATTERNS) {
    if (pattern.test(action)) {
      return {
        tier: 2,
        action: actionType,
        confidence: 0.85,
        reasoning: `Rule match: "${actionType}" — mid LLM (Sonnet)`,
      };
    }
  }

  // Check Tier 3
  for (const { pattern, action: actionType } of TIER_3_PATTERNS) {
    if (pattern.test(action)) {
      return {
        tier: 3,
        action: actionType,
        confidence: 0.85,
        reasoning: `Rule match: "${actionType}" — frontier LLM (Opus)`,
      };
    }
  }

  return null; // No rule match — needs LLM fallback
}

/**
 * Classify an action using rules first, then LLM fallback.
 */
export async function classifyAction(
  action: string,
  _context?: Record<string, unknown>
): Promise<ClassificationResult> {
  // Try rule-based classification first
  const ruleResult = classifyByRules(action);
  if (ruleResult) {
    return ruleResult;
  }

  // Fallback: default to Tier 1 for ambiguous text operations
  // In production, this would call Haiku for classification
  return {
    tier: 1,
    action: "unknown",
    confidence: 0.5,
    reasoning:
      "No rule match — defaulting to Tier 1 (Haiku) for LLM classification fallback",
  };
}
