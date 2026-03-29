import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const campaigns = await prisma.campaign.findMany({
      where: { orgId: auth.user.orgId },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(campaigns);
  } catch (err) {
    console.error("[GET /api/campaigns]", err);
    return errorResponse("Failed to fetch campaigns", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const body = await request.json();
    const { title, brief, targetHotels } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return errorResponse("title is required", 400);
    }
    if (!brief || typeof brief !== "string" || brief.trim() === "") {
      return errorResponse("brief is required", 400);
    }

    const campaign = await prisma.campaign.create({
      data: {
        orgId: auth.user.orgId,
        createdById: auth.user.id,
        title: title.trim(),
        brief: brief.trim(),
        status: "draft",
        targetHotels: targetHotels ?? [],
      },
    });

    return successResponse(campaign, 201);
  } catch (err) {
    console.error("[POST /api/campaigns]", err);
    return errorResponse("Failed to create campaign", 500);
  }
}
