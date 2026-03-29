# Smart Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded `#booking` and `#` links across all components with a smart token system (`{{booking}}`, `{{phone}}`, etc.) that resolves to real URLs from a central hotel-level link registry.

**Architecture:** New `links` JSON field on Hotel stores the link registry. A resolver utility walks component props and replaces `{{tokens}}` with real URLs at render time. Components receive resolved URLs — no component code changes needed for resolution. Registry is editable via a Links Editor in the CMS.

**Tech Stack:** Prisma JSON field, utility module for token resolution, React server component prop transformation.

---

### Task 1: Prisma schema — add links field to Hotel

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add links field to Hotel model**

Read `prisma/schema.prisma`. Add to the Hotel model (after `seoConfig`):

```prisma
  links     Json          @default("{}") @map("links")
```

- [ ] **Step 2: Run migration**

Run: `cd /home/vishesh/personal/cms/hotel-cms && npx prisma migrate dev --name add-hotel-links`

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 2: Smart link resolver utility

**Files:**
- Create: `src/lib/smart-links.ts`

- [ ] **Step 1: Create resolver module**

Create `src/lib/smart-links.ts` with these exports:

```typescript
export interface HotelLinkData {
  id: string;
  links: Record<string, string>;
  contactInfo: Record<string, any>;
}
```

**`resolveSmartLink(token: string, hotel: HotelLinkData): string`**

If the string doesn't contain `{{`, return as-is (passthrough for raw URLs).

Otherwise extract the token name from `{{...}}` and resolve:

- `{{booking}}` → `hotel.links.booking || "#"`
- `{{phone}}` → if links.phone === "auto" or absent, derive `tel:${contactInfo.phone?.replace(/\s/g, "")}`. If links.phone is a custom value, use it. If no phone available, return `#`.
- `{{email}}` → if "auto", derive `mailto:${contactInfo.email}`. Custom override or `#`.
- `{{maps}}` → if "auto", check contactInfo.coordinates: if exists → `https://www.google.com/maps?q=${lat},${lng}`. Else use address: `https://www.google.com/maps/search/${encodeURIComponent(address + " " + city + " " + country)}`. Custom override or `#`.
- `{{whatsapp}}` → if set, `https://wa.me/${number.replace(/[^0-9]/g, "")}`. Else `#`.
- `{{instagram}}`, `{{facebook}}`, `{{twitter}}` → direct from links, or `#`.
- `{{page:slug}}` → `/preview/${hotel.id}/${slug === "/" ? "home" : slug}`.
- Unknown tokens → return `#`.

**`resolvePropsLinks(props: Record<string, unknown>, hotel: HotelLinkData): Record<string, unknown>`**

Walk all values in the props object. For string values, run through `resolveSmartLink`. For nested objects, recurse. For arrays, map. Non-string primitives pass through.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 3: Update component defaults + fix hardcoded links

**Files:**
- Modify: `src/lib/component-registry.ts`
- Modify: `src/components/renderer/variants/BookingSticky.tsx`
- Modify: `src/components/renderer/variants/RoomsGrid.tsx`
- Modify: `src/components/renderer/variants/RoomsShowcase.tsx`
- Modify: `src/components/renderer/variants/FooterRich.tsx`

- [ ] **Step 1: Update component registry defaults**

Read `src/lib/component-registry.ts`. Update defaultProps for these components:

- `hero_cinematic`: change `ctaLink: "#booking"` → `ctaLink: "{{booking}}"`
- `hero_editorial`: change `ctaLink: "#rooms"` → `ctaLink: "{{booking}}"`
- `hero_minimal`: change `ctaLink: "#booking"` → `ctaLink: "{{booking}}"`
- `booking_inline`: change `externalUrl: ""` → `externalUrl: "{{booking}}"`
- `booking_sticky`: change `externalUrl: ""` → `externalUrl: "{{booking}}"`

- [ ] **Step 2: Fix BookingSticky hardcoded phone**

Read `src/components/renderer/variants/BookingSticky.tsx`. Find the hardcoded `href="tel:+1800000000"`. Change it to use a `phoneLink` prop:

Add `phoneLink?: string` to the props interface with default `"#"`. Replace the hardcoded href with `href={phoneLink || "#"}`. The preview page will pass the resolved `{{phone}}` token as this prop.

- [ ] **Step 3: Fix RoomsGrid hardcoded booking link**

