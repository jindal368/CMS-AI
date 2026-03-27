import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rejectVersion } from "@/lib/versioning";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.schemaVersion.findUnique({ where: { id } });
    if (!existing) return errorResponse("Version not found", 404);

    const version = await rejectVersion(id);

    return successResponse(version);
  } catch (err) {
    console.error("[POST /api/versions/[id]/reject]", err);
    return errorResponse("Failed to reject version", 500);
  }
}
