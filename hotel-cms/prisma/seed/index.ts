import { PrismaClient } from "../../src/generated/prisma/client";
import { COMPONENT_REGISTRY } from "../../src/lib/component-registry";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Clear existing data (FK-safe order) ────────────────────────────────
  console.log("Clearing existing data...");
  await prisma.schemaVersion.deleteMany();
  await prisma.hotelContext.deleteMany({});
  await prisma.mediaAsset.deleteMany();
  await prisma.room.deleteMany();
  await prisma.section.deleteMany();
  await prisma.page.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.component.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  console.log("Cleared.");

  // ─── Organization & Admin User ──────────────────────────────────────────
  console.log("Seeding organization and admin...");
  const org = await prisma.organization.create({
    data: { name: "Demo Hotel Group", slug: "demo-hotel-group" }
  });
  const bcryptjs = require("bcryptjs");
  const adminUser = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "admin@hotelcms.com",
      name: "Admin",
      passwordHash: await bcryptjs.hash("admin123", 12),
      role: "admin",
      hotelAccess: [] as any,
    }
  });
  console.log("Created org:", org.name, "| Admin: admin@hotelcms.com / admin123");

  // ─── Component Registry ─────────────────────────────────────────────────
  console.log("Seeding component registry...");
  for (const component of COMPONENT_REGISTRY) {
    await prisma.component.create({
      data: {
        type: component.type,
        variant: component.variant,
        defaultProps: component.defaultProps as any,
        propSchema: component.propSchema as any,
        renderTemplate: component.renderTemplate,
        categoryAffinity: component.categoryAffinity as any,
        tierRequirement: component.tierRequirement,
        description: component.description,
      },
    });
  }
  console.log(`Seeded ${COMPONENT_REGISTRY.length} components.`);

  // ─── Hotel: The Meridian ─────────────────────────────────────────────────
  console.log("Seeding hotel: The Meridian...");
  const hotel = await prisma.hotel.create({
    data: {
      orgId: org.id,
      name: "The Meridian",
      category: "boutique",
      contactInfo: {
        phone: "+91 413 222 3456",
        email: "stay@themeridian.in",
        address: "23 Rue de la Marine, White Town",
        city: "Pondicherry",
        country: "India",
        coordinates: { lat: 11.9344, lng: 79.8297 },
      },
      seoConfig: {
        title: "The Meridian Pondicherry — Boutique Heritage Hotel",
        description:
          "A heritage boutique hotel blending French-Tamil charm with modern luxury in Pondicherry's White Town.",
        keywords: [
          "pondicherry hotel",
          "heritage hotel",
          "boutique hotel",
          "white town",
        ],
      },
      defaultLocale: "en",
    },
  });
  console.log(`Created hotel: ${hotel.name} (${hotel.id})`);

  // ─── Theme ───────────────────────────────────────────────────────────────
  console.log("Seeding theme...");
  await prisma.theme.create({
    data: {
      hotelId: hotel.id,
      colorTokens: {
        primary: "#2d4a3e",
        secondary: "#d4a574",
        accent: "#c17f59",
        bg: "#faf8f5",
        text: "#1a1a1a",
      },
      typography: {
        headingFont: "Cormorant Garamond",
        bodyFont: "DM Sans",
        scale: "medium",
      },
      spacing: "balanced",
      baseTemplate: "boutique",
    },
  });

  // ─── Pages ───────────────────────────────────────────────────────────────
  console.log("Seeding pages...");
  const homePage = await prisma.page.create({
    data: {
      hotelId: hotel.id,
      slug: "/",
      pageType: "home",
      sortOrder: 0,
    },
  });
  const roomsPage = await prisma.page.create({
    data: {
      hotelId: hotel.id,
      slug: "rooms",
      pageType: "rooms",
      sortOrder: 1,
    },
  });
  const galleryPage = await prisma.page.create({
    data: {
      hotelId: hotel.id,
      slug: "gallery",
      pageType: "gallery",
      sortOrder: 2,
    },
  });
  const contactPage = await prisma.page.create({
    data: {
      hotelId: hotel.id,
      slug: "contact",
      pageType: "contact",
      sortOrder: 3,
    },
  });
  console.log("Created 4 pages.");

  // ─── Sections: Home ──────────────────────────────────────────────────────
  console.log("Seeding sections for home page...");
  await prisma.section.createMany({
    data: [
      {
        pageId: homePage.id,
        componentVariant: "hero_editorial",
        sortOrder: 0,
        props: {
          headline: "Where Heritage Meets the Sea",
          subtext:
            "A French-Tamil sanctuary in the heart of Pondicherry's White Town",
          image: "/images/meridian-facade.jpg",
          cta: "Explore Rooms",
          ctaLink: "/rooms",
          ratio: "50/50",
        },
      },
      {
        pageId: homePage.id,
        componentVariant: "rooms_grid",
        sortOrder: 1,
        props: {
          columns: 3,
          showPrice: true,
          showAmenities: true,
          cta: "View Details",
        },
      },
      {
        pageId: homePage.id,
        componentVariant: "gallery_masonry",
        sortOrder: 2,
        props: {
          columns: 3,
          gap: 8,
          enableLightbox: true,
          filterByTag: "",
        },
      },
      {
        pageId: homePage.id,
        componentVariant: "reviews_wall",
        sortOrder: 3,
        props: {
          maxReviews: 6,
          showRating: true,
          showSource: true,
          layout: "grid",
        },
      },
      {
        pageId: homePage.id,
        componentVariant: "booking_sticky",
        sortOrder: 4,
        props: {
          cta: "Check Availability",
          showPrice: true,
          externalUrl: "",
        },
      },
      {
        pageId: homePage.id,
        componentVariant: "footer_rich",
        sortOrder: 5,
        props: {
          showNewsletter: true,
          showSocial: true,
          showQuickLinks: true,
          columns: 4,
          copyrightText: "© 2026 The Meridian. All rights reserved.",
        },
      },
    ],
  });

  // ─── Sections: Rooms ─────────────────────────────────────────────────────
  console.log("Seeding sections for rooms page...");
  await prisma.section.createMany({
    data: [
      {
        pageId: roomsPage.id,
        componentVariant: "hero_minimal",
        sortOrder: 0,
        props: {
          headline: "Our Rooms & Suites",
          cta: "",
          ctaLink: "",
          bgColor: "#2d4a3e",
        },
      },
      {
        pageId: roomsPage.id,
        componentVariant: "rooms_showcase",
        sortOrder: 1,
        props: {
          autoplay: false,
          showDetails: true,
          transitionEffect: "fade",
        },
      },
      {
        pageId: roomsPage.id,
        componentVariant: "footer_rich",
        sortOrder: 2,
        props: {},
      },
    ],
  });

  // ─── Sections: Gallery ───────────────────────────────────────────────────
  console.log("Seeding sections for gallery page...");
  await prisma.section.createMany({
    data: [
      {
        pageId: galleryPage.id,
        componentVariant: "hero_minimal",
        sortOrder: 0,
        props: {
          headline: "Gallery",
          cta: "",
          ctaLink: "",
          bgColor: "#2d4a3e",
        },
      },
      {
        pageId: galleryPage.id,
        componentVariant: "gallery_masonry",
        sortOrder: 1,
        props: {
          columns: 4,
          gap: 6,
          enableLightbox: true,
          filterByTag: "",
        },
      },
      {
        pageId: galleryPage.id,
        componentVariant: "footer_rich",
        sortOrder: 2,
        props: {},
      },
    ],
  });

  // ─── Sections: Contact ───────────────────────────────────────────────────
  console.log("Seeding sections for contact page...");
  await prisma.section.createMany({
    data: [
      {
        pageId: contactPage.id,
        componentVariant: "hero_minimal",
        sortOrder: 0,
        props: {
          headline: "Get in Touch",
          cta: "",
          ctaLink: "",
          bgColor: "#2d4a3e",
        },
      },
      {
        pageId: contactPage.id,
        componentVariant: "map_immersive",
        sortOrder: 1,
        props: {
          zoom: 15,
          showAttractions: true,
          attractionRadius: 2,
          mapStyle: "default",
        },
      },
      {
        pageId: contactPage.id,
        componentVariant: "footer_rich",
        sortOrder: 2,
        props: {},
      },
    ],
  });

  // ─── Rooms ───────────────────────────────────────────────────────────────
  console.log("Seeding rooms...");
  await prisma.room.createMany({
    data: [
      {
        hotelId: hotel.id,
        name: "Heritage Suite",
        pricing: { basePrice: 12000, currency: "INR" },
        amenities: ["wifi", "ac", "minibar", "bathtub", "balcony", "sea-view"],
        maxGuests: 2,
        sortOrder: 0,
      },
      {
        hotelId: hotel.id,
        name: "Colonial Room",
        pricing: { basePrice: 8000, currency: "INR" },
        amenities: ["wifi", "ac", "minibar"],
        maxGuests: 2,
        sortOrder: 1,
      },
      {
        hotelId: hotel.id,
        name: "Garden Suite",
        pricing: { basePrice: 15000, currency: "INR" },
        amenities: [
          "wifi",
          "ac",
          "minibar",
          "bathtub",
          "garden-access",
          "private-pool",
        ],
        maxGuests: 3,
        sortOrder: 2,
      },
      {
        hotelId: hotel.id,
        name: "Courtyard Room",
        pricing: { basePrice: 6000, currency: "INR" },
        amenities: ["wifi", "ac", "courtyard-view"],
        maxGuests: 2,
        sortOrder: 3,
      },
    ],
  });
  console.log("Created 4 rooms.");

  // ─── Media Assets ────────────────────────────────────────────────────────
  console.log("Seeding media assets...");
  await prisma.mediaAsset.createMany({
    data: [
      {
        hotelId: hotel.id,
        url: "/images/meridian-facade.jpg",
        altText: "The Meridian hotel facade — White Town, Pondicherry",
        tags: ["facade", "exterior"],
      },
      {
        hotelId: hotel.id,
        url: "/images/meridian-lobby.jpg",
        altText: "The Meridian elegant lobby interior",
        tags: ["lobby", "interior"],
      },
      {
        hotelId: hotel.id,
        url: "/images/meridian-heritage-suite.jpg",
        altText: "Heritage Suite with sea view and colonial furnishings",
        tags: ["room", "heritage-suite"],
      },
      {
        hotelId: hotel.id,
        url: "/images/meridian-pool.jpg",
        altText: "Private pool surrounded by lush garden",
        tags: ["pool", "garden"],
      },
      {
        hotelId: hotel.id,
        url: "/images/meridian-restaurant.jpg",
        altText: "In-house restaurant with French-Tamil cuisine",
        tags: ["restaurant", "dining"],
      },
      {
        hotelId: hotel.id,
        url: "/images/meridian-colonial-room.jpg",
        altText: "Colonial Room with period-appropriate decor",
        tags: ["room", "colonial-room"],
      },
    ],
  });
  console.log("Created 6 media assets.");

  // ─── Schema Version ──────────────────────────────────────────────────────
  console.log("Seeding initial schema version...");
  await prisma.schemaVersion.create({
    data: {
      hotelId: hotel.id,
      versionNum: 1,
      diffPatch: [],
      snapshot: {},
      status: "published",
      description: "Initial hotel setup",
      modelTier: 3,
      modelUsed: "opus",
    },
  });
  console.log("Created schema version v1.");

  console.log("Seeding hotel context...");
  await prisma.hotelContext.create({
    data: {
      hotelId: hotel.id,
      brandVoice: "warm, personal, understated luxury with French-Tamil heritage charm",
      styleNotes: "Earth tones, heritage architecture, romantic atmosphere. Serif headings (Cormorant Garamond), clean body text (DM Sans).",
      pastDecisions: [] as any,
      preferences: {
        colorPreference: "warm earth tones",
        typography: "serif headings, sans body",
        mood: "romantic, heritage, boutique",
      } as any,
      renderedHtml: {} as any,
      renderedCss: "",
    },
  });
  console.log("Created hotel context.");

  console.log("✅ Seed complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
