import HeroCinematic from "./variants/HeroCinematic";
import HeroEditorial from "./variants/HeroEditorial";
import HeroMinimal from "./variants/HeroMinimal";
import RoomsGrid from "./variants/RoomsGrid";
import RoomsShowcase from "./variants/RoomsShowcase";
import GalleryMasonry from "./variants/GalleryMasonry";
import GalleryFilmstrip from "./variants/GalleryFilmstrip";
import BookingInline from "./variants/BookingInline";
import BookingSticky from "./variants/BookingSticky";
import ReviewsWall from "./variants/ReviewsWall";
import MapImmersive from "./variants/MapImmersive";
import FooterRich from "./variants/FooterRich";
import DiningShowcase from "./variants/DiningShowcase";
import AmenitiesGrid from "./variants/AmenitiesGrid";
import ContactForm from "./variants/ContactForm";
import FaqAccordion from "./variants/FaqAccordion";
import CtaBanner from "./variants/CtaBanner";
import SpaWellness from "./variants/SpaWellness";
import EventsVenues from "./variants/EventsVenues";
import TeamSpotlight from "./variants/TeamSpotlight";
import TestimonialCarousel from "./variants/TestimonialCarousel";
import NearbyAttractions from "./variants/NearbyAttractions";
import PricingTable from "./variants/PricingTable";
import SocialFeed from "./variants/SocialFeed";
import CountdownPromo from "./variants/CountdownPromo";
import VideoSection from "./variants/VideoSection";
import BlogPreview from "./variants/BlogPreview";

export interface SectionData {
  id: string;
  componentVariant: string;
  props: Record<string, unknown>;
  sortOrder: number;
  isVisible: boolean;
  customCss?: string | null;
  customHtml?: string | null;
  customMode?: boolean;
}

interface RenderSectionProps {
  section: SectionData;
}

export default function RenderSection({ section }: RenderSectionProps) {
  if (!section.isVisible) return null;

  // Custom mode: render raw HTML directly, bypass component
  if (section.customMode && section.customHtml) {
    return (
      <div
        data-section-id={section.id}
        data-custom-mode="true"
        dangerouslySetInnerHTML={{ __html: section.customHtml }}
      />
    );
  }

  const props = section.props as Record<string, any>;

  let rendered: React.ReactNode;

  switch (section.componentVariant) {
    case "hero_cinematic":
      rendered = <HeroCinematic {...props} />;
      break;

    case "hero_editorial":
      rendered = <HeroEditorial {...props} />;
      break;

    case "hero_minimal":
      rendered = <HeroMinimal {...props} />;
      break;

    case "rooms_grid":
      rendered = <RoomsGrid {...props} />;
      break;

    case "rooms_showcase":
      rendered = <RoomsShowcase {...props} />;
      break;

    case "gallery_masonry":
      rendered = <GalleryMasonry {...props} />;
      break;

    case "gallery_filmstrip":
      rendered = <GalleryFilmstrip {...props} />;
      break;

    case "booking_inline":
      rendered = <BookingInline {...props} />;
      break;

    case "booking_sticky":
      rendered = <BookingSticky {...props} />;
      break;

    case "reviews_wall":
      rendered = <ReviewsWall {...props} />;
      break;

    case "map_immersive":
      rendered = <MapImmersive {...props} />;
      break;

    case "footer_rich":
      rendered = <FooterRich {...props} />;
      break;

    case "dining_showcase":
      rendered = <DiningShowcase {...props} />;
      break;

    case "amenities_grid":
      rendered = <AmenitiesGrid {...props} />;
      break;

    case "contact_form":
      rendered = <ContactForm {...props} />;
      break;

    case "faq_accordion":
      rendered = <FaqAccordion {...props} />;
      break;

    case "cta_banner":
      rendered = <CtaBanner {...props} />;
      break;

    case "spa_wellness":
      rendered = <SpaWellness {...props} />;
      break;

    case "events_venues":
      rendered = <EventsVenues {...props} />;
      break;

    case "team_spotlight":
      rendered = <TeamSpotlight {...props} />;
      break;

    case "testimonial_carousel":
      rendered = <TestimonialCarousel {...props} />;
      break;

    case "nearby_attractions":
      rendered = <NearbyAttractions {...props} />;
      break;

    case "pricing_table":
      rendered = <PricingTable {...props} />;
      break;

    case "social_feed":
      rendered = <SocialFeed {...props} />;
      break;

    case "countdown_promo":
      rendered = <CountdownPromo {...props} />;
      break;

    case "video_section":
      rendered = <VideoSection {...props} />;
      break;

    case "blog_preview":
      rendered = <BlogPreview {...props} />;
      break;

    default:
      if (process.env.NODE_ENV === "development") {
        rendered = (
          <div className="p-6 border-2 border-dashed border-amber-300 bg-amber-50 text-amber-800 text-sm m-4 rounded">
            <strong>Unknown component variant:</strong>{" "}
            <code className="font-mono">{section.componentVariant}</code>
          </div>
        );
      } else {
        rendered = null;
      }
  }

  // Enhanced mode: component renders normally + custom CSS injected
  if (section.customCss) {
    // If the CSS doesn't contain a selector (just raw properties), wrap it
    // in a selector targeting this section's wrapper div
    const sectionId = `section-${section.id}`;
    let scopedCss = section.customCss.trim();
    // Add !important to all property values so they override inline styles
    const addImportant = (css: string) =>
      css.replace(/;/g, " !important;").replace(/!important\s*!important/g, "!important");

    if (!scopedCss.includes("{")) {
      // Raw properties like "background: blue; color: white;"
      const importantCss = addImportant(scopedCss);
      const bgReset = scopedCss.includes("background") ? "background-image: none !important;" : "";
      // Apply to the wrapper section element only (not descendants — avoids breaking child layout)
      scopedCss = `#${sectionId} > section, #${sectionId} > div, #${sectionId} { ${importantCss} ${bgReset} }`;
    } else {
      // Has selectors — prefix every rule with #sectionId to scope it
      scopedCss = scopedCss.replace(
        /([^{}]+)\{/g,
        (_, selector) => `#${sectionId} ${selector.trim()} {`
      );
      scopedCss = addImportant(scopedCss);
    }

    return (
      <div id={sectionId} data-section-id={section.id}>
        <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
        {rendered}
      </div>
    );
  }

  return rendered;
}
