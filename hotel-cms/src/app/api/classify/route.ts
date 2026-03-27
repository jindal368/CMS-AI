import { NextRequest } from "next/server";
import { parseBody, errorResponse, successResponse } from "@/lib/api-utils";
import { ClassifyRequestSchema } from "@/lib/schemas";
import { routeAction } from "@/lib/router";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseBody(request, ClassifyRequestSchema);
    if (error) return error;

    const result = await routeAction({
      hotelId: data.hotelId,
      action: data.action,
      context: data.context,
    });

    return successResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Classification failed";
    return errorResponse(message, 500);
  }
}
