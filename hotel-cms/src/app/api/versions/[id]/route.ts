import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { id } = await params;

    const version = await prisma.schemaVersion.findUnique({ where: { id } });
    if (!version) return errorResponse("Version not found", 404);

    return successResponse(version);
  } catch (err) {
    console.error("[GET /api/versions/[id]]", err);
    return errorResponse("Failed to fetch version", 500);
  }
}
