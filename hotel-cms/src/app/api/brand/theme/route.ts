import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const body = await request.json();
    const { brandTheme } = body;

    if (brandTheme !== null && (typeof brandTheme !== "object" || Array.isArray(brandTheme))) {
      return errorResponse("brandTheme must be an object or null", 400);
    }

    const org = await prisma.organization.update({
      where: { id: auth.user.orgId },
      data: { brandTheme: brandTheme ?? null },
      select: { brandTheme: true },
    });

    return successResponse({ brandTheme: org.brandTheme });
  } catch (err) {
    console.error("[PUT /api/brand/theme]", err);
    return errorResponse("Failed to update brand theme", 500);
  }
}
