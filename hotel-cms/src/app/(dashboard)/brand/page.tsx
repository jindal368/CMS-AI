import { redirect } from "next/navigation";
import { getSessionOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BrandPageClient from "./BrandPageClient";

export const dynamic = "force-dynamic";

export default async function BrandPage() {
  const { user } = await getSessionOrRedirect();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
    select: { brandTheme: true, lockedSections: true, customDomain: true },
  });

  const brandTheme = (org?.brandTheme ?? null) as object | null;
  const lockedSections = (org?.lockedSections ?? []) as Array<{
    id: string;
    label: string;
    position: "top" | "bottom";
    variant: string;
    props: Record<string, unknown>;
  }>;
  const customDomain = org?.customDomain ?? null;

  return (
    <BrandPageClient
      brandTheme={brandTheme}
      lockedSections={lockedSections}
      customDomain={customDomain}
    />
  );
}
