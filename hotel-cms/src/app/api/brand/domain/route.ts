import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const body = await request.json();
    const customDomain: string | null = body.customDomain ?? null;

    // Normalize: treat empty string as null
    const normalized = customDomain?.trim() || null;

    await prisma.organization.update({
      where: { id: auth.user.orgId },
      data: { customDomain: normalized },
    });

    return successResponse({ customDomain: normalized });
  } catch (err) {
    console.error("[PUT /api/brand/domain]", err);
    return errorResponse("Failed to update custom domain", 500);
  }
}
