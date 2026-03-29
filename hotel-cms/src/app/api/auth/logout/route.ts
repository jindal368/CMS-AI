import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("hotelcms_session")?.value;

    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }

    await clearSessionCookie();

    return Response.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/logout]", err);
    return Response.json({ error: "Logout failed" }, { status: 500 });
  }
}
