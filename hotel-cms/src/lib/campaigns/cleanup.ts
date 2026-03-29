import { prisma } from "@/lib/db";

export async function endCampaign(
  campaignId: string
): Promise<{ removed: number }> {
  // 1. Fetch campaign
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  if (campaign.status !== "active") {
    throw new Error("Campaign is not active");
  }

  // 2. Parse createdSections
  const sections = campaign.createdSections as Array<{ sectionId: string }>;

  // 3. Delete each section, ignoring errors
  let removed = 0;

  for (const { sectionId } of sections) {
    try {
      await prisma.section.delete({ where: { id: sectionId } });
      removed++;
    } catch {
      // ignore — section may have already been deleted
    }
  }

  // 5. Update campaign status and clear created sections
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "ended",
      createdSections: [] as any,
    },
  });

  // 6. Return result
  return { removed };
}
