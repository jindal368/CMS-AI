import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

const COOKIE_NAME = "hotelcms_session";
const SESSION_EXPIRY_DAYS = 30;
const ROLE_HIERARCHY: Record<string, number> = { admin: 3, editor: 2, viewer: 1 };

export async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { org: true } } },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }

  return { user: session.user, org: session.user.org };
}

export async function requireAuth(
  request: NextRequest
): Promise<{ user: any; org: any; response: Response | null }> {
  const auth = await getSessionFromRequest(request);
  if (!auth) {
    return {
      user: null,
      org: null,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user: auth.user, org: auth.org, response: null };
}

export async function requireRole(
  request: NextRequest,
  minRole: "admin" | "editor" | "viewer"
): Promise<{ user: any; org: any; response: Response | null }> {
  const auth = await requireAuth(request);
  if (auth.response) return auth;

  if (ROLE_HIERARCHY[auth.user.role] < ROLE_HIERARCHY[minRole]) {
    return { ...auth, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return auth;
}

export async function requireHotelAccess(
  request: NextRequest,
  hotelId: string
): Promise<{ user: any; org: any; response: Response | null }> {
  const auth = await requireAuth(request);
  if (auth.response) return auth;

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { orgId: true },
  });

  if (!hotel) {
    return {
      ...auth,
      response: Response.json({ error: "Not Found" }, { status: 404 }),
    };
  }

  if (hotel.orgId && hotel.orgId !== auth.user.orgId) {
    return {
      ...auth,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (auth.user.role === "admin") return auth;

  const access = (auth.user.hotelAccess as string[]) || [];
  if (access.length > 0 && !access.includes(hotelId)) {
    return {
      ...auth,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { org: true } } },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }

  return { user: session.user, org: session.user.org };
}

export async function getSessionOrRedirect() {
  const auth = await getSessionFromCookies();
  if (!auth) redirect("/login");
  return { user: auth.user, org: auth.org };
}

export async function createSession(userId: string): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return session.token;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
