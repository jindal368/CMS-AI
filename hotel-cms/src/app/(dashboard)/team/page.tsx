import { redirect } from "next/navigation";
import { getSessionOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TeamManager from "@/components/cms/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { user } = await getSessionOrRedirect();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const [users, hotels] = await Promise.all([
    prisma.user.findMany({
      where: { orgId: user.orgId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hotelAccess: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.hotel.findMany({
      where: { orgId: user.orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedUsers = users.map((u) => ({
    ...u,
    hotelAccess: u.hotelAccess as string[],
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));

  const serializedHotels = hotels.map((h) => ({
    id: h.id,
    name: h.name,
  }));

  return (
    <TeamManager
      users={serializedUsers}
      hotels={serializedHotels}
      currentUserId={user.id}
    />
  );
}
