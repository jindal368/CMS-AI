# Tier 1 Components — Design Spec

**Goal:** Add 5 essential components that fill the biggest gaps in hotel website building: dining, amenities, contact form, FAQ, and CTA banner.

**Components:** dining_showcase, amenities_grid, contact_form, faq_accordion, cta_banner. All Tier 0, all categories.

---

## 1. dining_showcase

**Type:** dining | **Tier:** 0 | **Categories:** luxury, boutique, resort

**Props:**
- restaurantName: string — "The Rooftop"
- description: string — "French-Tamil fusion cuisine..."
- cuisine: string — "French-Tamil Fusion"
- hours: string — "7:00 AM – 11:00 PM"
- chefName: string — "Chef Antoine"
- chefTitle: string — "Executive Chef"
- menuHighlights: array of { dish: string, price: string, description: string }
- image: string — restaurant image URL
- reservationLink: string — "{{booking}}" or custom URL

**Layout:** Split layout. Left: restaurant name (heading), cuisine badge, description, hours, chef name/title. Right: ambiance image. Below: menu highlights as cards in a 2-3 column grid (dish name, price badge, description). Bottom: "Reserve a Table" CTA button.

**Render template:** `dining_showcase`

---

## 2. amenities_grid

**Type:** amenities | **Tier:** 0 | **Categories:** all

**Props:**
- title: string — "Hotel Amenities"
- subtitle: string — "Everything you need for a comfortable stay"
- amenities: array of { name: string, icon: string (emoji), description: string }
- columns: number (2-4) — default 3

**Default amenities:**
```json
[
  { "name": "Swimming Pool", "icon": "🏊", "description": "Outdoor infinity pool with sun loungers" },
  { "name": "Fitness Center", "icon": "💪", "description": "24/7 gym with modern equipment" },
  { "name": "Free Wi-Fi", "icon": "📶", "description": "High-speed internet throughout" },
  { "name": "Spa & Wellness", "icon": "🧖", "description": "Full-service spa with treatments" },
  { "name": "Restaurant", "icon": "🍽", "description": "On-site dining with local cuisine" },
  { "name": "Concierge", "icon": "🛎", "description": "24-hour concierge service" }
]
```

**Layout:** Section header (title + subtitle) + responsive grid of amenity cards. Each card: large emoji icon, name (bold), description (muted). Clean, minimal.

**Render template:** `amenities_grid`

---

## 3. contact_form

**Type:** contact | **Tier:** 0 | **Categories:** all

**Props:**
- title: string — "Get in Touch"
- subtitle: string — "We'd love to hear from you"
- submitLabel: string — "Send Message"
- successMessage: string — "Thank you! We'll get back to you shortly."
- showDates: boolean — true (show check-in/check-out date fields)

**Layout:** Two-column on desktop, stacked on mobile. Left: form with name, email, phone, check-in date, check-out date (if showDates), message textarea, submit button. Right: hotel contact info (address, phone, email) pulled from component props or hotel data passed via enrichment.

**Note:** Form is display-only for v1 — shows success message on submit, does not actually send email. Backend email integration is out of scope.

**"use client"** component (needs useState for form state + submission).

**Render template:** `contact_form`

---

## 4. faq_accordion

**Type:** faq | **Tier:** 0 | **Categories:** all

**Props:**
- title: string — "Frequently Asked Questions"
- subtitle: string — ""
- items: array of { question: string, answer: string }
- defaultOpen: number — 0 (index of initially open item, -1 for all closed)

**Default items:**
```json
[
  { "question": "What are the check-in and check-out times?", "answer": "Check-in is at 2:00 PM and check-out is at 11:00 AM." },
  { "question": "Is parking available?", "answer": "Yes, we offer complimentary valet parking for all guests." },
  { "question": "Do you allow pets?", "answer": "We welcome well-behaved pets. Please inform us at the time of booking." },
  { "question": "What is your cancellation policy?", "answer": "Free cancellation up to 48 hours before check-in." }
]
```

**Layout:** Section header + vertical list of accordion items. Each: question text (clickable, bold) + expand/collapse icon (+/−). Answer revealed/hidden on click with smooth transition.

**"use client"** component (needs useState for open item tracking).

**Render template:** `faq_accordion`

---

## 5. cta_banner

**Type:** cta | **Tier:** 0 | **Categories:** all

**Props:**
- headline: string — "Book Direct & Save"
- description: string — "Get 15% off when you book directly on our website"
- ctaText: string — "Book Now"
- ctaLink: string — "{{booking}}"
- bgColor: string — "#1a1a2e" (dark default)
- textColor: string — "#ffffff"
- alignment: string — "center" (left/center/right)

**Layout:** Full-width section with background color. Headline (large), description (smaller, muted), CTA button (contrasting). Alignment configurable. Simple, bold, used mid-page for promotions.

**Render template:** `cta_banner`

---

## Files to Create / Modify

### New variant components (5)
- `src/components/renderer/variants/DiningShowcase.tsx`
- `src/components/renderer/variants/AmenitiesGrid.tsx`
- `src/components/renderer/variants/ContactForm.tsx`
- `src/components/renderer/variants/FaqAccordion.tsx`
- `src/components/renderer/variants/CtaBanner.tsx`

### Modified files
- `src/lib/component-registry.ts` — add 5 entries to COMPONENT_REGISTRY
- `src/components/renderer/RenderSection.tsx` — add 5 cases to the switch
