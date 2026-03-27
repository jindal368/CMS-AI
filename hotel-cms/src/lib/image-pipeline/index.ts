/**
 * Image Processing Pipeline
 *
 * Orchestrates a 4-step pipeline for every uploaded hotel image:
 *
 *   Step 1 — Strip EXIF + encode originals as WebP and AVIF
 *   Step 2 — Generate responsive srcset variants (400w / 800w / 1200w / 1600w)
 *             plus a 200w thumbnail
 *   Step 3 — AI analysis (alt text + auto-tagging via Haiku vision — placeholder)
 *   Step 4 — Tag-based auto-sort: suggest the right gallery section
 */

import path from "path";
import fs from "fs/promises";
import {
  stripExif,
  convertToWebP,
  convertToAvif,
  generateSrcSet,
  generateThumbnail,
} from "./processor";
import {
  generateAltText,
  autoTagImage,
  suggestGalleryPlacement,
  type HotelContext,
} from "./analyzer";

// ─── Constants ────────────────────────────────────────────────────────────────

const SRCSET_WIDTHS = [400, 800, 1200, 1600] as const;
const THUMBNAIL_SIZE = 200;

/** Absolute path to the public uploads directory. */
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// ─── Output types ─────────────────────────────────────────────────────────────

export interface PipelineVariants {
  /** Original image encoded as full-size WebP. */
  webp: string;
  /** Original image encoded as full-size AVIF. */
  avif: string;
  /** Square thumbnail (200 × 200 WebP). */
  thumbnail: string;
  /** Responsive srcset paths keyed by width descriptor ("400w" … "1600w"). */
  srcset: Record<string, string>;
}

export interface PipelineResult {
  /** Canonical public URL for the base WebP asset. */
  url: string;
  /** AI-generated (or placeholder) alt text. */
  altText: string;
  /** Tags derived from AI analysis (or placeholder). */
  tags: string[];
  /** Suggested gallery section based on tags. */
  gallerySection: string;
  /** All processed variant paths (public URLs). */
  variants: PipelineVariants;
  /** MIME type of the stored canonical asset. */
  mimeType: string;
  /** File size of the base WebP buffer in bytes. */
  fileSize: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensure the hotel's upload subdirectory exists and return its absolute path.
 */
async function ensureHotelDir(hotelId: string): Promise<string> {
  const dir = path.join(UPLOADS_DIR, hotelId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Write a buffer to disk and return the corresponding public URL path.
 */
async function writeVariant(
  buffer: Buffer,
  hotelId: string,
  filename: string
): Promise<string> {
  const dir = await ensureHotelDir(hotelId);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  // Return as a root-relative public URL
  return `/uploads/${hotelId}/${filename}`;
}

/**
 * Derive a URL-safe base name from the original filename (strip extension).
 */
function baseName(filename: string): string {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[^a-z0-9_-]/gi, "_")
    .toLowerCase();
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run the full 4-step image processing pipeline.
 *
 * @param buffer       Raw bytes of the uploaded image.
 * @param filename     Original filename (used to derive output names).
 * @param hotelId      Hotel UUID — used to scope the upload directory.
 * @param hotelContext Minimal hotel metadata for alt-text generation.
 * @returns            A `PipelineResult` with all variant paths and metadata.
 */
export async function processImage(
  buffer: Buffer,
  filename: string,
  hotelId: string,
  hotelContext: HotelContext
): Promise<PipelineResult> {
  const base = baseName(filename);
  // Add a timestamp suffix to avoid collisions on repeated uploads.
  const stamp = Date.now();
  const slug = `${base}_${stamp}`;

  // ── Step 1: Strip EXIF + encode full-resolution WebP and AVIF ─────────────

  const cleanBuffer = await stripExif(buffer);

  const [webpBuffer, avifBuffer] = await Promise.all([
    convertToWebP(cleanBuffer),
    convertToAvif(cleanBuffer),
  ]);

  const [webpUrl, avifUrl] = await Promise.all([
    writeVariant(webpBuffer, hotelId, `${slug}.webp`),
    writeVariant(avifBuffer, hotelId, `${slug}.avif`),
  ]);

  // ── Step 2: Generate responsive srcset variants + thumbnail ───────────────

  const [srcSetMap, thumbnailBuffer] = await Promise.all([
    generateSrcSet(cleanBuffer, [...SRCSET_WIDTHS]),
    generateThumbnail(cleanBuffer, THUMBNAIL_SIZE),
  ]);

  // Write all srcset variants in parallel.
  const srcsetEntries = await Promise.all(
    [...srcSetMap.entries()].map(async ([key, variantBuffer]) => {
      const url = await writeVariant(
        variantBuffer,
        hotelId,
        `${slug}_${key}.webp`
      );
      return [key, url] as const;
    })
  );

  const thumbnailUrl = await writeVariant(
    thumbnailBuffer,
    hotelId,
    `${slug}_thumb.webp`
  );

  const srcset = Object.fromEntries(srcsetEntries);

  // ── Step 3: AI analysis — alt text + auto-tagging (placeholder) ───────────

  const [altText, tags] = await Promise.all([
    generateAltText(webpBuffer, hotelContext),
    autoTagImage(webpBuffer),
  ]);

  // ── Step 4: Tag-based auto-sort into gallery section ──────────────────────

  const gallerySection = suggestGalleryPlacement(tags);

  // ── Assemble result ───────────────────────────────────────────────────────

  return {
    url: webpUrl,
    altText,
    tags,
    gallerySection,
    variants: {
      webp: webpUrl,
      avif: avifUrl,
      thumbnail: thumbnailUrl,
      srcset,
    },
    mimeType: "image/webp",
    fileSize: webpBuffer.length,
  };
}
