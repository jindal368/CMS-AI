import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return errorResponse("Campaign not found", 404);
    }

    if (campaign.orgId !== auth.user.orgId) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse(campaign);
  } catch (err) {
    console.error("[GET /api/campaigns/[id]]", err);
    return errorResponse("Failed to fetch campaign", 500);
  }
}

export async function DELETE(
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

    if (campaign.status === "active") {
      const { endCampaign } = await import("@/lib/campaigns/cleanup");
      await endCampaign(id);
    }

    await prisma.campaign.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/campaigns/[id]]", err);
    return errorResponse("Failed to delete campaign", 500);
  }
}
