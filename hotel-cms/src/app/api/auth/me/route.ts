import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    return Response.json({
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        role: auth.user.role,
        hotelAccess: auth.user.hotelAccess,
      },
      org: {
        id: auth.user.org?.id,
        name: auth.user.org?.name,
        slug: auth.user.org?.slug,
        logo: auth.user.org?.logo,
      },
    });
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return Response.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
