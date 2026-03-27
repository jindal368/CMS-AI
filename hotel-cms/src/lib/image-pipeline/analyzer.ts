/**
 * AI-powered image analysis utilities.
 *
 * The functions here are designed to call Claude Haiku vision in production.
 * Until that integration is wired up they return deterministic placeholder
 * values so the rest of the pipeline can run end-to-end without an API key.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HotelContext {
  name: string;
  category: string;
}

// ─── Tag → gallery-section mapping ───────────────────────────────────────────

const TAG_TO_SECTION: Record<string, string> = {
  // Rooms & suites
  room: "rooms",
  suite: "rooms",
  bedroom: "rooms",
  bed: "rooms",
  bathroom: "rooms",
  bath: "rooms",

  // Pool & recreational amenities
  pool: "amenities",
  gym: "amenities",
  fitness: "amenities",
  spa: "amenities",
  sauna: "amenities",
  jacuzzi: "amenities",
  tennis: "amenities",

  // Food & drink
  restaurant: "dining",
  dining: "dining",
  food: "dining",
  bar: "dining",
  breakfast: "dining",
  cafe: "dining",
  kitchen: "dining",

  // Interior common areas
  lobby: "interior",
  lounge: "interior",
  reception: "interior",
  corridor: "interior",
  hallway: "interior",
  common: "interior",

  // Exterior & views
  exterior: "exterior",
  facade: "exterior",
  garden: "exterior",
  terrace: "exterior",
  balcony: "exterior",
  view: "exterior",
  rooftop: "exterior",
  parking: "exterior",

  // Events
  conference: "events",
  meeting: "events",
  ballroom: "events",
  event: "events",
  wedding: "events",
};

// ─── Placeholder tags by hotel category ──────────────────────────────────────

const CATEGORY_DEFAULT_TAGS: Record<string, string[]> = {
  luxury: ["exterior", "lobby", "room", "pool", "spa"],
  boutique: ["exterior", "lobby", "room", "dining"],
  business: ["exterior", "conference", "room", "lobby"],
  resort: ["pool", "exterior", "beach", "room", "spa"],
  budget: ["exterior", "room", "lobby"],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate descriptive alt text for an image.
 *
 * Production: sends the image buffer to Claude Haiku vision with a prompt
 * asking for a concise, SEO-friendly alt-text string.
 *
 * Placeholder: returns a generic description based on hotel context.
 */
export async function generateAltText(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _imageBuffer: Buffer,
  hotelContext: HotelContext
): Promise<string> {
  /*
   * --- Production implementation (Haiku vision) ---
   *
   * import Anthropic from "@anthropic-ai/sdk";
   * const client = new Anthropic();
   * const base64 = imageBuffer.toString("base64");
   * const response = await client.messages.create({
   *   model: "claude-haiku-4-5",
   *   max_tokens: 150,
   *   messages: [
   *     {
   *       role: "user",
   *       content: [
   *         { type: "image", source: { type: "base64", media_type: "image/webp", data: base64 } },
   *         {
   *           type: "text",
   *           text: `Write a concise, descriptive alt text (max 125 chars) for this hotel image.
   *                  Hotel: "${hotelContext.name}" (${hotelContext.category} category).
   *                  Focus on what is visible. No phrases like "image of" or "photo of".`,
   *         },
   *       ],
   *     },
   *   ],
   * });
   * return (response.content[0] as { type: "text"; text: string }).text.trim();
   */

  // Placeholder
  return `${hotelContext.name} — ${hotelContext.category} hotel image`;
}

/**
 * Automatically tag an image with descriptive labels.
 *
 * Production: sends the image buffer to Claude Haiku vision asking for a
 * JSON array of lowercase tags describing the scene.
 *
 * Placeholder: returns a common set of hotel photography tags.
 */
export async function autoTagImage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _imageBuffer: Buffer
): Promise<string[]> {
  /*
   * --- Production implementation (Haiku vision) ---
   *
   * import Anthropic from "@anthropic-ai/sdk";
   * const client = new Anthropic();
   * const base64 = imageBuffer.toString("base64");
   * const response = await client.messages.create({
   *   model: "claude-haiku-4-5",
   *   max_tokens: 200,
   *   messages: [
   *     {
   *       role: "user",
   *       content: [
   *         { type: "image", source: { type: "base64", media_type: "image/webp", data: base64 } },
   *         {
   *           type: "text",
   *           text: `Analyze this hotel image and return a JSON array of 3-6 lowercase tags
   *                  that best describe what is shown (e.g. ["pool","outdoor","luxury"]).
   *                  Reply with only the JSON array, no other text.`,
   *         },
   *       ],
   *     },
   *   ],
   * });
   * const raw = (response.content[0] as { type: "text"; text: string }).text.trim();
   * return JSON.parse(raw) as string[];
   */

  // Placeholder — most common hotel photography subjects
  return ["exterior", "hotel", "architecture"];
}

/**
 * Map a list of image tags to the most appropriate gallery section.
 *
 * Rule-based lookup against TAG_TO_SECTION; falls back to "general" when
 * no match is found.
 */
export function suggestGalleryPlacement(tags: string[]): string {
  for (const tag of tags) {
    const normalised = tag.toLowerCase().trim();
    if (TAG_TO_SECTION[normalised]) {
      return TAG_TO_SECTION[normalised];
    }
  }
  return "general";
}

/**
 * Exported for use in the upload route when the hotel category is known but
 * no AI tags are available.
 */
export function defaultTagsForCategory(category: string): string[] {
  return CATEGORY_DEFAULT_TAGS[category] ?? ["exterior", "hotel"];
}
