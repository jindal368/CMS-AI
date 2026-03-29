import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rollbackToVersion } from "@/lib/versioning";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    // Require at least editor role
    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const existing = await prisma.schemaVersion.findUnique({ where: { id } });
    if (!existing) return errorResponse("Version not found", 404);

    const snapshot = await rollbackToVersion(
      existing.hotelId,
      existing.versionNum
    );

    return successResponse({ snapshot, rolledBackTo: existing.versionNum });
  } catch (err) {
    console.error("[POST /api/versions/[id]/rollback]", err);
    if (err instanceof Error) {
      return errorResponse(err.message, 400);
    }
    return errorResponse("Failed to rollback version", 500);
  }
}
