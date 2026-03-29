# Apple-Refined UI Redesign — Design Spec

**Goal:** Redesign the Hotel CMS to use desktop width effectively and achieve an Apple-like aesthetic — refined typography, generous whitespace, adaptive widths per page, and polished component styling — while keeping the existing glassmorphism identity.

**Approach:** CSS and class-level changes only. No new components or structural rewrites. Upgrade typography scale, spacing rhythm, card styling, and per-page max-widths. Restructure dashboard layout to use width better.

---

## 1. Typography & Spacing System

### Typography

- Page titles (H1 in top bar or page heading): `text-2xl` → `text-3xl font-semibold tracking-tight`
- Section headings (H2 like "Properties", "Action Queue"): `text-sm font-semibold` → `text-xl font-semibold tracking-tight`
- Card titles (H3 like hotel names): keep `font-semibold`, add `tracking-tight`
- Labels/captions (uppercase small text): `text-xs tracking-wider` → `text-[11px] font-medium tracking-wide uppercase` with color `text-[#86868b]`
- Body text: unchanged

### Spacing

- Page content padding: `p-6` → `p-8` (32px)
- Section vertical gaps: `space-y-6` → `space-y-8`
- Card internal padding: standardize to `p-5` (20px)
- Grid gaps between cards: `gap-4` → `gap-5`

### Files
- Modify: `src/app/globals.css` — update card border-radius
- Modify: `src/app/(dashboard)/layout.tsx` — padding, top bar height
- All dashboard page files — typography class updates

---

## 2. Adaptive Width Zones

| Page | Current | New |
|------|---------|-----|
| Dashboard | `max-w-7xl` (1280px) | `max-w-[1600px]` |
| Hotels list | implicit narrow | `max-w-[1600px]` |
| Hotel detail | `max-w-5xl` (1024px) | `max-w-6xl` (1152px) |
| Campaigns | `max-w-4xl` (896px) | `max-w-6xl` (1152px) |
| Components | implicit narrow | `max-w-[1600px]` |
| Brand | `max-w-2xl` (672px) | Keep (form page) |
| Team | current | Keep (compact list) |

### Top bar
- Height: `h-14` (56px) → `h-12` (48px) — sleeker

### Files
- Modify: `src/app/(dashboard)/layout.tsx` — top bar height
- Modify: each page file — max-width classes

---

## 3. Card & Component Refinements

### Glass cards (`globals.css`)
- Border-radius: `12px` → `16px`
- Shadow: `0 4px 16px rgba(0,0,0,0.04)` → `0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06)`
- Hover shadow: → `0 8px 24px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)`
- Hover lift: `translateY(-2px)` → `translateY(-3px)`

### Status badges
- Padding: `px-2.5 py-1` → `px-2.5 py-0.5`
- Font: `text-xs` → `text-[11px] font-medium`
- Dot size: `w-1.5 h-1.5` → `w-[5px] h-[5px]`

### Buttons
- Add `tracking-wide` to primary buttons
- Border-radius: `rounded-lg` → `rounded-xl`

### Inputs
- Border-radius: `rounded-lg` → `rounded-xl`
- Focus: add `focus:ring-2 focus:ring-[#7c5cbf]/20` alongside existing focus border

### Sidebar nav
- Icon container border-radius: `rounded-lg` → `rounded-xl`

### Files
- Modify: `src/app/globals.css` — glass card styles
- Modify: `src/components/sidebar-nav.tsx` — icon border-radius
- Modify: `src/components/cms/CreateHotelModal.tsx` — input + button radius
- Modify: `src/components/cms/PublishButton.tsx` — badge sizing

---

## 4. Dashboard Layout Redesign

### Stats row (replaces inline badges)
Currently the org stats are cramped inline badges. Replace with a full-width row of 3 mini stat cards:

```
[ 8 Properties ]  [ Avg Grade: D ]  [ 26 Actions ]
```

Each stat card: `glass-card-static p-4 flex items-center gap-3` in a `grid grid-cols-3 gap-5` row.

### Property grid
- Remove the fixed-width action queue sidebar (`w-80`)
- Grid: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-3` with `gap-5`
- Cards: `p-5` internal padding (up from `p-4`)

### Action Queue
- Moves from right sidebar to below properties as a full-width section
- Heading: "Action Queue (26)" — same style as "Properties" heading
- Items: `grid-cols-1 lg:grid-cols-2 xl:grid-cols-3` grid layout
- Collapsible: starts expanded, click heading to collapse

### Files
- Modify: `src/app/(dashboard)/dashboard/page.tsx` — restructure layout

---

## 5. Hotel Detail Page Layout

### Header
- Avatar: `w-11 h-11` → `w-14 h-14` (56px)
- Hotel name: `text-lg font-bold` → `text-2xl font-semibold tracking-tight`
- Stats: horizontal row of mini-pills with proper spacing

### Two-column layout below header
- **Left column (60%):** Pages list + tab content — primary workspace
- **Right column (40%):** Smart Links card + Hotel info card — reference panels

Use: `flex gap-6` with left `flex-[3]` and right `flex-[2]`

This eliminates excessive vertical scrolling by showing pages and smart links side by side.

### Files
- Modify: `src/app/(dashboard)/hotels/[id]/page.tsx` — two-column layout, typography

---

## 6. Other Pages

### Hotels list (`/hotels`)
- Container: `max-w-[1600px]`
- Grid: `grid-cols-3 xl:grid-cols-4 gap-5`
- Heading: `text-2xl font-semibold tracking-tight`

### Campaigns (`/campaigns`)
- Container: `max-w-6xl`
- Grid: `grid-cols-2 xl:grid-cols-3`

### Components (`/components`)
- Container: `max-w-[1600px]`
- Grid: `grid-cols-3 xl:grid-cols-4`

### Team & Brand
- Keep current widths
- Apply typography + spacing upgrades only

### Login/Register
- Keep centered `max-w-md`
- Inputs: `rounded-xl`
- Typography refinements

### Files
- Modify: `src/app/(dashboard)/hotels/page.tsx`
- Modify: `src/app/(dashboard)/campaigns/page.tsx`
- Modify: `src/app/(dashboard)/components/page.tsx`
- Modify: `src/app/(dashboard)/team/page.tsx`
- Modify: `src/app/(dashboard)/brand/page.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

---

## Out of Scope

- Dark mode toggle
- Custom font loading (SF Pro is Apple-proprietary — we keep Geist which is similar)
- Sidebar width changes (already compact at 56px)
- Page Builder layout changes (already full-width 3-panel)
- Public hotel website styling (separate concern)
- Mobile responsive improvements
