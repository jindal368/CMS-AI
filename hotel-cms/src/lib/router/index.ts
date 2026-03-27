import { classifyAction, ClassificationResult, Tier } from "./classifier";
import { executeTier0 } from "./tier0-handler";
import { executeLLMTier } from "../llm/index";

export interface RouterRequest {
  hotelId: string;
  action: string;
  context?: Record<string, unknown>;
}

export interface RouterResponse {
  classification: ClassificationResult;
  result: unknown;
  versionId?: string;
}

/**
 * Main task router — classifies the action and dispatches to the right handler.
 */
export async function routeAction(
  request: RouterRequest
): Promise<RouterResponse> {
  const { hotelId, action, context } = request;

  // Step 1: Classify the action
  const classification = await classifyAction(action, context);

  // Step 2: Route to appropriate handler
  let result: unknown;

  if (classification.tier === 0) {
    result = await executeTier0(hotelId, classification.action, context);
  } else {
    result = await executeLLMTier(
      hotelId,
      classification.tier,
      classification.action,
      action,
      context
    );
  }

  return {
    classification,
    result,
  };
}

export { classifyAction, type ClassificationResult, type Tier };
