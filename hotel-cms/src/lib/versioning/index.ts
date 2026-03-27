import { applyPatch, compare, Operation } from "fast-json-patch";
import { prisma } from "@/lib/db";

export interface VersionCreateParams {
  hotelId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  modelTier?: number;
  modelUsed?: string;
  description?: string;
}

/**
 * Creates a new schema version by computing the RFC 6902 diff
 * between before and after states.
 */
export async function createVersion(params: VersionCreateParams) {
  const {
    hotelId,
    before,
    after,
    modelTier = 0,
    modelUsed = "none",
    description = "",
  } = params;

  // Compute RFC 6902 JSON patch
  const diffPatch = compare(before, after);

  if (diffPatch.length === 0) {
    return null; // No changes
  }

  // Get next version number
  const latest = await prisma.schemaVersion.findFirst({
    where: { hotelId },
    orderBy: { versionNum: "desc" },
  });
  const versionNum = (latest?.versionNum ?? 0) + 1;

  const version = await prisma.schemaVersion.create({
    data: {
      hotelId,
      versionNum,
      diffPatch: diffPatch as any,
      snapshot: after as any,
      modelTier,
      modelUsed,
      description,
      status: "draft",
    },
  });

  return version;
}

/**
 * Publishes a draft version, making it the live version.
 */
export async function publishVersion(versionId: string) {
  return prisma.schemaVersion.update({
    where: { id: versionId },
    data: { status: "published" },
  });
}

/**
 * Rejects a draft version.
 */
export async function rejectVersion(versionId: string) {
  return prisma.schemaVersion.update({
    where: { id: versionId },
    data: { status: "rejected" },
  });
}

/**
 * Rolls back to a specific version by applying all patches
 * from version 1 to the target version number.
 */
export async function rollbackToVersion(
  hotelId: string,
  targetVersionNum: number
) {
  const targetVersion = await prisma.schemaVersion.findUnique({
    where: {
      hotelId_versionNum: { hotelId, versionNum: targetVersionNum },
    },
  });

  if (!targetVersion) {
    throw new Error(`Version ${targetVersionNum} not found for hotel ${hotelId}`);
  }

  // The snapshot is the full state at that version
  return targetVersion.snapshot;
}

/**
 * Gets the version timeline for a hotel.
 */
export async function getVersionTimeline(hotelId: string) {
  return prisma.schemaVersion.findMany({
    where: { hotelId },
    orderBy: { versionNum: "asc" },
    select: {
      id: true,
      versionNum: true,
      modelTier: true,
      modelUsed: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });
}

/**
 * Applies a JSON patch to a document and returns the result.
 */
export function applyJsonPatch(
  document: Record<string, unknown>,
  patch: Operation[]
): Record<string, unknown> {
  const result = applyPatch(document, patch, true, false);
  return result.newDocument as Record<string, unknown>;
}

/**
 * Computes the diff between two documents.
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Operation[] {
  return compare(before, after);
}
