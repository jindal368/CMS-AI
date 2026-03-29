import { NextRequest } from "next/server";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { classifyAction } from "@/lib/router";
import { extractUrlFromText, scrapeReference } from "@/lib/scraper";
import { requireAuth } from "@/lib/auth";

// Allow up to 3 minutes for LLM responses (free models can be slow)
export const maxDuration = 180;
import { executeTier0 } from "@/lib/router/tier0-handler";
import { executeLLMTier } from "@/lib/llm/index";

const ExecuteSchema = z.object({
  hotelId: z.string().uuid(),
  action: z.string().min(1),
  pageId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
});

/**
 * Execute an AI action:
 * 1. Classify the action → determine tier
 * 2. Build context from current page/section state
 * 3. Call LLM → get structured operations
 * 4. Execute operations against DB
 * 5. Return operation results with diffs
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { data, error } = await parseBody(request, ExecuteSchema);
    if (error) return error;

    const { hotelId, action, pageId, sectionId } = data;

    // Step 1: Classify
    const classification = await classifyAction(action);

    // Step 2: Build context
    const context: Record<string, unknown> = {};
    if (pageId) {
      const page = await prisma.page.findUnique({
        where: { id: pageId },
        select: { slug: true, pageType: true },
      });
      if (page) {
        context.pageId = pageId;
        context.pageSlug = page.slug;
        context.pageType = page.pageType;
      }
    }
    if (sectionId) {
      context.sectionId = sectionId;
    }

    // Hotel location context
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { contactInfo: true },
    });
    if (hotel) {
      const ci = hotel.contactInfo as Record<string, unknown> | null;
      if (ci?.city) context.location = `${ci.city}, ${ci.country || ""}`;
    }

    // Detect reference URL in the user's prompt
    const detectedUrl = extractUrlFromText(action);
    if (detectedUrl) {
      const siteRef = await scrapeReference(detectedUrl);
      context.siteReference = siteRef;
    }

    // Step 3 & 4: Execute
    if (classification.tier === 0) {
      await executeTier0(hotelId, classification.action, context);
      return successResponse({
        classification,
        operationResults: [{ op: classification.action, success: true, details: { applied: true } }],
        reasoning: `Direct DB operation: ${classification.action}`,
      });
    }

    // LLM tiers: call LLM → parse operations → execute against DB
    const llmResult = (await executeLLMTier(
      hotelId,
      classification.tier as 1 | 2 | 3,
      classification.action,
      action,
      context
    )) as { operationResults: unknown[]; reasoning?: string; operations: { op: string }[]; model: string };

    return successResponse({
      classification,
      operationResults: llmResult.operationResults,
      reasoning: llmResult.reasoning,
      operations: llmResult.operations.map((op: { op: string }) => op.op),
      model: llmResult.model,
    });
  } catch (err) {
    console.error("[AI Execute]", err);
    const message = err instanceof Error ? err.message : "Execution failed";
    return errorResponse(message, 500);
  }
}
