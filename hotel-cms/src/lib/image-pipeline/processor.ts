import sharp from "sharp";

/**
 * Strip EXIF metadata from an image buffer.
 *
 * Sharp's `.rotate()` reads and applies the EXIF orientation value then
 * discards the raw EXIF block from the output, giving us a clean buffer.
 * Not calling `.withMetadata()` means no metadata is re-attached.
 */
export async function stripExif(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).rotate().toBuffer();
}

/**
 * Convert an image buffer to WebP format.
 * Optionally resize to a given width (height is auto-scaled).
 */
export async function convertToWebP(
  buffer: Buffer,
  width?: number
): Promise<Buffer> {
  const pipeline = sharp(buffer).rotate(); // auto-orient via EXIF before stripping

  if (width !== undefined) {
    pipeline.resize({ width, withoutEnlargement: true });
  }

  return pipeline
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

/**
 * Convert an image buffer to AVIF format.
 * Optionally resize to a given width (height is auto-scaled).
 */
export async function convertToAvif(
  buffer: Buffer,
  width?: number
): Promise<Buffer> {
  const pipeline = sharp(buffer).rotate();

  if (width !== undefined) {
    pipeline.resize({ width, withoutEnlargement: true });
  }

  return pipeline
    .avif({ quality: 60, effort: 4 })
    .toBuffer();
}

/**
 * Generate multiple resized variants of an image.
 * Returns a Map keyed by "<width>w" → processed Buffer in WebP.
 */
export async function generateSrcSet(
  buffer: Buffer,
  widths: number[]
): Promise<Map<string, Buffer>> {
  const result = new Map<string, Buffer>();

  await Promise.all(
    widths.map(async (width) => {
      const variant = await convertToWebP(buffer, width);
      result.set(`${width}w`, variant);
    })
  );

  return result;
}

/**
 * Generate a square thumbnail from an image buffer.
 * Defaults to 200×200 px, cropped to fill.
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: number = 200
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(size, size, { fit: "cover", position: "attention" })
    .webp({ quality: 75, effort: 4 })
    .toBuffer();
}
