import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

/**
 * Parse and validate a JSON request body against a Zod schema.
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  try {
    const raw = await request.json();
    const data = schema.parse(raw);
    return { data, error: null };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: Response.json(
          { error: "Validation failed", details: err.issues },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: Response.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

/**
 * Standard error response.
 */
export function errorResponse(message: string, status: number = 500) {
  return Response.json({ error: message }, { status });
}

/**
 * Standard success response.
 */
export function successResponse(data: unknown, status: number = 200) {
  return Response.json(data, { status });
}

/**
 * Extract a route parameter from the URL params.
 */
export function getParam(
  params: Promise<Record<string, string>> | Record<string, string>,
  key: string
): Promise<string> | string {
  if (params instanceof Promise) {
    return params.then((p) => p[key]);
  }
  return params[key];
}
