import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth";
import { endCampaign } from "@/lib/campaigns/cleanup";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return errorResponse("Campaign not found", 404);
    }

    if (campaign.orgId !== auth.user.orgId) {
      return errorResponse("Forbidden", 403);
    }

    const result = await endCampaign(id);

    return successResponse({ removed: result.removed });
  } catch (err) {
    console.error("[POST /api/campaigns/[id]/end]", err);
    return errorResponse("Failed to end campaign", 500);
  }
}