Read `src/components/renderer/variants/RoomsGrid.tsx`. Find `href="#booking"` on the room card CTA links. The component already has a `cta` prop for button text. Add `ctaLink?: string` prop with default `"#"`. Replace `href="#booking"` with `href={ctaLink || "#"}`.

- [ ] **Step 4: Fix RoomsShowcase hardcoded booking link**

Read `src/components/renderer/variants/RoomsShowcase.tsx`. Same pattern — find `href="#booking"`, add `ctaLink?: string` prop, replace hardcoded href.

- [ ] **Step 5: Fix FooterRich social links**

Read `src/components/renderer/variants/FooterRich.tsx`. The `socialLinks` array is hardcoded with `href: "#"`. Change the component to accept social link props: `instagramUrl?: string`, `facebookUrl?: string`, `twitterUrl?: string`. Use these in the social links rendering instead of the hardcoded array. Default to `"#"` if not provided.

Also update the quickLinks arrays to accept link props or use tokens. For now, keep the existing `#rooms`, `#dining` etc. as-is — they'll be resolved by the renderer in Task 4.

- [ ] **Step 6: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---

### Task 4: Renderer integration

**Files:**
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx`

- [ ] **Step 1: Add smart link resolution to preview renderer**

Read `src/app/preview/[hotelId]/[pageSlug]/page.tsx`. Import `resolvePropsLinks` from `@/lib/smart-links`.

After the section props enrichment (where rooms/media/hotel data is injected into section props), add smart link resolution:

```typescript
import { resolvePropsLinks, HotelLinkData } from "@/lib/smart-links";

// Build hotel link data for resolver
const hotelLinkData: HotelLinkData = {
  id: hotel.id,
  links: (hotel.links as Record<string, string>) || {},
  contactInfo: (hotel.contactInfo as Record<string, any>) || {},
};

// For each section, after enriching props:
const resolvedProps = resolvePropsLinks(enrichedProps, hotelLinkData);
```

Apply `resolvePropsLinks` to every section's props before they're passed to the renderer. This goes in the `.map()` where sections are built.

Also inject social links and phone link into specific components:
- `footer_rich` sections: add `instagramUrl: resolveSmartLink("{{instagram}}", hotelLinkData)`, same for facebook, twitter
- `booking_sticky` sections: add `phoneLink: resolveSmartLink("{{phone}}", hotelLinkData)`

- [ ] **Step 2: Verify build and test**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

Test: visit `/preview/[hotelId]/home` and inspect links in the rendered page — CTA buttons should show resolved URLs or `#` if not configured.

---

### Task 5: CMS Links Editor UI

**Files:**
- Create: `src/components/cms/LinksEditor.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx`

- [ ] **Step 1: Create LinksEditor component**

`src/components/cms/LinksEditor.tsx` — "use client" component.

Props: `{ hotelId: string, links: Record<string, string>, contactInfo: Record<string, any> }`.

Form with labeled fields. Each field has a label, input, and helper text:

- **Booking URL**: text input, placeholder "https://booking.com/hotel/your-hotel"
- **WhatsApp**: text input, placeholder "+91 98765 43210"
- **Instagram**: text input, placeholder "https://instagram.com/yourhotel"
- **Facebook**: text input, placeholder "https://facebook.com/yourhotel"
- **Twitter / X**: text input, placeholder "https://x.com/yourhotel"
- **Phone**: shows "Auto: tel:{contactInfo.phone}" as a muted badge. Toggle to override with custom input.
- **Email**: shows "Auto: mailto:{contactInfo.email}" as a muted badge. Toggle to override.
- **Maps**: shows "Auto: Google Maps" as a muted badge. Toggle to override with custom URL.

"Save Links" button → PUT `/api/hotels/[id]` with `{ links: formData }`. Save status: idle → saving → saved. `router.refresh()` on success.

Use glassmorphism styling (glass-card-static). Inputs match dashboard theme.

- [ ] **Step 2: Add LinksEditor to hotel detail page**

Read `src/app/(dashboard)/hotels/[id]/page.tsx`. After the existing hotel header card and before the tabs section, add a new "Links" card:

```tsx
<div className="glass-card-static rounded-xl p-5">
  <h3 className="text-sm font-semibold mb-4">Smart Links</h3>
  <LinksEditor
    hotelId={id}
    links={(hotel.links as Record<string, string>) || {}}
    contactInfo={(hotel.contactInfo as Record<string, any>) || {}}
  />
</div>
```

Serialize hotel.links for the client component.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | grep -E "✓|Error"`

---
