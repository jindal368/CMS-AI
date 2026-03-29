# Smooth Animations — Design Spec

**Goal:** Add smooth, elegant CSS animations across the entire Hotel CMS — dashboard, modals, page builder, feedback states, and public hotel websites — for a premium user experience.

**Approach:** Pure CSS keyframes + Tailwind utility classes. No new dependencies. Zero bundle impact on server components.

**Personality:** Smooth & Elegant — 400-600ms durations, spring-like deceleration easing, medium movement distances (16-24px). Fits the hotel/hospitality product.

---

## 1. Animation Foundation

### Timing Tokens (CSS custom properties in `globals.css`)

```
--duration-fast: 300ms     (hover states, toggles, small interactions)
--duration-normal: 500ms   (card entrances, modal transitions)
--duration-slow: 700ms     (page transitions, scroll reveals)
--easing-smooth: cubic-bezier(0.16, 1, 0.3, 1)    (spring-like deceleration)
--easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1) (slight overshoot for celebration)
```

### Keyframes (6 total, defined in `globals.css`)

- `fade-in` — opacity 0→1
- `fade-slide-up` — opacity 0→1 + translateY(20px→0)
- `fade-slide-down` — opacity 0→1 + translateY(-12px→0)
- `scale-fade-in` — opacity 0→1 + scale(0.95→1)
- `slide-in-right` — translateX(100%→0)
- `slide-in-left` — translateX(-100%→0)

### Utility Classes

- `.animate-in` — applies `fade-slide-up` with `--duration-normal` and `--easing-smooth`, `animation-fill-mode: both`
- `.animate-in-delay-1` through `.animate-in-delay-5` — adds `animation-delay` of 100ms, 200ms, 300ms, 400ms, 500ms
- `.animate-modal` — applies `scale-fade-in` with `--duration-normal`
- `.animate-modal-out` — reverse scale-fade, 200ms
- `.animate-slide-right` — applies `slide-in-right` with 400ms
- `.animate-slide-left` — applies `slide-in-left` with 400ms
- `.animate-fade` — applies `fade-in` with `--duration-fast`
- `.animate-on-scroll` — invisible by default (opacity:0, translateY:20px), animated when `.is-visible` is added

### Files
- Modify: `src/app/globals.css` — add tokens, keyframes, utility classes

---

## 2. CMS Dashboard & Pages

### Dashboard (`/dashboard`)
- Org stats card: `.animate-in` on mount
- Property cards: staggered `.animate-in-delay-1` through `-delay-5` on each card
- Action queue groups (Critical/Warning/Info): each group uses `.animate-in` with increasing delays
- Health grade badges: subtle scale-bounce on mount

### Hotels list (`/hotels`)
- Hotel cards: staggered `animate-in-delay-N`
- "Create Hotel" button: no animation (always visible)

### Hotel detail (`/hotels/[id]`)
- Header section (avatar + name + stats): `.animate-in`
- Stat counters: staggered entrance
- Smart Links section: `.animate-in-delay-2` (appears after header)
- Pages list: staggered card entrance
- Tab content: `.animate-fade` on tab switch

### Brand page (`/brand`)
- Three glass cards: staggered `.animate-in-delay-1` through `-delay-3`

### Other pages (Team, Campaigns, Components)
- Same pattern: heading `.animate-in`, card grid staggers

### Files
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/app/(dashboard)/hotels/page.tsx` (server component, add classes to JSX — no client wrapper needed)
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx`
- Modify: `src/app/(dashboard)/brand/page.tsx`
- Modify: `src/app/(dashboard)/campaigns/page.tsx`
- Modify: `src/app/(dashboard)/team/page.tsx`
- Modify: `src/app/(dashboard)/components/page.tsx`

---

## 3. Modals & Dialogs

### All modals (Create Hotel, Add Section, Conflict, etc.)
- **Backdrop:** `animate-fade` — opacity 0→1, 300ms
- **Content panel:** `.animate-modal` — scale(0.95)→scale(1) + opacity 0→1, 400ms smooth easing
- **Close:** toggle CSS class from `.animate-modal` to `.animate-modal-out` (scale 1→0.95 + opacity 1→0, 200ms), then remove modal from DOM after `animationend` event

