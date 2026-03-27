import { prisma } from "@/lib/db";
import { createVersion } from "@/lib/versioning";

/**
 * Executes Tier 0 operations — direct database writes with no LLM.
 * These cover ~70% of all CMS operations.
 */
export async function executeTier0(
  hotelId: string,
  action: string,
  context?: Record<string, unknown>
): Promise<unknown> {
  switch (action) {
    case "update_contact":
      return updateContact(hotelId, context);
    case "update_pricing":
      return updatePricing(hotelId, context);
    case "toggle_visibility":
      return toggleVisibility(context);
    case "reorder":
      return reorderItems(context);
    case "update_hotel_name":
      return updateHotelName(hotelId, context);
    default:
      return { message: `Tier 0 action "${action}" acknowledged`, context };
  }
}

async function updateContact(
  hotelId: string,
  context?: Record<string, unknown>
) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw new Error("Hotel not found");

  const before = { contactInfo: hotel.contactInfo };
  const newContactInfo = { ...(hotel.contactInfo as object), ...context };
  const after = { contactInfo: newContactInfo };

  const updated = await prisma.hotel.update({
    where: { id: hotelId },
    data: { contactInfo: newContactInfo as any },
  });

  await createVersion({
    hotelId,
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
    modelTier: 0,
    modelUsed: "none",
    description: "Contact info updated",
  });

  return updated;
}

async function updatePricing(
  hotelId: string,
  context?: Record<string, unknown>
) {
  if (!context?.roomId || !context?.pricing) {
    throw new Error("roomId and pricing required for price update");
  }

  const room = await prisma.room.findUnique({
    where: { id: context.roomId as string },
  });
  if (!room) throw new Error("Room not found");

  const before = { pricing: room.pricing };
  const after = { pricing: context.pricing };

  const updated = await prisma.room.update({
    where: { id: context.roomId as string },
    data: { pricing: context.pricing as any },
  });

  await createVersion({
    hotelId,
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
    modelTier: 0,
    modelUsed: "none",
    description: `Room "${room.name}" pricing updated`,
  });

  return updated;
}

async function toggleVisibility(context?: Record<string, unknown>) {
  if (!context?.sectionId) {
    throw new Error("sectionId required for visibility toggle");
  }

  const section = await prisma.section.findUnique({
    where: { id: context.sectionId as string },
  });
  if (!section) throw new Error("Section not found");

  return prisma.section.update({
    where: { id: context.sectionId as string },
    data: { isVisible: !section.isVisible },
  });
}

async function reorderItems(context?: Record<string, unknown>) {
  if (!context?.items || !Array.isArray(context.items)) {
    throw new Error("items array required for reorder");
  }

  const updates = (context.items as { id: string; sortOrder: number }[]).map(
    (item) =>
      prisma.section.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
  );

  return Promise.all(updates);
}

async function updateHotelName(
  hotelId: string,
  context?: Record<string, unknown>
) {
  if (!context?.name) {
    throw new Error("name required for hotel name update");
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw new Error("Hotel not found");

  const before = { name: hotel.name };
  const after = { name: context.name as string };

  const updated = await prisma.hotel.update({
    where: { id: hotelId },
    data: { name: context.name as string },
  });

  await createVersion({
    hotelId,
    before: before as Record<string, unknown>,
    after: after as Record<string, unknown>,
    modelTier: 0,
    modelUsed: "none",
    description: `Hotel renamed to "${context.name}"`,
  });

  return updated;
}
