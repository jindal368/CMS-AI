import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    const users = await prisma.user.findMany({
      where: { orgId: auth.user.orgId },
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

    return successResponse(users);
  } catch (err) {
    console.error("[GET /api/users]", err);
    return errorResponse("Failed to fetch users", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");
    if (auth.response) return auth.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { email, name, role, hotelAccess } = body as Record<string, unknown>;

    if (!email || typeof email !== "string") {
      return errorResponse("email is required", 400);
    }
    if (!name || typeof name !== "string") {
      return errorResponse("name is required", 400);
    }
    if (role !== "editor" && role !== "viewer") {
      return errorResponse('role must be "editor" or "viewer"', 400);
    }
    if (!Array.isArray(hotelAccess) || !hotelAccess.every((h) => typeof h === "string")) {
      return errorResponse("hotelAccess must be an array of strings", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("Email already taken", 409);
    }

    const temporaryPassword =
      Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await prisma.user.create({
      data: {
        orgId: auth.user.orgId,
        email,
        name,
        role,
        hotelAccess,
        passwordHash,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return successResponse({ user, temporaryPassword }, 201);
  } catch (err) {
    console.error("[POST /api/users]", err);
    return errorResponse("Failed to invite user", 500);
  }
}
