import { ComponentData } from "@/lib/schemas";

/**
 * Component Registry — all 12 pre-built, validated component variants.
 * LLMs select from this library — they never invent new components.
 */
export const COMPONENT_REGISTRY: ComponentData[] = [
  // ─── Hero Variants ────────────────────────────────────
  {
    type: "hero",
    variant: "hero_cinematic",
    description:
      "Full-bleed video/image with overlay text and gradient scrim",
    defaultProps: {
      media: "",
      headline: "Welcome",
      subtext: "",
      cta: "Book Now",
      ctaLink: "#booking",
      overlayOpacity: 0.4,
      overlayGradient: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
    },
    propSchema: {
      type: "object",
      required: ["media", "headline"],
      properties: {
        media: { type: "string", description: "Image or video URL" },
        headline: { type: "string", maxLength: 100 },
        subtext: { type: "string", maxLength: 200 },
        cta: { type: "string", maxLength: 30 },
        ctaLink: { type: "string" },
        overlayOpacity: { type: "number", minimum: 0, maximum: 1 },
        overlayGradient: { type: "string" },
      },
    },
    renderTemplate: "hero_cinematic",
    categoryAffinity: ["luxury", "resort"],
    tierRequirement: 2,
  },
  {
    type: "hero",
    variant: "hero_editorial",
    description: "Split layout — story text left, feature image right",
    defaultProps: {
      headline: "Your Story Begins Here",
      subtext: "",
      image: "",
      cta: "Explore",
      ctaLink: "#rooms",
      ratio: "50/50",
    },
    propSchema: {
      type: "object",
      required: ["headline", "image"],
      properties: {
        headline: { type: "string", maxLength: 100 },
        subtext: { type: "string", maxLength: 300 },
        image: { type: "string" },
        cta: { type: "string", maxLength: 30 },
        ctaLink: { type: "string" },
        ratio: { type: "string", enum: ["40/60", "50/50", "60/40"] },
      },
    },
    renderTemplate: "hero_editorial",
    categoryAffinity: ["boutique"],
    tierRequirement: 1,
  },
  {
    type: "hero",
    variant: "hero_minimal",
    description: "Clean headline + CTA on solid background",
    defaultProps: {
      headline: "Welcome",
      cta: "Book Now",
      ctaLink: "#booking",
      bgColor: "",
    },
    propSchema: {
      type: "object",
      required: ["headline"],
      properties: {
        headline: { type: "string", maxLength: 80 },
        cta: { type: "string", maxLength: 30 },
        ctaLink: { type: "string" },
        bgColor: { type: "string" },
      },
    },
    renderTemplate: "hero_minimal",
    categoryAffinity: ["business", "budget"],
    tierRequirement: 0,
  },

  // ─── Rooms Variants ───────────────────────────────────
  {
    type: "rooms",
    variant: "rooms_grid",
    description: "Card grid — image, price, amenity icons, CTA",
    defaultProps: {
      columns: 3,
      showPrice: true,
      showAmenities: true,
      cta: "View Room",
    },
    propSchema: {
      type: "object",
      properties: {
        columns: { type: "number", minimum: 2, maximum: 4 },
        showPrice: { type: "boolean" },
        showAmenities: { type: "boolean" },
        cta: { type: "string", maxLength: 30 },
      },
    },
    renderTemplate: "rooms_grid",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },
  {
    type: "rooms",
    variant: "rooms_showcase",
    description: "Full-width carousel with rich detail panels",
    defaultProps: {
      autoplay: false,
      showDetails: true,
      transitionEffect: "slide",
    },
    propSchema: {
      type: "object",
      properties: {
        autoplay: { type: "boolean" },
        showDetails: { type: "boolean" },
        transitionEffect: {
          type: "string",
          enum: ["slide", "fade", "zoom"],
        },
      },
    },
    renderTemplate: "rooms_showcase",
    categoryAffinity: ["luxury", "boutique"],
    tierRequirement: 2,
  },

  // ─── Gallery Variants ─────────────────────────────────
  {
    type: "gallery",
    variant: "gallery_masonry",
    description: "Pinterest-style auto-layout with lightbox",
    defaultProps: {
      columns: 3,
      gap: 8,
      enableLightbox: true,
      filterByTag: "",
    },
    propSchema: {
      type: "object",
      properties: {
        columns: { type: "number", minimum: 2, maximum: 5 },
        gap: { type: "number" },
        enableLightbox: { type: "boolean" },
        filterByTag: { type: "string" },
      },
    },
    renderTemplate: "gallery_masonry",
    categoryAffinity: ["boutique", "resort"],
    tierRequirement: 0,
  },
  {
    type: "gallery",
    variant: "gallery_filmstrip",
    description: "Horizontal scroll with large hero + thumbnails",
    defaultProps: {
      heroSize: "large",
      thumbnailCount: 6,
      autoScroll: false,
    },
    propSchema: {
      type: "object",
      properties: {
        heroSize: { type: "string", enum: ["medium", "large", "full"] },
        thumbnailCount: { type: "number", minimum: 3, maximum: 10 },
        autoScroll: { type: "boolean" },
      },
    },
    renderTemplate: "gallery_filmstrip",
    categoryAffinity: ["luxury"],
    tierRequirement: 1,
  },

  // ─── Booking Variants ─────────────────────────────────
  {
    type: "booking",
    variant: "booking_inline",
    description: "Embedded date picker + room selector widget",
    defaultProps: {
      showRoomSelector: true,
      showGuestCount: true,
      primaryColor: "",
      externalUrl: "",
    },
    propSchema: {
      type: "object",
      properties: {
        showRoomSelector: { type: "boolean" },
        showGuestCount: { type: "boolean" },
        primaryColor: { type: "string" },
        externalUrl: { type: "string" },
      },
    },
    renderTemplate: "booking_inline",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 2,
  },
  {
    type: "booking",
    variant: "booking_sticky",
    description: "Floating bottom bar with quick-book CTA",
    defaultProps: {
      cta: "Check Availability",
      showPrice: true,
      externalUrl: "",
    },
    propSchema: {
      type: "object",
      properties: {
        cta: { type: "string", maxLength: 30 },
        showPrice: { type: "boolean" },
        externalUrl: { type: "string" },
      },
    },
    renderTemplate: "booking_sticky",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 1,
  },

  // ─── Reviews ──────────────────────────────────────────
  {
    type: "reviews",
    variant: "reviews_wall",
    description: "Social-proof wall with aggregated rating",
    defaultProps: {
      maxReviews: 6,
      showRating: true,
      showSource: true,
      layout: "grid",
    },
    propSchema: {
      type: "object",
      properties: {
        maxReviews: { type: "number", minimum: 3, maximum: 12 },
        showRating: { type: "boolean" },
        showSource: { type: "boolean" },
        layout: { type: "string", enum: ["grid", "carousel", "stack"] },
      },
    },
    renderTemplate: "reviews_wall",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── Map ──────────────────────────────────────────────
  {
    type: "map",
    variant: "map_immersive",
    description: "Full-width map with nearby attraction pins",
    defaultProps: {
      zoom: 14,
      showAttractions: true,
      attractionRadius: 2,
      mapStyle: "default",
    },
    propSchema: {
      type: "object",
      properties: {
        zoom: { type: "number", minimum: 10, maximum: 18 },
        showAttractions: { type: "boolean" },
        attractionRadius: { type: "number", description: "km" },
        mapStyle: {
          type: "string",
          enum: ["default", "dark", "satellite"],
        },
      },
    },
    renderTemplate: "map_immersive",
    categoryAffinity: ["resort", "boutique"],
    tierRequirement: 1,
  },

  // ─── Footer ───────────────────────────────────────────
  {
    type: "footer",
    variant: "footer_rich",
    description: "Multi-column with social, newsletter, quick links",
    defaultProps: {
      showNewsletter: true,
      showSocial: true,
      showQuickLinks: true,
      columns: 4,
      copyrightText: "",
    },
    propSchema: {
      type: "object",
      properties: {
        showNewsletter: { type: "boolean" },
        showSocial: { type: "boolean" },
        showQuickLinks: { type: "boolean" },
        columns: { type: "number", minimum: 2, maximum: 4 },
        copyrightText: { type: "string" },
      },
    },
    renderTemplate: "footer_rich",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },
];

/**
 * Get a component definition by variant name.
 */
export function getComponentByVariant(variant: string) {
  return COMPONENT_REGISTRY.find((c) => c.variant === variant);
}

/**
 * Get all components matching a hotel category.
 */
export function getComponentsForCategory(category: string) {
  return COMPONENT_REGISTRY.filter(
    (c) =>
      c.categoryAffinity.includes(category as any) ||
      c.categoryAffinity.includes("budget" as any) // "all" mapped as available to all
  );
}

/**
 * Get all components of a specific type.
 */
export function getComponentsByType(type: string) {
  return COMPONENT_REGISTRY.filter((c) => c.type === type);
}

/**
 * Get all component types available.
 */
export function getComponentTypes(): string[] {
  return [...new Set(COMPONENT_REGISTRY.map((c) => c.type))];
}
