import { NextRequest } from "next/server";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { z } from "zod";
import { classifyAction } from "@/lib/router";
import { requireAuth } from "@/lib/auth";

const ClassifyOnlySchema = z.object({
  hotelId: z.string().uuid(),
  action: z.string().min(1),
});

/**
 * Classify-only endpoint — returns the tier and cost estimate
 * WITHOUT executing the LLM call.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { data, error } = await parseBody(request, ClassifyOnlySchema);
    if (error) return error;

    const classification = await classifyAction(data.action);

    const costEstimates: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
    };

    const modelNames: Record<number, string> = {
      0: "none (direct DB)",
      1: "nemotron-120b (free)",
      2: "nemotron-120b (free)",
      3: "nemotron-120b (free)",
    };

    return successResponse({
      classification,
      model: modelNames[classification.tier] ?? "unknown",
      estimatedCost: costEstimates[classification.tier] ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Classification failed";
    return errorResponse(message, 500);
  }
}
