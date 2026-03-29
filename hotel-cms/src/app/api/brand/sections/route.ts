import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const body = await request.json();
    const { lockedSections } = body;

    if (!Array.isArray(lockedSections)) {
      return errorResponse("lockedSections must be an array", 400);
    }

    const org = await prisma.organization.update({
      where: { id: auth.user.orgId },
      data: { lockedSections: lockedSections as any },
      select: { lockedSections: true },
    });

    return successResponse({ lockedSections: org.lockedSections });
  } catch (err) {
    console.error("[PUT /api/brand/sections]", err);
    return errorResponse("Failed to update locked sections", 500);
  }
}
