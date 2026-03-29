import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const org = await prisma.organization.findUnique({
      where: { id: auth.user.orgId },
      select: { brandTheme: true, lockedSections: true },
    });

    if (!org) {
      return errorResponse("Organization not found", 404);
    }

    return successResponse({
      brandTheme: org.brandTheme,
      lockedSections: org.lockedSections,
    });
  } catch (err) {
    console.error("[GET /api/brand]", err);
    return errorResponse("Failed to fetch brand settings", 500);
  }
}
