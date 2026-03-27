import { prisma } from "@/lib/db";

export async function getHotelContext(hotelId: string) {
  return prisma.hotelContext.upsert({
    where: { hotelId },
    create: { hotelId },
    update: {},
  });
}

export async function appendDecision(
  hotelId: string,
  decision: {
    prompt: string;
    approach: string;
    operations: string[];
    reasoning: string;
  }
) {
  const context = await getHotelContext(hotelId);
  const pastDecisions = Array.isArray(context.pastDecisions)
    ? (context.pastDecisions as any[])
    : [];

  pastDecisions.push({
    ...decision,
    timestamp: new Date().toISOString(),
  });

  return prisma.hotelContext.update({
    where: { hotelId },
    data: {
      pastDecisions: pastDecisions as any,
    },
  });
}

export async function updateSnapshot(
  hotelId: string,
  pageSlug: string,
  html: string
) {
  const context = await getHotelContext(hotelId);
  const renderedHtml =
    context.renderedHtml && typeof context.renderedHtml === "object" && !Array.isArray(context.renderedHtml)
      ? (context.renderedHtml as Record<string, string>)
      : {};

  renderedHtml[pageSlug] = html;

  return prisma.hotelContext.update({
    where: { hotelId },
    data: {
      renderedHtml: renderedHtml as any,
      lastSnapshot: new Date(),
    },
  });
}

export async function updateBrandVoice(hotelId: string, brandVoice: string) {
  await getHotelContext(hotelId);
  return prisma.hotelContext.update({
    where: { hotelId },
    data: { brandVoice },
  });
}

export async function updateStyleNotes(hotelId: string, styleNotes: string) {
  await getHotelContext(hotelId);
  return prisma.hotelContext.update({
    where: { hotelId },
    data: { styleNotes },
  });
}

export async function updatePreferences(
  hotelId: string,
  preferences: Record<string, unknown>
) {
  const context = await getHotelContext(hotelId);
  const existing =
    context.preferences && typeof context.preferences === "object" && !Array.isArray(context.preferences)
      ? (context.preferences as Record<string, unknown>)
      : {};

  const merged = { ...existing, ...preferences };

  return prisma.hotelContext.update({
    where: { hotelId },
    data: {
      preferences: merged as any,
    },
  });
}
