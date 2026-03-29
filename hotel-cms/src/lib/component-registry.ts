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
      ctaLink: "{{booking}}",
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
      ctaLink: "{{booking}}",
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
      ctaLink: "{{booking}}",
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
      externalUrl: "{{booking}}",
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
      externalUrl: "{{booking}}",
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

  // ─── Dining ───────────────────────────────────────────
  {
    type: "dining",
    variant: "dining_showcase",
    description: "Restaurant section with menu highlights, chef info, and reservation CTA",
    defaultProps: {
      restaurantName: "The Restaurant",
      description: "Experience exceptional cuisine crafted with locally sourced ingredients.",
      cuisine: "International",
      hours: "7:00 AM – 11:00 PM",
      chefName: "",
      chefTitle: "",
      menuHighlights: [],
      image: "",
      reservationLink: "{{booking}}",
    },
    propSchema: {
      type: "object",
      properties: {
        restaurantName: { type: "string" },
        description: { type: "string" },
        cuisine: { type: "string" },
        hours: { type: "string" },
        menuHighlights: { type: "array" },
        image: { type: "string" },
        reservationLink: { type: "string" },
      },
    },
    renderTemplate: "dining_showcase",
    categoryAffinity: ["luxury", "boutique", "resort"],
    tierRequirement: 0,
  },

  // ─── Amenities ────────────────────────────────────────
  {
    type: "amenities",
    variant: "amenities_grid",
    description: "Icon-based grid of hotel amenities and services",
    defaultProps: {
      title: "Hotel Amenities",
      subtitle: "Everything you need for a comfortable stay",
      amenities: [
        { name: "Swimming Pool", icon: "🏊", description: "Outdoor pool with sun loungers" },
        { name: "Fitness Center", icon: "💪", description: "24/7 gym with modern equipment" },
        { name: "Free Wi-Fi", icon: "📶", description: "High-speed internet throughout" },
        { name: "Spa & Wellness", icon: "🧖", description: "Full-service spa" },
        { name: "Restaurant", icon: "🍽", description: "On-site dining" },
        { name: "Concierge", icon: "🛎", description: "24-hour concierge service" },
      ],
      columns: 3,
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        amenities: { type: "array" },
        columns: { type: "number", minimum: 2, maximum: 4 },
      },
    },
    renderTemplate: "amenities_grid",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── Contact ──────────────────────────────────────────
  {
    type: "contact",
    variant: "contact_form",
    description: "Contact inquiry form with hotel info sidebar",
    defaultProps: {
      title: "Get in Touch",
      subtitle: "We'd love to hear from you",
      submitLabel: "Send Message",
      successMessage: "Thank you! We'll get back to you shortly.",
      showDates: true,
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        submitLabel: { type: "string" },
        successMessage: { type: "string" },
        showDates: { type: "boolean" },
      },
    },
    renderTemplate: "contact_form",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── FAQ ──────────────────────────────────────────────
  {
    type: "faq",
    variant: "faq_accordion",
    description: "Collapsible FAQ section with questions and answers",
    defaultProps: {
      title: "Frequently Asked Questions",
      subtitle: "",
      items: [
        { question: "What are the check-in and check-out times?", answer: "Check-in is at 2:00 PM and check-out is at 11:00 AM." },
        { question: "Is parking available?", answer: "Yes, we offer complimentary valet parking for all guests." },
        { question: "Do you allow pets?", answer: "We welcome well-behaved pets. Please inform us at booking." },
        { question: "What is your cancellation policy?", answer: "Free cancellation up to 48 hours before check-in." },
      ],
      defaultOpen: 0,
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        items: { type: "array" },
        defaultOpen: { type: "number" },
      },
    },
    renderTemplate: "faq_accordion",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── CTA ──────────────────────────────────────────────
  {
    type: "cta",
    variant: "cta_banner",
    description: "Full-width promotional banner with headline and CTA button",
    defaultProps: {
      headline: "Book Direct & Save",
      description: "Get 15% off when you book directly on our website",
      ctaText: "Book Now",
      ctaLink: "{{booking}}",
      bgColor: "#1a1a2e",
      textColor: "#ffffff",
      alignment: "center",
    },
    propSchema: {
      type: "object",
      properties: {
        headline: { type: "string" },
        description: { type: "string" },
        ctaText: { type: "string" },
        ctaLink: { type: "string" },
        bgColor: { type: "string" },
        textColor: { type: "string" },
        alignment: { type: "string", enum: ["left", "center", "right"] },
      },
    },
    renderTemplate: "cta_banner",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── Spa & Wellness ───────────────────────────────────
  {
    type: "spa",
    variant: "spa_wellness",
    description: "Serene split-layout spa section with treatment cards and booking CTA",
    defaultProps: {
      title: "Spa & Wellness",
      subtitle: "A sanctuary of calm where every treatment is a journey inward.",
      treatments: [],
      image: "",
      bookingLink: "{{booking}}",
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        treatments: { type: "array", description: "Array of {name, duration, price, description}" },
        image: { type: "string" },
        bookingLink: { type: "string" },
      },
    },
    renderTemplate: "spa_wellness",
    categoryAffinity: ["luxury", "boutique", "resort"],
    tierRequirement: 0,
  },

  // ─── Events & Venues ──────────────────────────────────
  {
    type: "events",
    variant: "events_venues",
    description: "Professional venue cards with capacity, area, feature pills, and inquiry CTA",
    defaultProps: {
      title: "Events & Meetings",
      subtitle: "Versatile spaces designed to elevate every occasion.",
      venues: [],
      inquiryLink: "{{email}}",
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        venues: { type: "array", description: "Array of {name, capacity, area, features, image}" },
        inquiryLink: { type: "string" },
      },
    },
    renderTemplate: "events_venues",
    categoryAffinity: ["business", "luxury", "resort"],
    tierRequirement: 0,
  },

  // ─── Team Spotlight ───────────────────────────────────
  {
    type: "team",
    variant: "team_spotlight",
    description: "Warm team grid with circular photos, names, titles, and short bios",
    defaultProps: {
      title: "Meet Our Team",
      subtitle: "The passionate people behind every exceptional stay.",
      members: [
        { name: "Sarah Johnson", title: "General Manager", bio: "With 15 years in hospitality, Sarah brings warmth and expertise to every guest experience.", image: "" },
        { name: "Chef Marco", title: "Executive Chef", bio: "Award-winning chef crafting unforgettable culinary journeys with local ingredients.", image: "" },
        { name: "Priya Patel", title: "Spa Director", bio: "Certified wellness expert dedicated to creating transformative relaxation experiences.", image: "" },
      ],
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        members: { type: "array", description: "Array of {name, title, bio, image}" },
      },
    },
    renderTemplate: "team_spotlight",
    categoryAffinity: ["boutique", "luxury"],
    tierRequirement: 0,
  },

  // ─── Testimonial Carousel ─────────────────────────────
  {
    type: "testimonial",
    variant: "testimonial_carousel",
    description: "Elegant dark-background testimonial slider with stars, quotes, and dot navigation",
    defaultProps: {
      title: "What Our Guests Say",
      testimonials: [
        { quote: "An absolutely magical experience. The attention to detail was extraordinary.", author: "Sophie M.", location: "Paris, France", rating: 5 },
        { quote: "The perfect blend of luxury and warmth. We felt truly at home.", author: "James K.", location: "London, UK", rating: 5 },
        { quote: "From the stunning rooms to the incredible dining, everything exceeded expectations.", author: "Elena V.", location: "Milan, Italy", rating: 5 },
      ],
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        testimonials: { type: "array", description: "Array of {quote, author, location, rating}" },
      },
    },
    renderTemplate: "testimonial_carousel",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── Nearby Attractions ───────────────────────────────
  {
    type: "attractions",
    variant: "nearby_attractions",
    description: "Clean attraction cards with auto-emoji by category, distance badges, and optional map",
    defaultProps: {
      title: "Explore the Area",
      subtitle: "Discover what makes our neighbourhood so special.",
      attractions: [
        { name: "White Town Heritage Walk", category: "culture", distance: "0.5 km", description: "French colonial architecture and colorful streets.", link: "" },
        { name: "Promenade Beach", category: "beach", distance: "1.2 km", description: "Scenic waterfront perfect for morning walks.", link: "" },
        { name: "Auroville", category: "nature", distance: "12 km", description: "Universal township and Matrimandir.", link: "" },
      ],
      showMap: false,
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        attractions: { type: "array", description: "Array of {name, category, distance, description, link}" },
        showMap: { type: "boolean" },
      },
    },
    renderTemplate: "nearby_attractions",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── Pricing Table ────────────────────────────────────
  {
    type: "pricing",
    variant: "pricing_table",
    description: "Horizontal room-plan comparison cards with feature checklists, popular badge, and CTA buttons",
    defaultProps: {
      title: "Compare Our Rooms",
      subtitle: "",
      rooms: [
        { name: "Standard", price: "150", currency: "USD", period: "night", features: ["Free Wi-Fi", "City View", "Breakfast", "24/7 Room Service"], highlighted: false, ctaText: "Book Now", ctaLink: "{{booking}}" },
        { name: "Deluxe", price: "280", currency: "USD", period: "night", features: ["Free Wi-Fi", "Ocean View", "Breakfast & Dinner", "Spa Access", "Airport Transfer"], highlighted: true, ctaText: "Book Now", ctaLink: "{{booking}}" },
        { name: "Suite", price: "520", currency: "USD", period: "night", features: ["Free Wi-Fi", "Panoramic View", "All Meals", "Spa Access", "Airport Transfer", "Butler Service", "Private Terrace"], highlighted: false, ctaText: "Book Now", ctaLink: "{{booking}}" },
      ],
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        rooms: { type: "array", description: "Array of {name, price, currency, period, features, highlighted, ctaText, ctaLink}" },
      },
    },
    renderTemplate: "pricing_table",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── Social Feed ──────────────────────────────────────
  {
    type: "social",
    variant: "social_feed",
    description: "Instagram-style image grid with hover caption overlay and follow link",
    defaultProps: {
      title: "Follow Our Journey",
      subtitle: "",
      platform: "instagram",
      handle: "ourhotel",
      columns: 3,
      posts: [
        { imageUrl: "", caption: "Sunset views from the rooftop terrace 🌅", link: "" },
        { imageUrl: "", caption: "Fresh catch of the day at our restaurant 🐟", link: "" },
        { imageUrl: "", caption: "Morning yoga by the pool 🧘", link: "" },
        { imageUrl: "", caption: "Our signature cocktail — The Meridian Sunset 🍹", link: "" },
        { imageUrl: "", caption: "Heritage architecture meets modern luxury ✨", link: "" },
        { imageUrl: "", caption: "Spa day essentials 🌿", link: "" },
      ],
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        platform: { type: "string" },
        handle: { type: "string" },
        columns: { type: "number", minimum: 2, maximum: 4 },
        posts: { type: "array", description: "Array of {imageUrl, caption, link}" },
      },
    },
    renderTemplate: "social_feed",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── Countdown Promo ──────────────────────────────────
  {
    type: "promo",
    variant: "countdown_promo",
    description: "Full-width colored promo banner with live countdown timer and CTA button",
    defaultProps: {
      title: "Special Offer",
      description: "Exclusive rate for a limited time only. Book now to secure the best price.",
      endDate: "",
      ctaText: "Book Before It's Gone",
      ctaLink: "{{booking}}",
      bgColor: "#e85d45",
      textColor: "#ffffff",
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        endDate: { type: "string", description: "ISO date string for offer expiry" },
        ctaText: { type: "string" },
        ctaLink: { type: "string" },
        bgColor: { type: "string" },
        textColor: { type: "string" },
      },
    },
    renderTemplate: "countdown_promo",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
  },

  // ─── Video Section ────────────────────────────────────
  {
    type: "video",
    variant: "video_section",
    description: "Cinematic dark video section with YouTube/Vimeo embed, full-width or split layout",
    defaultProps: {
      title: "",
      subtitle: "",
      videoUrl: "",
      posterImage: "",
      layout: "full",
      description: "",
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        videoUrl: { type: "string", description: "YouTube, Vimeo, or direct .mp4 URL" },
        posterImage: { type: "string" },
        layout: { type: "string", enum: ["full", "split"] },
        description: { type: "string" },
      },
    },
    renderTemplate: "video_section",
    categoryAffinity: ["luxury", "boutique", "resort"],
    tierRequirement: 0,
  },

  // ─── Blog Preview ─────────────────────────────────────
  {
    type: "blog",
    variant: "blog_preview",
    description: "Editorial blog post grid with category badges, excerpts, dates, and read more links",
    defaultProps: {
      title: "Latest Stories",
      subtitle: "",
      columns: 3,
      posts: [
        { title: "10 Hidden Gems Near Our Hotel", excerpt: "Discover the secret spots that only locals know about, from tucked-away cafes to serene gardens.", date: "2026-03-15", category: "Travel Guide", image: "", link: "" },
        { title: "A Culinary Journey Through Local Flavors", excerpt: "Our chef shares the inspiration behind our signature dishes and the local ingredients that make them special.", date: "2026-03-10", category: "Dining", image: "", link: "" },
        { title: "Wellness Retreat: Mind, Body & Soul", excerpt: "Experience our new holistic wellness program designed to rejuvenate every aspect of your being.", date: "2026-03-05", category: "Wellness", image: "", link: "" },
      ],
    },
    propSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        columns: { type: "number", minimum: 2, maximum: 4 },
        posts: { type: "array", description: "Array of {title, excerpt, date, category, image, link}" },
      },
    },
    renderTemplate: "blog_preview",
    categoryAffinity: ["luxury", "boutique", "business", "resort", "budget"],
    tierRequirement: 0,
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
