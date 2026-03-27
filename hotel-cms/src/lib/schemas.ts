import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────

export const HotelCategory = z.enum([
  "luxury",
  "boutique",
  "business",
  "resort",
  "budget",
]);

export const PageType = z.enum([
  "home",
  "rooms",
  "gallery",
  "contact",
  "about",
  "dining",
  "spa",
  "events",
  "custom",
]);

export const VersionStatus = z.enum([
  "draft",
  "published",
  "rejected",
  "rolled_back",
]);

// ─── JSONB Field Schemas ─────────────────────────────────

export const ContactInfo = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export const SeoConfig = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
});

export const ColorTokens = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  bg: z.string(),
  text: z.string(),
});

export const Typography = z.object({
  headingFont: z.string(),
  bodyFont: z.string(),
  scale: z.enum(["small", "medium", "large"]).default("medium"),
});

export const Spacing = z.enum(["compact", "balanced", "spacious"]);

export const MetaTags = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: z.string().optional(),
});

export const Pricing = z.object({
  basePrice: z.number(),
  currency: z.string().default("USD"),
  seasonalRates: z
    .array(
      z.object({
        season: z.string(),
        multiplier: z.number(),
      })
    )
    .optional(),
});

export const MediaVariants = z.object({
  thumbnail: z.string().optional(),
  "400w": z.string().optional(),
  "800w": z.string().optional(),
  "1200w": z.string().optional(),
  "1600w": z.string().optional(),
  webp: z.string().optional(),
  avif: z.string().optional(),
});

// ─── Model Schemas ───────────────────────────────────────

export const HotelCreateSchema = z.object({
  name: z.string().min(1).max(200),
  category: HotelCategory,
  contactInfo: ContactInfo,
  seoConfig: SeoConfig.optional().default({}),
  defaultLocale: z.string().default("en"),
});

export const HotelUpdateSchema = HotelCreateSchema.partial();

export const ThemeSchema = z.object({
  colorTokens: ColorTokens,
  typography: Typography,
  spacing: Spacing,
  baseTemplate: z.enum(["luxury", "boutique", "business", "resort"]),
});

export const PageCreateSchema = z.object({
  hotelId: z.string().uuid(),
  slug: z.string().min(1).max(100),
  locale: z.string().default("en"),
  pageType: PageType,
  sortOrder: z.number().int().default(0),
  metaTags: MetaTags.optional().default({}),
});

export const PageUpdateSchema = PageCreateSchema.partial().omit({
  hotelId: true,
});

export const SectionCreateSchema = z.object({
  pageId: z.string().uuid(),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  componentVariant: z.string(),
  props: z.record(z.string(), z.unknown()).default({}),
});

export const SectionUpdateSchema = SectionCreateSchema.partial().omit({
  pageId: true,
});

export const RoomCreateSchema = z.object({
  hotelId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().default(""),
  pricing: Pricing,
  amenities: z.array(z.string()).default([]),
  maxGuests: z.number().int().min(1).default(2),
  images: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

export const RoomUpdateSchema = RoomCreateSchema.partial().omit({
  hotelId: true,
});

export const MediaAssetCreateSchema = z.object({
  hotelId: z.string().uuid(),
  url: z.string().url(),
  altText: z.string().default(""),
  tags: z.array(z.string()).default([]),
  variants: MediaVariants.optional().default({}),
  mimeType: z.string().default("image/jpeg"),
  fileSize: z.number().int().default(0),
});

export const ComponentSchema = z.object({
  type: z.string(),
  variant: z.string(),
  defaultProps: z.record(z.string(), z.unknown()),
  propSchema: z.record(z.string(), z.unknown()),
  renderTemplate: z.string(),
  categoryAffinity: z.array(HotelCategory),
  tierRequirement: z.number().int().min(0).max(3),
  description: z.string(),
});

// ─── LLM / Router Schemas ────────────────────────────────

export const ClassifyRequestSchema = z.object({
  hotelId: z.string().uuid(),
  action: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const LLMResponseSchema = z.object({
  path: z.string().optional(),
  value: z.unknown().optional(),
  alternatives: z.array(z.unknown()).optional(),
  sectionUpdate: z
    .object({
      componentVariant: z.string(),
      props: z.record(z.string(), z.unknown()),
    })
    .optional(),
  reasoning: z.string().optional(),
});

// ─── Type Exports ────────────────────────────────────────

export type HotelCategory = z.infer<typeof HotelCategory>;
export type PageType = z.infer<typeof PageType>;
export type VersionStatus = z.infer<typeof VersionStatus>;
export type ContactInfo = z.infer<typeof ContactInfo>;
export type SeoConfig = z.infer<typeof SeoConfig>;
export type ColorTokens = z.infer<typeof ColorTokens>;
export type Typography = z.infer<typeof Typography>;
export type Spacing = z.infer<typeof Spacing>;
export type MetaTags = z.infer<typeof MetaTags>;
export type Pricing = z.infer<typeof Pricing>;
export type MediaVariants = z.infer<typeof MediaVariants>;
export type HotelCreate = z.infer<typeof HotelCreateSchema>;
export type HotelUpdate = z.infer<typeof HotelUpdateSchema>;
export type ThemeData = z.infer<typeof ThemeSchema>;
export type PageCreate = z.infer<typeof PageCreateSchema>;
export type PageUpdate = z.infer<typeof PageUpdateSchema>;
export type SectionCreate = z.infer<typeof SectionCreateSchema>;
export type SectionUpdate = z.infer<typeof SectionUpdateSchema>;
export type RoomCreate = z.infer<typeof RoomCreateSchema>;
export type RoomUpdate = z.infer<typeof RoomUpdateSchema>;
export type MediaAssetCreate = z.infer<typeof MediaAssetCreateSchema>;
export type ComponentData = z.infer<typeof ComponentSchema>;
export type ClassifyRequest = z.infer<typeof ClassifyRequestSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
