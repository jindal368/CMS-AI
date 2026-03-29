/**
 * POST /api/media/upload
 *
 * Accepts multipart/form-data with:
 *   - file    : the image file (File / Blob)
 *   - hotelId : UUID of the hotel this asset belongs to
 *
 * Pipeline:
 *   1. Parse form data and validate inputs.
 *   2. Run the image through the 4-step processing pipeline.
 *   3. Persist variant files under:
 *        public/uploads/<hotelId>/<slug>.webp          ← canonical
 *        public/uploads/<hotelId>/<slug>.avif
 *        public/uploads/<hotelId>/<slug>_thumb.webp
 *        public/uploads/<hotelId>/<slug>_400w.webp
 *        public/uploads/<hotelId>/<slug>_800w.webp
 *        public/uploads/<hotelId>/<slug>_1200w.webp
 *        public/uploads/<hotelId>/<slug>_1600w.webp
 *   4. Create a MediaAsset record in the database.
 *   5. Return the full asset with all variant URLs.
 *
 * Directory layout:
 *   public/
 *   └── uploads/
 *       └── <hotelId>/
 *           ├── <slug>.webp
 *           ├── <slug>.avif
 *           ├── <slug>_thumb.webp
 *           ├── <slug>_400w.webp
 *           ├── <slug>_800w.webp
 *           ├── <slug>_1200w.webp
 *           └── <slug>_1600w.webp
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { processImage } from "@/lib/image-pipeline";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

// ─── Supported upload MIME types ─────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/tiff",
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    // Require at least editor role
    if (!["admin", "editor"].includes(auth.user.role)) {
      return errorResponse("Forbidden", 403);
    }

    // ── 1. Parse multipart form data ────────────────────────────────────────

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("Request must be multipart/form-data", 400);
    }

    const fileField = formData.get("file");
    const hotelId = formData.get("hotelId");

    if (!hotelId || typeof hotelId !== "string" || hotelId.trim() === "") {
      return errorResponse("Missing required field: hotelId", 400);
    }

    if (!fileField || !(fileField instanceof File)) {
      return errorResponse("Missing required field: file (must be a File)", 400);
    }

    // ── 2. Validate file ─────────────────────────────────────────────────────

    const file = fileField as File;

    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse(
        `Unsupported file type: ${file.type}. Allowed: ${[...ALLOWED_TYPES].join(", ")}`,
        415
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse(
        `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
        413
      );
    }

    // ── 3. Verify hotel exists ───────────────────────────────────────────────

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId.trim() },
      select: { id: true, name: true, category: true },
    });

    if (!hotel) {
      return errorResponse(`Hotel not found: ${hotelId}`, 404);
    }

    // ── 4. Run processing pipeline ───────────────────────────────────────────

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await processImage(buffer, file.name, hotel.id, {
      name: hotel.name,
      category: hotel.category,
    });

    // ── 5. Persist MediaAsset record ─────────────────────────────────────────

    const asset = await prisma.mediaAsset.create({
      data: {
        hotelId: hotel.id,
        url: result.url,
        altText: result.altText,
        tags: result.tags,
        variants: {
          webp: result.variants.webp,
          avif: result.variants.avif,
          thumbnail: result.variants.thumbnail,
          ...result.variants.srcset,
        },
        mimeType: result.mimeType,
        fileSize: result.fileSize,
      },
    });

    // ── 6. Return created asset ──────────────────────────────────────────────

    return successResponse(
      {
        asset,
        gallerySection: result.gallerySection,
      },
      201
    );
  } catch (err) {
    console.error("[POST /api/media/upload]", err);
    return errorResponse("Image processing failed", 500);
  }
}
