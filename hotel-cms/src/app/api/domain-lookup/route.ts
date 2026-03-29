import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";

// Module-level in-memory cache to avoid redundant DB lookups per runtime instance
const cache = new Map<string, { orgSlug: string; expires: number }>();
const TTL = 60_000; // 60 seconds

export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get("host");

  if (!host) {
    return errorResponse("Missing required query param: host", 400);
  }

  // Check cache first
  const cached = cache.get(host);
  if (cached && cached.expires > Date.now()) {
    return successResponse({ orgSlug: cached.orgSlug });
  }

  try {
    const org = await prisma.organization.findFirst({
      where: { customDomain: host },
      select: { slug: true },
    });

    if (!org) {
      return errorResponse("No organization found for this domain", 404);
    }

    // Populate cache
    cache.set(host, { orgSlug: org.slug, expires: Date.now() + TTL });

    return successResponse({ orgSlug: org.slug });
  } catch (err) {
    console.error("[GET /api/domain-lookup]", err);
    return errorResponse("Failed to look up domain", 500);
  }
}