### Add Section modal
- Category filter tabs: no animation (instant)
- Component cards: staggered `animate-in-delay-N` when category changes
- Cards that remain on filter: `transition: transform 300ms`

### Confirmation dialogs (delete)
- Same `scale-fade-in` but 300ms (faster — urgency)

### Files
- Modify: `src/components/cms/CreateHotelModal.tsx`
- Modify: `src/components/cms/AddSectionModal.tsx`
- Modify: `src/components/cms/ConflictModal.tsx`

---

## 4. Page Builder Interactions

### Section list (left panel)
- Add section: new card slides down with fade, existing cards reposition via `transition: transform 300ms`
- Remove section: card fades out + height collapses, 300ms
- Reorder (move up/down): cards swap positions with `transition: transform 300ms` (smooth slide instead of instant jump)

### Floating panels
- AI Logs panel: `.animate-slide-right` — slide from off-screen right, 400ms
- AI Diff panel: `.animate-slide-left` — slide from off-screen left, 400ms
- Close: reverse slide-out, 250ms

### AI command bar
- Spinner: existing `animate-spin` (unchanged)
- Progress timer: `.animate-fade` on appear

### Preview iframe
- On refresh: opacity dip (0.5→1), 300ms — signals reload without jarring flash

### Files
- Modify: `src/components/cms/PageBuilder.tsx`
- Modify: `src/components/cms/AIActionBar.tsx`

---

## 5. Feedback & Status

### Toast notification system (new)
- New component: `src/components/ui/Toast.tsx` — "use client"
- Slides down from top-right + fade in, 400ms smooth easing
- Auto-dismiss after 3s with fade-out, 300ms
- Uses a global event emitter pattern: `window.dispatchEvent(new CustomEvent('toast', { detail }))` — any component can trigger
- Types: success (green), error (red), info (blue)
- Rendered in root layout via `<ToastContainer />`

### Publish/unpublish
- Status badge: `transition: background-color 500ms, color 500ms` — morphs from gray "Draft" to green "Live"
- "View Live" link: `.animate-fade` with 300ms delay

### All status badges
- Health grades, live/draft, SEO scores: `transition: background-color 500ms, color 500ms`

### Loading states
- Keep existing `animate-spin`
- Button loading: text fades to spinner, button width stays constant (no layout shift)

### Files
- Create: `src/components/ui/Toast.tsx`
- Modify: `src/app/layout.tsx` — add `<ToastContainer />`
- Modify: `src/components/cms/PublishButton.tsx`

---

## 6. Public Hotel Website (Scroll Reveals)

### Scroll observer (`src/lib/scroll-observer.ts`)
- ~15 lines, uses `IntersectionObserver` with `threshold: 0.15`
- Watches `.animate-on-scroll` elements
- Adds `.is-visible` class on viewport entry
- Fires once per element (unobserves after trigger)
- Loaded only on public site routes (not CMS)

### Client wrapper (`src/components/site/ScrollAnimator.tsx`)
- "use client" component that initializes the observer on mount
- Wraps public site page content

### Section animations on public site
- Hero: immediate render (no scroll trigger — above fold)
- Amenities grid: each card staggers in on scroll
- CTA banner: fade-slide-up on scroll
- Testimonial carousel: fade-in on scroll
- FAQ accordion: staggered fade-slide-up on scroll
- Footer: fade-in on scroll
- Property directory cards: stagger on scroll

### Accordion animation
- Answer height: `transition: max-height 400ms ease` from `0` to `300px`
- Content: fade-in with 100ms delay after height transition starts

### Files
- Create: `src/lib/scroll-observer.ts`
- Create: `src/components/site/ScrollAnimator.tsx`
- Modify: `src/app/site/[orgSlug]/[[...path]]/page.tsx`
- Modify: `src/components/renderer/variants/FaqAccordion.tsx`

---

## Out of Scope

- Exit animations for page navigation (would require View Transitions API — future)
- Drag-and-drop animation during reorder (current up/down buttons suffice)
- Confetti or particle effects on publish
- Animation preferences / reduced-motion toggle in settings
- Animated charts or data visualizations

## Accessibility

- All animations respect `prefers-reduced-motion: reduce` — a single media query at the top of the animation definitions disables all custom animations and transitions for users who prefer reduced motion
