# Smart Links — Design Spec

**Goal:** Replace hardcoded `#booking` and `#` links across all components with a smart token system that resolves to real URLs (booking engines, tel:, mailto:, Google Maps, social media) from a central hotel-level link registry.

**Decisions:**
- Central link registry (JSON field on Hotel) + smart tokens ({{booking}}, {{phone}}, etc.)
- "auto" derivation from contactInfo for phone/email/maps
- Resolver runs in preview renderer — components receive resolved URLs, no component code changes needed

---

## 1. Hotel Links Registry

### Schema change

Add to Hotel model in `prisma/schema.prisma`:
```prisma
  links Json @default("{}") @map("links")
```

### Default structure

```json
{
  "booking": "",
  "phone": "auto",
  "email": "auto",
  "maps": "auto",
  "whatsapp": "",
  "instagram": "",
  "facebook": "",
  "twitter": ""
}
```

### Resolution rules
- `"auto"` → derived from hotel.contactInfo at render time
- `""` → not configured, resolves to `#` (safe fallback)
- Any other string → used as-is

### Auto-derivation logic
- phone: `"auto"` → `tel:{contactInfo.phone}` (strip spaces)
- email: `"auto"` → `mailto:{contactInfo.email}`
- maps: `"auto"` → if coordinates exist: `https://www.google.com/maps?q={lat},{lng}`, else `https://www.google.com/maps/search/{encodeURIComponent(address + city + country)}`

### Files
- Modify: `prisma/schema.prisma` — add links field to Hotel
- Run migration

---

## 2. Smart Token System

### Token format
`{{type}}` or `{{type:param}}`

### Supported tokens

| Token | Resolves To | Source |
|-------|------------|--------|
| `{{booking}}` | Booking URL | hotel.links.booking |
| `{{phone}}` | tel: link | hotel.contactInfo.phone or links.phone override |
| `{{email}}` | mailto: link | hotel.contactInfo.email or links.email override |
| `{{maps}}` | Google Maps URL | hotel.contactInfo.coordinates/address or links.maps override |
| `{{whatsapp}}` | https://wa.me/{number} | hotel.links.whatsapp |
| `{{instagram}}` | Instagram URL | hotel.links.instagram |
| `{{facebook}}` | Facebook URL | hotel.links.facebook |
| `{{twitter}}` | Twitter/X URL | hotel.links.twitter |
| `{{page:slug}}` | /preview/{hotelId}/{slug} | Page lookup by slug |

### Resolver utility

**File:** `src/lib/smart-links.ts`

```typescript
function resolveSmartLink(token: string, hotel: HotelWithLinks, hotelId: string): string
// "{{booking}}" → "https://booking.com/hotel/123"
// "{{phone}}" → "tel:+914132223456"
// "{{page:rooms}}" → "/preview/uuid/rooms"
// "https://example.com" → "https://example.com" (passthrough)

function resolvePropsLinks(props: Record<string, unknown>, hotel: HotelWithLinks, hotelId: string): Record<string, unknown>
// Walks all string values in props, resolves any {{...}} tokens
// Non-string values pass through unchanged
```

Backward compatible — raw URLs that don't contain `{{` pass through unchanged.

### Files
- Create: `src/lib/smart-links.ts`

---

## 3. Component Link Audit — What Changes

### Components that need smart tokens in default props

| Component | Prop | Old Default | New Default |
|-----------|------|-------------|-------------|
| hero_cinematic | ctaLink | `#booking` | `{{booking}}` |
| hero_editorial | ctaLink | `#rooms` | `{{booking}}` |
| hero_minimal | ctaLink | `#booking` | `{{booking}}` |
| booking_inline | externalUrl | `""` | `{{booking}}` |
| booking_sticky | externalUrl | `""` | `{{booking}}` |

### Components with hardcoded links to fix

| Component | Hardcoded Link | Fix |
|-----------|---------------|-----|
| BookingSticky | `href="tel:+1800000000"` | Use phone from props/hotel data |
| RoomsGrid | `href="#booking"` per card | Use ctaLink prop (add if missing) |
| RoomsShowcase | `href="#booking"` per card | Use ctaLink prop |
| FooterRich | socialLinks array `href="#"` | Use social link props from hotel data |
| FooterRich | quickLinks `#rooms`, `#dining` | Use `{{page:slug}}` tokens |
| FooterRich | Privacy/Terms/Cookie `href="#"` | Leave as `#` (out of scope for now) |

### Files
- Modify: `src/lib/component-registry.ts` — update defaultProps for 5 components
- Modify: `src/components/renderer/variants/BookingSticky.tsx` — use hotel phone from props
- Modify: `src/components/renderer/variants/RoomsGrid.tsx` — use ctaLink prop instead of hardcoded
- Modify: `src/components/renderer/variants/RoomsShowcase.tsx` — use ctaLink prop
- Modify: `src/components/renderer/variants/FooterRich.tsx` — use social links from props, use page links

---

## 4. Renderer Integration

### Preview page modification

In `src/app/preview/[hotelId]/[pageSlug]/page.tsx`, before passing props to sections:

```typescript
import { resolvePropsLinks } from "@/lib/smart-links";

// For each section, resolve smart links in props
const resolvedProps = resolvePropsLinks(section.props, hotel, hotel.id);
```

Pass `resolvedProps` instead of raw `section.props` to the renderer. This means every component receives fully resolved URLs without knowing about the token system.

Also pass hotel links data to FooterRich (for social links) and BookingSticky (for phone) as enriched props — same pattern already used for rooms/media data injection.

### Files
- Modify: `src/app/preview/[hotelId]/[pageSlug]/page.tsx`

---

## 5. CMS Links Editor UI

### New component: LinksEditor

**File:** `src/components/cms/LinksEditor.tsx`

"use client" component. Props: `{ hotelId, links, contactInfo }`.

Form fields:
- **Booking URL** — text input, placeholder "https://booking.com/hotel/your-hotel"
- **WhatsApp** — text input, placeholder "+91 98765 43210". Auto-formats to wa.me link.
- **Instagram** — text input, placeholder "https://instagram.com/yourhotel"
- **Facebook** — text input, placeholder "https://facebook.com/yourhotel"
- **Twitter** — text input, placeholder "https://x.com/yourhotel"
- **Phone** — shows "Auto: tel:{phone}" with toggle to override
- **Email** — shows "Auto: mailto:{email}" with toggle to override
- **Maps** — shows "Auto: Google Maps link" with toggle to override

"Save Links" button → PUT `/api/hotels/[id]` with `{ links: {...} }`.

### Where it appears

Add as a card on the hotel detail page (`/hotels/[id]`) below the existing info, or as a section within the existing hotel edit flow. Also accessible from the "Links" nav if we add one.

### Files
- Create: `src/components/cms/LinksEditor.tsx`
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx` — render LinksEditor

---

## Out of Scope
- Link analytics (click tracking)
- QR code generation for links
- Short URL generation
- Privacy Policy / Terms page builder
- Deep linking into specific rooms (room-level booking URLs)
