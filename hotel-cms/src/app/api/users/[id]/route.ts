import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { role, hotelAccess, name } = body as Record<string, unknown>;

    if (
      role !== undefined &&
      role !== "admin" &&
      role !== "editor" &&
      role !== "viewer"
    ) {
      return errorResponse('role must be "admin", "editor", or "viewer"', 400);
    }
    if (hotelAccess !== undefined) {
      if (
        !Array.isArray(hotelAccess) ||
        !hotelAccess.every((h) => typeof h === "string")
      ) {
        return errorResponse("hotelAccess must be an array of strings", 400);
      }
    }
    if (name !== undefined && typeof name !== "string") {
      return errorResponse("name must be a string", 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.orgId !== auth.user.orgId) {
      return errorResponse("User not found", 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role: role as "admin" | "editor" | "viewer" }),
        ...(hotelAccess !== undefined && { hotelAccess }),
        ...(name !== undefined && { name: name as string }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelAccess: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return successResponse(updated);
  } catch (err) {
    console.error("[PUT /api/users/[id]]", err);
    return errorResponse("Failed to update user", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const { id } = await params;

    if (id === auth.user.id) {
      return errorResponse("Cannot delete your own account", 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.orgId !== auth.user.orgId) {
      return errorResponse("User not found", 404);
    }

    await prisma.user.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/users/[id]]", err);
    return errorResponse("Failed to delete user", 500);
  }
}
